import axios, {AxiosResponse} from "axios";
import BigNumber from "bignumber.js";

export type NetworkId = string
export const TESTNET_MULTICHAIN: NetworkId = 'testnet-multi'
export const CHAOSNET_MULTICHAIN: NetworkId = 'chaosnet-multi'
export const CHAOSNET_BEP2CHAIN: NetworkId = 'chaosnet-bep2'

export const MAX_TX_BATCH_SIZE = 50

export const MIDGARD_V1 = 'v1'
export const MIDGARD_V2 = 'v2'


export class MidgardURLGenerator {
    networkId: NetworkId
    version: string
    midgardUrl: string = ''

    constructor(networkId: NetworkId) {
        this.version = MIDGARD_V2
        this.networkId = networkId
        if (networkId === TESTNET_MULTICHAIN) {
            this.midgardUrl = `https://testnet.midgard.thorchain.info/${this.version}/`
        } else if (networkId === CHAOSNET_BEP2CHAIN) {
            this.version = MIDGARD_V1
            this.midgardUrl = `https://chaosnet-midgard.bepswap.com/${this.version}/`
        } else if (networkId === CHAOSNET_MULTICHAIN) {
            alert("MCCN not implemented")
        } else {
            alert(`Network "${networkId}" is not supported!`)
        }
    }

    txUrl(offset: number = 0, limit: number = MAX_TX_BATCH_SIZE) {
        if (this.version === MIDGARD_V1) {
            return `${this.midgardUrl}txs?offset=${offset}&limit=${limit}`
        } else {
            return `${this.midgardUrl}actions?offset=${offset}&limit=${limit}`
        }
    }

    poolsUrlV2() {
        return `${this.midgardUrl}pools`
    }

    poolsUrlV1() {
        // returns just a list of pools
        return `${this.midgardUrl}pools`
    }

    poolDetailsV1(assets: Array<string>, view: string = 'simple') {
        // returns just a list of pools
        const assetsJoined = assets.join(',')
        return `${this.midgardUrl}pools/detail?asset=${assetsJoined}&view=${view}`
    }
}

export class PoolDetail {
    constructor(public asset: string,
                public assetDepth: BigNumber,
                public runeDepth: BigNumber,
                public isEnabled: boolean,
                public units: BigNumber) {
    }

    static from_midgard_v2(j: any): PoolDetail {
        return new PoolDetail(
            j.asset,
            new BigNumber(j.assetDepth),
            new BigNumber(j.runeDepth),
            j.status == 'enabled',
            new BigNumber(j.units)
        )
    }

    static from_midgard_v1(j: any): PoolDetail {
        return new PoolDetail(
            j.asset,
            new BigNumber(j.assetDepth),
            new BigNumber(j.runeDepth),
            j.status == 'enabled',
            new BigNumber(j.poolUnits)
        )
    }

    get runesPerAsset(): BigNumber {
        return this.runeDepth.div(this.assetDepth)
    }

    get assetsPerRune(): BigNumber {
        return this.assetDepth.div(this.runeDepth)
    }

    public isEqual(other: PoolDetail): boolean {
        return this.asset === other.asset &&
            this.runeDepth.isEqualTo(other.runeDepth) &&
            this.assetDepth.isEqualTo(other.assetDepth) &&
            this.units.isEqualTo(other.units) &&
            this.isEnabled === other.isEnabled
    }

    public sub(other: PoolDetail) {
        return new PoolDetail(
            this.asset,
            this.assetDepth.minus(other.assetDepth),
            this.runeDepth.minus(other.runeDepth),
            this.isEnabled,
            this.units.minus(other.units)
        )
    }

    public toString() {
        const status = this.isEnabled ? 'enabled' : 'bootstraping'
        return `Pool(${this.runeDepth.toString()} R vs ${this.assetDepth.toString()} ${this.asset}, units = ${this.units.toString()}, ${status})`
    }
}

export enum TxType {
    AddLiquidity,
    Withdraw,
    Swap,
    Donate,
    Refund,
}

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


export class Transaction {
    constructor(
        public type: TxType,
        public timestamp: BigInt,
        public asset1: string,
        public amount1: BigNumber,
        public asset2: string,
        public amount2: BigNumber,
        public pools: Array<string>,
    ) {
    }
}

export class Midgard {
    urlGen: MidgardURLGenerator

    constructor(urlGen: MidgardURLGenerator) {
        this.urlGen = urlGen
    }

    async getTxBatch(offset: number = 0, limit: number = MAX_TX_BATCH_SIZE): Promise<AxiosResponse<any>> {
        offset = offset || 0
        limit = limit || 50

        const url = this.urlGen.txUrl(offset, limit)
        return await axios.get(url)
    }

    async getPoolListV1(): Promise<Array<string>> {
        const url = this.urlGen.poolsUrlV1()
        const result = await axios.get(url)
        return result.data
    }

    async getPoolsV2(): Promise<PoolDetail[]> {
        const url = this.urlGen.poolsUrlV2()
        const result = await axios.get(url)
        const poolJson: object[] = result.data
        return poolJson.map((item) => PoolDetail.from_midgard_v2(item))
    }

    async getPoolState(): Promise<PoolDetail[]> {
        if (this.urlGen.version == MIDGARD_V1) {
            const pools = await this.getPoolListV1()
            const url = this.urlGen.poolDetailsV1(pools.sort())
            const result = await axios.get(url)
            const poolJson: object[] = result.data
            return poolJson.map((item) => PoolDetail.from_midgard_v1(item))
        } else {
            return await this.getPoolsV2()
        }
    }
}

// Usage example:
//   const urlGen = new MidgardURLGenerator(CHAOSNET_BEP2CHAIN)
//   const mg = new Midgard(urlGen)
//   mg.getPoolState().then(console.log)
//
//   const urlGen2 = new MidgardURLGenerator(TESTNET_MULTICHAIN)
//   const mg2 = new Midgard(urlGen2)
//   mg2.getPoolState().then(console.log)