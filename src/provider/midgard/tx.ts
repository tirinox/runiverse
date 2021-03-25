import BigNumber from "bignumber.js";

export enum TxType {
    AddLiquidity,
    Withdraw,
    Swap,
    Donate,
    Refund,
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

export class TxBatch {
    public totalCount: number = 0
    public txs: Transaction[] = []

    public static fromMidgardV1() {

    }

    public static fromMidgardV2() {

    }
}