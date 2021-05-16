import VisualLog from "@/components/VisualLog.vue";
import {Object3D} from "three";
import {ThorTransaction} from "@/provider/midgard/tx";
import {TxObject} from "@/render/simple/txObject";
import {IPoolQuery, IWalletQuery} from "@/render/simple/interface";
import {randomPointOnSphere} from "@/helpers/3d";


export class TxObjectManager {
    public scene?: Object3D
    public poolMan?: IPoolQuery
    public walletMan?: IWalletQuery

    private static txSourcePlaceRadius: number = 3000

    constructor() {
    }

    private txObjects: Record<string, TxObject> = {}

    private setInitialState(txObj: TxObject) {
        // const tx = txObj.tx!
        // if(tx.type == ActionTypeEnum.Swap) {
        //     txObj.targets = [
        //         ...tx.pools,
        //         WALLET_PREFIX
        //     ]
        // } else if(tx.type == ActionTypeEnum.Switch) {
        //     txObj.targets = [
        //         CORE_NAME
        //     ]
        // } else if(tx.type == ActionTypeEnum.Donate || tx.type == ActionTypeEnum.Refund) {
        //     txObj.targets = [
        //
        //     ]
        // }
    }

    private onReachedTarget(txObj: TxObject) {
        if(txObj.targets.length > 0) {
            txObj.targets.shift()
            if(!txObj.targets.length) {
                this.destroyTransactionMesh(txObj.tx!)
            }
        }
    }

    private updateTxState(txObj: TxObject) {
        if (txObj.isCloseToTarget) {
            this.onReachedTarget(txObj)
        }
    }

    public update(dt: number) {
        for (const txObj of Object.values(this.txObjects)) {
            txObj.update(dt)
            this.updateTxState(txObj)
        }
    }

    public createTransactionMesh(tx: ThorTransaction, runesPerAsset: number) {
        const hash = tx.hash

        if (this.isThereTxMesh(hash)) {
            this.updateTransactionMeshStatus(tx)
            return
        }

        const position = this.walletMan?.findWalletByAddress(tx._in[0].address)?.obj?.position!

        let txObject = new TxObject(tx, runesPerAsset, position)

        this.setInitialState(txObject)

        // store in cache
        this.txObjects[hash] = txObject

        if (this.scene) {
            this.scene.add(txObject.mesh!)
        }

        VisualLog.log(`new tx mesh ${tx.type} ${tx.pools[0]} ${tx.status}`)

        return txObject
    }

    public updateTransactionMeshStatus(tx: ThorTransaction) {
        const txObj = this.txObjects[tx.hash]
        if(txObj) {
            txObj.tx = tx
        }
    }

    public destroyTransactionMesh(tx: ThorTransaction) {
        const hash = tx.hash
        const txObj = this.txObjects[hash]
        if (txObj) {
            VisualLog.log(`deleting tx mesh: ${txObj.tx!.pools[0]}`)

            txObj.dispose()
            delete this.txObjects[hash]
        }
    }

    public isThereTxMesh(txID: string): boolean {
        return txID in this.txObjects
    }
}
