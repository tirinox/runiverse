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
        return Object.values(this.txCache).filter((tx) => tx.dateTimestampMs < beforeTs)
    }

    public processTransactions(newTx: Array<ThorTransaction>): [TxEvent[], boolean] {
        let changes: TxEvent[] = []
        let shouldContinue = false
        for (const tx of newTx) {
            if (!tx || !tx.realInputHash) {
                console.warn(`Tx has no In`, tx)
                continue
            }
            const txHash = tx.realInputHash
            if (!(txHash in this.txCache)) {
                this.txCache[txHash] = tx

                if (tx.ageSeconds <= Config.RealtimeScanner.MaxAgeOfPendingTxSec) {
                    changes.push({
                        type: TxEventType.Add,
                        tx
                    })
                } else {
                    console.debug(`too old`, tx)
                }

                shouldContinue = true

            } else {
                const oldTx = this.txCache[txHash]
                if (tx.status !== oldTx.status) {
                    this.txCache[txHash] = tx

                    changes.push({
                        type: TxEventType.StatusUpdated,
                        tx
                    })

                    shouldContinue = true
                }
            }
        }

        // remove too old pending transactions
        for (const tx of this.allPendingTx) {
            if (tx.ageSeconds > Config.RealtimeScanner.MaxAgeOfPendingTxSec) {
                changes.push({
                    type: TxEventType.Destroy,
                    tx
                })
                delete this.txCache[tx.realInputHash!]
            }
        }

        return [changes, shouldContinue]
    }
}
