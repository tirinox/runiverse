from aiohttp import ClientSession


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
        result = await self._get(f'actions?offset={offset}&limit={limit}')
        return result.get('actions', [])

    async def get_pool_state(self):
        return await self._get('pools')


def action_get_hash(tx: dict) -> str:
    try:
        in0 = tx['in'][0]
        tx_id = str(in0['txID']).strip()
        if not tx_id:  # probably SWITCH
            date = tx['date']
            block = tx['height']
            addr = in0['address']
            amt = in0['coins'][0]['amount']
            return f'switch-{date}-{block}-{addr}-{amt}'
        else:
            return tx_id
    except LookupError:
        return ''
