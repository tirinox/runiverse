import asyncio
import datetime
import os
import time

import aiohttp
import json

from aiohttp import ClientSession

from analizer import Analyzer

OUT_DIRECTORY = 'out'
DEFAULT_OUT_FILE = os.path.join(OUT_DIRECTORY, 'record_default.json')


class Midgard:
    BASE_URL = 'https://midgard.thorchain.info/v2/'

    def __init__(self, session: ClientSession):
        self.session = session
        self.retries = 3

    async def _get(self, path: str):
        for try_no in range(self.retries):
            try:
                path = path.rstrip('/')
                url = f'{self.BASE_URL}{path}'

                print(f'Get "{url}"...', end='')
                async with self.session.get(url) as resp:
                    print(f' finished! Status = {resp.status}.')
                    return await resp.json()
            except Exception as e:
                print(f'(!) Error {e}')

    async def get_actions(self, offset, limit=50):
        return await self._get(f'actions?offset={offset}&limit={limit}')

    async def get_pool_state(self):
        return await self._get('pools')


class EventContinuousRecorder:
    @staticmethod
    def new_session(midgard: Midgard, period=1.0):
        formatted_date = datetime.datetime.now().isoformat()
        name = os.path.join(OUT_DIRECTORY, f'record_{formatted_date}.json')
        return EventContinuousRecorder(name, period, midgard)

    def __init__(self, filename=DEFAULT_OUT_FILE, period=1.0, midgard: Midgard = None) -> None:
        self.data = []
        self.filename = filename
        self.period = period
        self.midgard = midgard
        self.pool_anal = Analyzer(sort_function=lambda x: x['asset'])
        self.tx_anal = Analyzer()

    def save(self):
        with open(self.filename, 'w') as f:
            json.dump(self.data, f, indent=4)

    async def run(self):
        tick = 1
        start = time.monotonic()
        print(f'Starting event recording session; out = {self.filename!r}')

        self.pool_anal = Analyzer()

        while True:

            pools, actions = await asyncio.gather(
                self.midgard.get_pool_state(),
                self.midgard.get_actions(0, 50)
            )

            pool_diff = self.pool_anal.feed(pools)
            tx_diff = self.tx_anal.feed(actions)

            print(tx_diff)

            await asyncio.sleep(self.period)


            elapsed = (time.monotonic() - start)

            print(f'[{int(elapsed)}s] Tick #{tick}')
            tick += 1


async def main():
    global recorder
    async with aiohttp.ClientSession() as session:
        midgard = Midgard(session)
        recorder = EventContinuousRecorder.new_session(midgard)
        await recorder.run()
    return recorder


async def close(recorder: EventContinuousRecorder):
    recorder.save()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        asyncio.run(close(recorder))
    finally:
        print('Program finished')
