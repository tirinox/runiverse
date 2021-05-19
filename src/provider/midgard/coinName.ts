import { BigNumber } from 'bignumber.js'

export enum CoinName {
    Bnb = 'BNB.BNB',
    BnbBusd = 'BNB.BUSD-BD1',
    BnbBusdTest1 = 'BNB.BUSD-BAF',
    BnbBusdTest2 = 'BNB.BUSD-74E',

    BnbBtc = 'BNB.BTCB-1DE',
    BnbBtcTest = 'BNB.BTCB-101',
    Btc = 'BTC.BTC',

    BnbEth = 'BNB.ETH-1C9',
    BnbEthTest = 'BNB.ETH-D5B',

    RuneBnb = 'BNB.RUNE-B1A',
    RuneBnbTest = 'BNB.RUNE-67C',
    RuneNative = 'THOR.RUNE',
    RuneEth = 'ETH.RUNE-0x3155ba85d5f96b2d030a4966af206230e46849cb',
    Rune = RuneNative,

    BnbUsdt = 'BNB.USDT-6D8',
    BnbUsdtTest = 'BNB.USDT-DC8',
    EthUsdt = 'ETH.USDT-0X62E273709DA575835C7F6AEF4A31140CA5B1D190'
}

export function isRune(coin: CoinName): boolean {
    return [
        CoinName.RuneNative,
        CoinName.RuneBnb,
        CoinName.RuneBnbTest,
        CoinName.RuneEth,
    ].includes(coin)
}

export function isRuneStr(coin: string): boolean {
    return isRune(<CoinName>coin)
}

export function isStableCoin(coin: CoinName): boolean {
    return [
        CoinName.BnbUsdt,
        CoinName.BnbUsdtTest,
        CoinName.EthUsdt,
        CoinName.BnbBusd,
        CoinName.BnbBusdTest1,
        CoinName.BnbBusdTest2
    ].includes(coin)
}

export function isStableCoinStr(coin: string): boolean {
    return isStableCoin(<CoinName>coin)
}

export function parseThorBigNumber(x: string): number {
    const bn = new BigNumber(x)
    const bn1 = bn.div(new BigNumber(1e8))
    return bn1.toNumber()
}
