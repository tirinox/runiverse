import asyncio
import datetime
import os
import time
from operator import itemgetter

import aiohttp
import json

from analizer import ListAnalyzer
from midgard import Midgard, action_get_hash

OUT_DIRECTORY = 'out'
DEFAULT_OUT_FILE = os.path.join(OUT_DIRECTORY, 'record_default.json')


class EventContinuousRecorder:
    @staticmethod
    def new_session(midgard: Midgard, period=1.0):
        formatted_date = datetime.datetime.now().isoformat().replace('/', '-')
        name = os.path.join(OUT_DIRECTORY, f'record_{formatted_date}.json')
        return EventContinuousRecorder(name, period, midgard)

    def __init__(self, filename=DEFAULT_OUT_FILE, period=1.0, midgard: Midgard = None) -> None:
        self.data = []
        self.filename = filename
        self.period = period
        self.midgard = midgard
        self._create_analizers()
        self._t_start = 0
        self._i = 0
        self.save_every_events = 10

    def _create_analizers(self):
        self.pool_anal = ListAnalyzer(key_fuction=lambda x: x['asset'], need_sort=True)
        # significant_keys=['runeDepth', 'assetDepth', 'units', 'status']
        self.tx_anal = ListAnalyzer(key_fuction=action_get_hash, need_sort=False)

    def save(self):
        with open(self.filename, 'w') as f:
            json.dump(self.data, f, indent=4)

    def _add_event(self, type, evt):
        self.data.append({
            'timestamp': datetime.datetime.now().timestamp(),
            'sec_from_start': time.monotonic() - self._t_start,
            'type': type,
            'event': evt
        })
        self._i += 1
        if self._i >= self.save_every_events:
            self.save()
            self._i = 0

    async def run(self):
        tick = 1
        self._t_start = start = time.monotonic()
        print(f'Starting event recording session; out = {self.filename!r}')

        self._create_analizers()

        ticks = []
        try:
            while True:
                await asyncio.sleep(self.period)

                this_tick_start = time.monotonic()
                pools, actions = await asyncio.gather(
                    self.midgard.get_pool_state(),
                    self.midgard.get_actions(0, 50)
                )

                if not pools or not isinstance(pools, list):
                    print('👺 Warning: pools is not a filled list:', pools)
                    continue

                if not actions or not isinstance(actions, list):
                    print('👺 Warning: actions is not a filled list:', actions)
                    continue

                pool_diff = self.pool_anal.feed(pools)
                if not self.pool_anal.is_empty_result(pool_diff):
                    print(f'Pool evt = {self.pool_anal.changes_count(pool_diff)} items')
                    self._add_event('pool_event', pool_diff)

                tx_diff = self.tx_anal.feed(actions)
                if not self.tx_anal.is_empty_result(tx_diff):
                    print(f'Tx evt = {self.tx_anal.changes_count(tx_diff)} items')
                    self._add_event('tx_event', tx_diff)

                elapsed = (time.monotonic() - start)
                this_tick_elapsed = (time.monotonic() - this_tick_start)
                print(f'[{int(elapsed)}s] Tick #{tick}')
                ticks.append({
                    't': this_tick_elapsed,
                    'i': ticks
                })
                tick += 1
        except KeyboardInterrupt:
            print('Interrupted!')
        finally:
            if ticks:
                dts = list(map(itemgetter('t'), ticks))
                min_dt = min(dts)
                max_dt = max(dts)
                avg_dt = sum(dts) / len(dts)
                print(
                    f'Tick summary: total = {len(ticks)} ticks, {min_dt = :.3f} s, {max_dt = :.3f} s, {avg_dt = :.3f} s')


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
