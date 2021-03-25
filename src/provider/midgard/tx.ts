import {
    Tx,
    TxDetails as TxDetailsV1,
    TxDetailsStatusEnum,
    TxDetailsTypeEnum,
    Coin as CoinV1
} from "@/provider/midgard/v1";
import {
    Action as TxDetailsV2,
    ActionStatusEnum,
    ActionTypeEnum,
    Metadata,
    Transaction,
    Coin
} from "@/provider/midgard/v2";
import {warn} from "three";


export class ThorTransaction implements TxDetailsV2 {
    constructor(
        public _in: Array<Transaction>,
        public date: string,
        public height: string,
        public metadata: Metadata,
        public out: Array<Transaction>,
        public pools: Array<string>,
        public status: ActionStatusEnum,
        public type: ActionTypeEnum) {
    }

    public static TxV1toV2(tx: Tx): Transaction {
        return {
            address: tx.address!,
            txID: tx.txID!,
            coins: tx.coins!.map((c: CoinV1) => ({
                amount: c.amount!,
                asset: c.asset!
            }))
        }
    }

    public static fromMidgardV1(j: TxDetailsV1) {
        let actionType: ActionTypeEnum
        let in_tx: Array<Transaction> = j._in ? [ThorTransaction.TxV1toV2(j._in!)] : []
        let out_tx: Array<Transaction> = j.out!.map((tx: Tx) => ThorTransaction.TxV1toV2(tx))
        let pools: Array<string> = (j.pool && j.pool !== '.') ? [j.pool] : []
        let meta: Metadata = {}  // todo: fill this!
        const date = (BigInt(j.date!) * 1_000_000_000n).toString()
        const status = j.status! == TxDetailsStatusEnum.Success ? ActionStatusEnum.Success : ActionStatusEnum.Pending

        if (j.type == TxDetailsTypeEnum.Stake) {
            actionType = ActionTypeEnum.AddLiquidity
        } else if (j.type == TxDetailsTypeEnum.Swap) {
            actionType = ActionTypeEnum.Swap
        } else if (j.type == TxDetailsTypeEnum.DoubleSwap) {
            if(out_tx.length && out_tx[0].coins.length) {
                pools.push(out_tx[0].coins[0].asset)
            }
            actionType = ActionTypeEnum.Swap
        } else if (j.type == TxDetailsTypeEnum.Unstake) {
            actionType = ActionTypeEnum.Withdraw
        } else if (j.type == TxDetailsTypeEnum.Add) {
            actionType = ActionTypeEnum.Donate
        } else if (j.type == TxDetailsTypeEnum.Refund) {
            actionType = ActionTypeEnum.Refund
        } else {
            throw new Error('not implemented')
        }

        return new ThorTransaction(in_tx, date, j.height!, meta, out_tx, pools, status, actionType)
    }

    public static fromMidgardV2(j: TxDetailsV2) {
        return new ThorTransaction(j._in, j.date, j.height, j.metadata, j.out, j.pools, j.status, j.type)
    }

}

export class TxBatch {
    public totalCount: number = 0
    public txs: ThorTransaction[] = []

    constructor(totalCount: number, txs: ThorTransaction[]) {
        this.totalCount = totalCount;
        this.txs = txs;
    }

    public static fromMidgardV1(txs: Array<TxDetailsV1>, totalCount: number) {
        return new TxBatch(totalCount, txs.map((v) => ThorTransaction.fromMidgardV1(v)))
    }

    public static fromMidgardV2(txs: Array<TxDetailsV2>, totalCount: number) {
        return new TxBatch(totalCount, txs.map((v) => ThorTransaction.fromMidgardV2(v)))
    }
}