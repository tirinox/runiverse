import asyncio
import os

import aiohttp
import json

DEFAULT_OUT_FILE = os.path.join('out', 'record1.json')


class EventContinuousRecorder:
    def __init__(self, filename=DEFAULT_OUT_FILE, period=1.0) -> None:
        self.data = []
        self.filename = filename
        self.period = period

    def save(self):
        with open(self.filename, 'w') as f:
            json.dump(self.data, f, indent=4)

    async def run(self):
        while True:
            print('tick!')
            await asyncio.sleep(self.period)


async def main(recorder):
    recorder = EventContinuousRecorder()
    await recorder.run()
    return recorder


async def close(recorder):
    recorder.save()



if __name__ == '__main__':
    recorder = EventContinuousRecorder()
    try:
        asyncio.run(main(recorder))
    except KeyboardInterrupt:
        asyncio.run(close(recorder))
    finally:
        print('Program finished')
