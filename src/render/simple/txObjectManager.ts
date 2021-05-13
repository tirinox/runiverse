import VisualLog from "@/components/VisualLog.vue";
import {Object3D, Scene} from "three";
import {ThorTransaction} from "@/provider/midgard/tx";
import {TxObject} from "@/render/simple/txObject";
import {IPoolQuery} from "@/render/simple/interface";

export class TxObjectManager {
    public scene?: Object3D
    public poolMan?: IPoolQuery

    constructor() {
    }

    private txObjects: Record<string, TxObject> = {}

    public update(dt: number) {
        for (const key of Object.keys(this.txObjects)) {
            const txObj = this.txObjects[key]

            txObj.target = this.poolMan?.getPoolObjectOfTxMesh(txObj, 0)

            txObj.update(dt)

            if (txObj.isCloseToTarget) {
                txObj.dispose()
                delete this.txObjects[key]
                VisualLog.log(`deleting tx mesh: ${txObj.tx!.pools[0]}`)
            }
        }
    }

    public createTransactionMesh(tx: ThorTransaction, runesPerAsset: number) {
        const hash = tx.hash

        if (this.isThereTxMesh(hash)) {
            return
        }

        let txObject = new TxObject(tx, runesPerAsset)
        // store in cache
        this.txObjects[hash] = txObject

        if (this.scene) {
            this.scene.add(txObject.mesh!)
        }

        VisualLog.log(`new tx mesh ${tx.type} ${tx.pools[0]} ${tx.status}`)

        return txObject
    }

    public updateTransactionMeshStatus(tx: ThorTransaction) {
    }

    public destroyTransactionMesh(tx: ThorTransaction) {
        const hash = tx.hash
        const mesh = this.txObjects[hash]
        if (mesh) {
            mesh.dispose()
            delete this.txObjects[hash]
        }
    }

    public isThereTxMesh(txID: string): boolean {
        return txID in this.txObjects
    }
}