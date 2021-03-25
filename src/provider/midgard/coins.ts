export enum Coins {
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
    Rune = RuneNative,

    BnbUsdt = 'BNB.USDT-6D8',
    BnbUsdtTest = 'BNB.USDT-DC8',
    EthUsdt = 'ETH.USDT-0X62E273709DA575835C7F6AEF4A31140CA5B1D190'
}

export function isRune(coin: Coins): boolean {
    return [
        Coins.RuneNative,
        Coins.RuneBnb,
        Coins.RuneBnbTest
    ].includes(coin)
}

export function isStableCoin(coin: Coins): boolean {
    return [
        Coins.BnbUsdt,
        Coins.BnbUsdtTest,
        Coins.EthUsdt,
        Coins.BnbBusd,
        Coins.BnbBusdTest1,
        Coins.BnbBusdTest2
    ].includes(coin)
}