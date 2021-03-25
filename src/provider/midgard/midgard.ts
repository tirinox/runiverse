import {DefaultApi as MidgardAPIV1} from "@/provider/midgard/v1/index"
import {DefaultApi as MidgardAPIV2} from "@/provider/midgard/v2/index"
import {PoolDetail} from "@/provider/midgard/poolDetail";


export enum NetworkId {
    TestnetMultiChain = 'testnet-multi',
    ChaosnetSingleBep2 = 'chaosnet-bep2',
    ChaosnetMultiChain = 'chaosnet-multi',
    Mainnet = ChaosnetMultiChain,
}


export enum MidgardVersion {
    V1 = 'v1',
    V2 = 'v2'
}


export class Midgard {
    public readonly networkId: NetworkId;
    private apiV1?: MidgardAPIV1
    private apiV2?: MidgardAPIV2

    static getMidgardBaseUrl(networkId: NetworkId): string {
        if (networkId === NetworkId.TestnetMultiChain) {
            return `https://testnet.midgard.thorchain.info`
        } else if (networkId === NetworkId.ChaosnetSingleBep2) {
            return `https://chaosnet-midgard.bepswap.com`
        } else if (networkId === NetworkId.ChaosnetMultiChain) {
            alert("MCCN not implemented")  // todo! update on MCCN realse
        } else {
            alert(`Network "${networkId}" is not supported!`)
        }
        return ''
    }

    constructor(networkId: NetworkId) {
        this.networkId = networkId

        const url = Midgard.getMidgardBaseUrl(networkId)
        if(networkId == NetworkId.ChaosnetSingleBep2) {
            this.apiV1 = new MidgardAPIV1(undefined, url)
        } else {
            this.apiV2 = new MidgardAPIV2(undefined, url)
        }
    }
    //
    // async getTxBatch(offset: number = 0, limit: number = MAX_TX_BATCH_SIZE): Promise<AxiosResponse<any>> {
    //     offset = offset || 0
    //     limit = limit || 50
    //
    //     const url = this.urlGen.txUrl(offset, limit)
    //     return await axios.get(url)
    // }
    //
    // async getPoolListV1(): Promise<Array<string>> {
    //     const url = this.urlGen.poolsUrlV1()
    //     const result = await axios.get(url)
    //     return result.data
    // }
    //
    // async getPoolsV2(): Promise<PoolDetail[]> {
    //     const url = this.urlGen.poolsUrlV2()
    //     const result = await axios.get(url)
    //     const poolJson: object[] = result.data
    //     return poolJson.map((item) => PoolDetail.from_midgard_v2(item))
    // }

    async getPoolState(): Promise<PoolDetail[]> {
        if (this.apiV1) {
            const pools: Array<string> = (await this.apiV1.getPools()).data.sort()
            const details = (await this.apiV1.getPoolsDetails(pools.join(','), 'simple')).data
            return details.map((item) => PoolDetail.from_midgard_v1(item))
        } else {
            const pools = (await this.apiV2!.getPools()).data
            return pools.map((item) => PoolDetail.from_midgard_v2(item))
        }
    }
}
