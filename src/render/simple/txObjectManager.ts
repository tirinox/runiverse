import VisualLog from "@/components/VisualLog.vue";
import {Object3D} from "three";
import {ThorTransaction} from "@/provider/midgard/tx";
import {TxObject} from "@/render/simple/txObject";
import {IPoolQuery, IWalletQuery} from "@/render/simple/interface";
import {randomPointOnSphere, ZeroVector3} from "@/helpers/3d";
import {ActionStatusEnum, ActionTypeEnum} from "@/provider/midgard/v2";

const enum TxState {
    Wallet_to_Pool,
    Pool_to_Pool,
    Pool_to_Wallet,
    Wallet_to_Core,
    Core_to_Wallet
}

interface TxObjectMeta {
    objects: Array<TxObject>,
    action: ThorTransaction,
    state: TxState,
    orbiting: boolean,
    poolName: string
}

export class TxObjectManager {
    public scene?: Object3D
    public poolMan?: IPoolQuery
    public walletMan?: IWalletQuery

    private txObjects: Record<string, TxObjectMeta> = {}

    // private onReachedTarget(txObj: TxObject) {
    //     if(txObj.targets.length > 0) {
    //         txObj.targets.shift()
    //         if(!txObj.targets.length) {
    //             this.destroyTransactionMesh(txObj.tx!)
    //         }
    //     }
    // }

    private updateTxState(txMeta: TxObjectMeta, txObj: TxObject) {
        const pos = this.poolMan?.getPoolByName(txMeta.poolName).position
        txObj.force = txObj.myLogForceTo(1e10, pos ? pos : ZeroVector3, 100.0)
    }

    public update(dt: number) {
        for (const txObjMeta of Object.values(this.txObjects)) {
            for (const txObjElement of txObjMeta.objects) {
                txObjElement.update(dt)
                this.updateTxState(txObjMeta, txObjElement)
            }
        }
    }

    private readonly InitialSpeed = 0;

    public createTransactionMesh(tx: ThorTransaction) {
        const hash = tx.realInputHash
        if (hash === null || tx.inputAddress === null) {
            return
        }

        if (this.isThereTxMesh(hash)) {
            this.updateTransactionMeshStatus(tx)
            return
        }

        let txObjects: Array<TxObject> = []

        for (const inTx of tx._in) {
            let sourcePosition = this.walletMan?.findWalletByAddress(inTx.address)?.obj?.position!
            if (sourcePosition == undefined) {
                sourcePosition = randomPointOnSphere(1e5)
            }

            for (const coin of inTx.coins) {
                const mass = 100.0
                let txObject = new TxObject(mass, sourcePosition)

                txObject.setVelocityToDirection(ZeroVector3, this.InitialSpeed)

                if (this.scene) {
                    this.scene.add(txObject.obj3d!)
                }

                txObjects.push(txObject)
            }
        }

        let state = TxState.Wallet_to_Pool
        if (tx.type == ActionTypeEnum.Switch) {
            state = TxState.Wallet_to_Core
        }

        const poolName = tx.pools.length > 0 ? tx.pools[0] : ''

        // store in cache
        this.txObjects[hash] = {
            action: tx,
            objects: txObjects,
            orbiting: tx.status == ActionStatusEnum.Pending,
            poolName,
            state
        }

        VisualLog.log(`new tx mesh ${tx.type} ${tx.pools[0]} ${tx.status}`)
    }

    public updateTransactionMeshStatus(tx: ThorTransaction) {
        // const txObj = this.txObjects[tx.realInputHash]
        // if(txObj) {
        //     txObj.tx = tx
        // }
    }

    public destroyTransactionMesh(tx: ThorTransaction) {
        // const hash = tx.realInputHash
        // const txObj = this.txObjects[hash]
        // if (txObj) {
        //     VisualLog.log(`deleting tx mesh: ${txObj.tx!.pools[0]}`)
        //
        //     txObj.dispose()
        //     delete this.txObjects[hash]
        // }
    }

    public isThereTxMesh(txID: string): boolean {
        return txID in this.txObjects
    }
}
