import VisualLog from "@/components/VisualLog.vue";
import {Object3D, Vector3} from "three";
import {ThorTransaction} from "@/provider/midgard/tx";
import {TxObject, TxState} from "@/render/simple/txObject";
import {IPoolQuery, IWalletQuery} from "@/render/simple/interface";
import {randomPointOnSphere, ZeroVector3} from "@/helpers/3d";
import {ActionStatusEnum, ActionTypeEnum} from "@/provider/midgard/v2";
import {Config} from "@/config";
import {PhysicalObject} from "@/helpers/physics";
import {Tx} from "@/provider/midgard/v1";


interface TxObjectMeta {
    objects: Array<TxObject>,
    action: ThorTransaction,
    orbiting: boolean,
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

    private forceRepelAllPoolsExceptOne(poolName: string, txObj: TxObject): Vector3 {
        if(!this.poolMan) {
            return new Vector3()
        }

        const poolMass = Config.SimpleScene.PoolObject.Mass

        let force = new Vector3()
        for(const poolObj of this.poolMan?.allPools()) {
            const poolPos = poolObj.mesh?.position!
            let forcePart: Vector3
            if(poolObj.pool?.asset! === poolName) {
                forcePart = txObj.myGravityTo(poolMass, poolPos)
            } else {
                // forcePart = txObj.repelFrom(poolMass, poolPos, Config.SimpleScene.TxObject.RepelFactor)
                forcePart = ZeroVector3.clone()
            }
            force.add(forcePart)
        }
        force.clampLength(0.0, 1e6)
        return force
    }

    private updateTxState(txMeta: TxObjectMeta, txObj: TxObject) {


        if(txObj.state == TxState.Wallet_to_Pool || txObj.state == TxState.Pool_to_Pool) {
            const targetPoolPos = this.poolMan?.getPoolByName(txObj.poolName).position
            if(targetPoolPos) {
                txObj.force = this.forceRepelAllPoolsExceptOne(txObj.poolName, txObj)

                if(txObj.isCloseToTarget(targetPoolPos)) {
                    this.destroyTxObject(txMeta, txObj)
                }
            }
        } else if(txObj.state == TxState.Pool_to_Wallet) {
            const targetPos = this.walletMan?.findWalletByAddress(txObj.walletAddress)?.obj?.position
            if(targetPos) {
                txObj.force = txObj.myGravityTo(1e10, targetPos)
                txObj.force.clampLength(1e3, 1e6)
                if(txObj.isCloseToTarget(targetPos)) {
                    this.destroyTxObject(txMeta, txObj)
                }
            }
        }
    }

    public update(dt: number) {
        for (const txObjMeta of Object.values(this.txObjects)) {
            for (const txObjElement of txObjMeta.objects) {
                txObjElement.update(dt)
                this.updateTxState(txObjMeta, txObjElement)
            }
        }
    }

    private createNewTxObject(tx: ThorTransaction, sourcePosition: Vector3) {
        const mass = 100.0

        let txObject = new TxObject(mass, sourcePosition)
        txObject.dissipation = Config.SimpleScene.TxObject.DissipationOfSpeed

        let velocityDirection = ZeroVector3.clone()
        if (tx.type == ActionTypeEnum.Switch) {
            txObject.state = TxState.Wallet_to_Core
        } else {
            txObject.state = TxState.Wallet_to_Pool
            txObject.poolName = tx.pools.length > 0 ? tx.pools[0] : ''
            velocityDirection = this.poolMan?.getPoolByName(txObject.poolName).position ?? velocityDirection
        }

        txObject.setVelocityToDirection(velocityDirection, Config.SimpleScene.TxObject.InitialSpeed)

        if (this.scene) {
            this.scene.add(txObject.obj3d!)
        }

        return txObject
    }

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
                txObjects.push(this.createNewTxObject(tx, sourcePosition))
            }
        }

        // store in cache
        this.txObjects[hash] = {
            action: tx,
            objects: txObjects,
            orbiting: tx.status == ActionStatusEnum.Pending,
        }

        VisualLog.log(`new tx mesh >>${tx.type}<< ${tx.pools[0]} ${tx.status}`)
    }

    public updateTransactionMeshStatus(tx: ThorTransaction) {
        // todo!

        // const txObj = this.txObjects[tx.realInputHash]
        // if(txObj) {
        //     txObj.tx = tx
        // }
    }

    public destroyTxObject(txMeta: TxObjectMeta, txObj?: TxObject) {
        if(txObj) {
            txObj.dispose()
            VisualLog.log(`deleting tx mesh: ${txObj.poolName}`)
            txMeta.objects = txMeta.objects.filter(o => o != txObj)
            if(!txMeta.objects.length) {
                delete this.txObjects[txMeta.action.realInputHash!]
            }
        }
    }

    public destroyTransactionMesh(tx: ThorTransaction) {
        const hash = tx.realInputHash!
        const txMeta = this.txObjects[hash]
        if(txMeta) {
            for(const txObj of txMeta.objects) {
                this.destroyTxObject(txMeta, txObj)
            }
            delete this.txObjects[hash]
        }
    }

    public isThereTxMesh(txID: string): boolean {
        return txID in this.txObjects
    }
}
