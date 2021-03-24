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
            this.runeDepth === other.runeDepth &&
            this.assetDepth == other.assetDepth &&
            this.units == other.units &&
            this.isEnabled == other.isEnabled
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
            const url = this.urlGen.poolDetailsV1(pools)
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