import * as THREE from "three";
import {Mesh, Scene} from "three";
import {EventType, PoolChangeType, ThorEvent, ThorEventListener, TxEventType} from "@/provider/types";
import {PoolDetail} from "@/provider/midgard/poolDetail";

import {TxObject} from "@/render/simple/txObject";
import {PoolObject} from "@/render/simple/poolObject";
import {TxObjectManager} from "@/render/simple/txObjectManager";
import {PoolObjectManager} from "@/render/simple/poolObjectManager";

export default class SimpleScene implements ThorEventListener {
    private scene: Scene;

    private poolObjects: Record<string, PoolObject> = {}


    private txObjManager = new TxObjectManager()
    private poolObjManager = new PoolObjectManager()

    // -------- tx meshes -------

    updateAnimations(dt: number) {
        this.poolObjManager.update(dt)
        this.txObjManager.update(dt)
    }

    private heartBeat(pool: PoolDetail) {
        const pm = this.poolObjects[pool.asset]
        if (pm) {
            pm.heartBeat()
        }
    }

    // --------- init & load & service -----


    onResize(w: number, h: number) {
    }

    constructor(scene: Scene) {
        this.scene = scene

        this.poolObjManager.scene = scene
        this.poolObjManager.createCore()

        this.txObjManager.scene = scene

        this.txObjManager.poolMan = this.poolObjManager
    }

    // ------ event routing -------

    receiveEvent(e: ThorEvent): void {
        if (e.eventType == EventType.ResetAll) {
            console.log('booms! reset all')
            this.poolObjManager.removeAllPoolMeshes()
        } else if (e.eventType == EventType.UpdatePool) {
            const change = e.poolChange!

            if (change.type == PoolChangeType.Removed) {
                this.poolObjManager.removePoolMesh(change.previousPool!)
            } else {
                if (!this.poolObjManager.isTherePoolMesh(change.pool!.asset)) {
                    this.poolObjManager.addNewPoolMesh(change.pool!)
                }
                if (change.type == PoolChangeType.DepthChanged) {
                    this.heartBeat(change.pool!)
                }
            }
        } else if (e.eventType == EventType.Transaction) {
            const ev = e.txEvent!

            if (ev.type == TxEventType.Add) {
                const poolName = ev.tx.pools.length ? ev.tx.pools[0] : ''
                const runesPerAsset = this.poolObjManager.runesPerAsset(poolName)
                this.txObjManager.createTransactionMesh(ev.tx, runesPerAsset)
            } else if (ev.type == TxEventType.Destroy) {
                this.txObjManager.destroyTransactionMesh(ev.tx)
            } else if (ev.type == TxEventType.StatusUpdated) {
                this.txObjManager.updateTransactionMeshStatus(ev.tx)
            }
        }
    }
}
