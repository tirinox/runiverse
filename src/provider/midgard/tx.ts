import {
    Coin as CoinV1,
    Tx,
    TxDetails as TxDetailsV1,
    TxDetailsStatusEnum,
    TxDetailsTypeEnum
} from "@/provider/midgard/v1";
import {Action as TxDetailsV2, ActionStatusEnum, ActionTypeEnum, Metadata, Transaction} from "@/provider/midgard/v2";

import sha256 from "fast-sha256";
import {hex} from "@/helpers/data_utils";
import {isRuneStr, parseThorBigNumber} from "@/provider/midgard/coinName";
import {arrayNotEmpty} from "@/helpers/iter";


export class ThorTransaction implements TxDetailsV2 {
    constructor(
        public _in: Array<Transaction>,
        public date: string,
        public height: string,
        public metadata: Metadata,
        public out: Array<Transaction>,
        public pools: Array<string>,
        public status: ActionStatusEnum,
        public type: ActionTypeEnum,
        private _lazyHash: string) {
        this.dateTimestampMs = Number(BigInt(date) / 1_000_000n)
    }

    public readonly dateTimestampMs: number

    get computedHash(): string {
        return this._lazyHash
    }

    get inputAddress(): string | null {
        if(this._in.length > 0) {
            const addr = this._in[0].address
            return addr === '' ? null : addr
        }
        return null
    }

    get realInputHash(): string | null {
        if(this._in.length > 0) {
            const txId = this._in[0].txID
            if(this.type == ActionTypeEnum.Switch && arrayNotEmpty(this._in) && arrayNotEmpty(this._in[0].coins)) {
                // txId == '' for switch (sadly)
                const amt = this._in[0].coins[0].amount
                return `${this.date}-${this.inputAddress}-${amt}`
            } else {
                return txId === '' ? null : txId
            }
        }
        return null
    }

    public getRuneVolume(txs: Array<Transaction>, runesPerAsset: number) {
        let sum = 0.0
        for (const tx of txs) {
            for (const coin of tx.coins) {
                const amt = parseThorBigNumber(coin.amount)
                if (isRuneStr(coin.asset)) {
                    sum += amt
                } else {
                    sum += amt * runesPerAsset
                }
            }
        }
        return sum
    }

    runeVolume(runesPerAsset: number): number {
        if (this.type == ActionTypeEnum.Refund
            || this.type == ActionTypeEnum.Withdraw
            || this.type == ActionTypeEnum.Switch
            || this.type == ActionTypeEnum.Swap) {
            return this.getRuneVolume(this.out, runesPerAsset)
        } else if (this.type == ActionTypeEnum.Donate
            || this.type == ActionTypeEnum.AddLiquidity) {
            return this.getRuneVolume(this._in, runesPerAsset)
        }
        return 0.0
    }

    get ageSeconds(): number {
        return (Date.now() - this.dateTimestampMs) / 1_000
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
        // note: j['in'] not j._in! due to a bug
        let in_tx: Array<Transaction> = j['in'] ? [ThorTransaction.TxV1toV2(j['in']!)] : []

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
            if (out_tx.length && out_tx[0].coins.length) {
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

        let lazyHash = this.calcHash(in_tx)!
        return new ThorTransaction(in_tx, date, j.height!, meta, out_tx, pools, status, actionType, lazyHash)
    }

    private static calcHash(in_tx: Array<Transaction>) {
        if (in_tx && in_tx.length && in_tx[0].txID) {
            return in_tx[0].txID
        } else {
            const encoder = new TextEncoder()
            const encodedData = sha256(encoder.encode(JSON.stringify(this)))
            return hex(encodedData)
        }
    }

    public static fromMidgardV2(j: TxDetailsV2) {
        let inArray = typeof j._in !== 'undefined' ? j._in : j['in']
        const lazyHash = this.calcHash(inArray!)
        return new ThorTransaction(inArray!, j.date, j.height, j.metadata, j.out, j.pools, j.status, j.type, lazyHash)
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