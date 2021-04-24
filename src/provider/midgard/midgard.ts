import {DefaultApi as MidgardAPIV1} from "@/provider/midgard/v1/index"
import {Action, DefaultApi as MidgardAPIV2} from "@/provider/midgard/v2/index"
import {PoolDetail} from "@/provider/midgard/poolDetail";
import {TxBatch} from "@/provider/midgard/tx";


export enum NetworkId {
    TestnetMultiChain = 'testnet-multi',
    ChaosnetSingleBep2 = 'chaosnet-bep2',
    ChaosnetMultiChain = 'chaosnet-multi',
    Mainnet = ChaosnetMultiChain,
}

export const MAX_ACTIONS_PER_CALL = 50

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
            return 'https://midgard.thorchain.info'
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

    async getUserActions(start: number, limit: number) {
        console.info(`getUserActions (${start} to ${start + limit})`)
        if(this.apiV1) {
            const data = (await this.apiV1.getTxDetails(start, limit)).data
            return TxBatch.fromMidgardV1(data.txs!, data.count!)
        } else {
            const data = (await this.apiV2!.getActions(limit, start)).data
            return TxBatch.fromMidgardV2(data.actions!, parseInt(data.count!))
        }
    }

    async getPoolState(): Promise<PoolDetail[]> {
        console.info(`getPoolState`)
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
