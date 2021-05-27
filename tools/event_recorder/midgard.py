from aiohttp import ClientSession


class Midgard:
    BASE_URL_MCCN = 'https://midgard.thorchain.info/v2/'
    BASE_URL_SCCN = 'https://chaosnet-midgard.bepswap.com/v1/'

    def __init__(self, session: ClientSession, base_url, is_v2=True):
        self.session = session
        self.retries = 3
        self.base_url = base_url
        self.is_v2 = is_v2

    async def _get(self, path: str):
        for try_no in range(self.retries):
            try:
                path = path.rstrip('/')
                url = f'{self.base_url}{path}'

                print(f'Get "{url}"...', end='')
                async with self.session.get(url) as resp:
                    print(f' finished! Status = {resp.status}.')
                    return await resp.json()
            except Exception as e:
                print(f'(!) Error {e}')

    async def get_actions(self, offset, limit=50):
        if self.is_v2:
            result = await self._get(f'actions?offset={offset}&limit={limit}')
            return result.get('actions', []) if result else None
        else:
            result = await self._get(f'txs?offset={offset}&limit={limit}')
            return result.get('txs', []) if result else None

    async def get_pool_state(self):
        if self.is_v2:
            return await self._get('pools')
        else:
            pool_list = await self._get('pools')
            assets = ','.join(pool_list)
            pool_infos = await self._get(f'pools/detail?view=simple&asset={assets}')
            return pool_infos


def action_get_hash(tx: dict) -> str:
    try:
        in0 = tx['in'][0] if isinstance(tx['in'], list) else tx['in']
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
