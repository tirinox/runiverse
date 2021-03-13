import axios from "axios";

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

export class Midgard {
    urlGen: MidgardURLGenerator

    constructor(urlGen: MidgardURLGenerator) {
        this.urlGen = urlGen
    }

    async getTxBatch(offset: number = 0, limit: number = MAX_TX_BATCH_SIZE) {
        offset = offset || 0
        limit = limit || 50

        const url = this.urlGen.txUrl(offset, limit)
        return await axios.get(url)
    }
}