import {ThorTransaction} from "@/provider/midgard/tx";
import {ActionStatusEnum} from "@/provider/midgard/v2";
import {Config} from "@/config";
import {TxEvent, TxEventType} from "@/provider/types";


export class TxAnalyzer {
    private txCache: Record<string, ThorTransaction> = {}

    // todo: find all old pending tx and recheck their status
    get allPendingTx(): ThorTransaction[] {
        const allKeys: string[] = Object.keys(this.txCache)
        const pendingKeys = allKeys.reduce((accum: string[], k: string) => {
            if (this.txCache[k].status == ActionStatusEnum.Pending) {
                accum.push(k)
            }
            return accum
        }, [])
        return pendingKeys.map((k) => this.txCache[k])
    }

    public filterOldTx(beforeTs: number) {
        return Object.values(this.txCache).filter((tx) => tx.dateTimestamp < beforeTs)
    }

    public processTransactions(inTxs: Array<ThorTransaction>): [TxEvent[], boolean] {
        let changes: TxEvent[] = []
        let shouldContinue = false
        for (const inTx of inTxs) {
            if (!inTx._in.length || !inTx._in[0].txID) {
                console.warn(`Tx has no In or In.txID: ${inTx}`)
                continue
            }

            if (!(inTx.hash in this.txCache)) {
                this.txCache[inTx.hash] = inTx

                if (inTx.age <= Config.MaxAgeOfPendingTxSec) {
                    changes.push({
                        type: TxEventType.Add,
                        tx: inTx
                    })
                } else {
                    console.debug(`too old ${inTx}`)
                }

                shouldContinue = true

            } else {
                const oldTx = this.txCache[inTx.hash]
                if (inTx.status !== oldTx.status) {
                    this.txCache[inTx.hash] = inTx

                    changes.push({
                        type: TxEventType.StatusUpdated,
                        tx: inTx
                    })

                    shouldContinue = true
                }
            }
        }

        // remove too old pending transactions
        for (const tx of this.allPendingTx) {
            if (tx.age > Config.MaxAgeOfPendingTxSec) {
                changes.push({
                    type: TxEventType.Destroy,
                    tx
                })
                delete this.txCache[tx.hash]
            }
        }

        return [changes, shouldContinue]
    }
}