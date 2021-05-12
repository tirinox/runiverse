import * as THREE from "three";
import {Mesh, Scene} from "three";
import {EventType, PoolChangeType, ThorEvent, ThorEventListener, TxEventType} from "@/provider/types";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import {ThorTransaction} from "@/provider/midgard/tx";

import {TxObject} from "@/render/simple/txObject";
import {PoolObject} from "@/render/simple/poolObject";
import VisualLog from "@/components/VisualLog.vue";

export default class SimpleScene implements ThorEventListener {
    private scene: Scene;

    private poolObjects: Record<string, PoolObject> = {}
    private txObjects: Record<string, TxObject> = {}
    private core?: Mesh;

    private removeAllPoolMeshes() {
        for (const key of Object.keys(this.poolObjects)) {
            const pm = this.poolObjects[key]
            pm.dispose()
        }
        this.poolObjects = {}
    }

    private removePoolMesh(pool: PoolDetail) {
        const pm = this.poolObjects[pool.asset]
        if (pm) {
            pm.dispose()
            delete this.poolObjects[pool.asset]
            console.debug(`delete pool mesh ${pool.asset}`)
        }
    }

    private isTherePoolMesh(poolName: string): boolean {
        return poolName in this.poolObjects
    }

    public runesPerAsset(poolName: string): number {
        const poolMesh = this.poolObjects[poolName]
        if(poolMesh) {
            const pool = poolMesh.pool
            if(pool) {
                return pool.runesPerAsset.toNumber()
            }
        }
        return 0.0
    }

    private async addNewPoolMesh(pool: PoolDetail) {
        if (this.isTherePoolMesh(pool.asset)) {
            return
        }

        const poolObj = new PoolObject(pool)

        this.poolObjects[pool.asset] = poolObj

        this.scene.add(poolObj.mesh!);

        console.debug(`add new mesh for ${pool.asset}`)
    }

    updatePoolOrbits(dt: number) {
        for (const key of Object.keys(this.poolObjects)) {
            const pm = this.poolObjects[key]
            pm.update(dt)
        }
    }

    getPoolObjectOfTxMesh(t: TxObject, index: number = 0): THREE.Object3D | undefined {
        const poolName = t.tx!.pools[index]
        const p = this.poolObjects[poolName]
        return p ? p.mesh : this.core
    }

    // -------- tx meshes -------

    createTransactionMesh(tx: ThorTransaction) {
        const hash = tx.hash

        if (this.isThereTxMesh(hash)) {
            return
        }

        const price = this.runesPerAsset(tx.pools[0])
        let txObject = new TxObject(tx, price)
        // store in cache
        this.txObjects[hash] = txObject

        this.scene.add(txObject.mesh!)

        VisualLog.log(`new tx mesh ${tx.type} ${tx.pools[0]} ${tx.status}`)
    }

    destroyTransactionMesh(tx: ThorTransaction) {
        const hash = tx.hash
        const mesh = this.txObjects[hash]
        if (mesh) {
            mesh.dispose()
            delete this.txObjects[hash]
        }
    }

    updateTransactionMeshStatus(tx: ThorTransaction) {

    }

    updateTxMeshPositions(dt: number) {
        for (const key of Object.keys(this.txObjects)) {
            const txObj = this.txObjects[key]

            txObj.target = this.getPoolObjectOfTxMesh(txObj)
            // txObj.target = this.core

            txObj.update(dt)

            if(txObj.isCloseToTarget) {
                txObj.dispose()
                delete this.txObjects[key]
                VisualLog.log(`deleting tx mesh: ${txObj.tx!.hash}`)
            }
        }
    }

    isThereTxMesh(txID: string): boolean {
        return txID in this.txObjects
    }

    updateAnimations(dt: number) {
        this.updateTxMeshPositions(dt)
        this.updatePoolOrbits(dt)
    }

    private heartBeat(pool: PoolDetail) {
        const pm = this.poolObjects[pool.asset]
        if (pm) {
            pm.heartBeat()
        }
    }

    // --------- init & load & service -----

    initScene() {
        this.createCore()
    }

    createCore() {
        const sphere = new THREE.SphereGeometry(140, 10, 10)
        this.core = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({color: 0x202520}))
        this.scene.add(this.core)
    }

    onResize(w: number, h: number) {
    }

    constructor(scene: Scene) {
        this.scene = scene
    }


    // ------ event routing -------

    receiveEvent(e: ThorEvent): void {
        if (e.eventType == EventType.ResetAll) {
            console.log('booms! reset all')
            this.removeAllPoolMeshes()
        } else if (e.eventType == EventType.UpdatePool) {
            const change = e.poolChange!

            if (change.type == PoolChangeType.Removed) {
                this.removePoolMesh(change.previousPool!)
            } else {
                if (!this.isTherePoolMesh(change.pool!.asset)) {
                    this.addNewPoolMesh(change.pool!)
                }
                if (change.type == PoolChangeType.DepthChanged) {
                    this.heartBeat(change.pool!)
                }
            }
        } else if (e.eventType == EventType.Transaction) {
            const ev = e.txEvent!

            if (ev.type == TxEventType.Add) {
                this.createTransactionMesh(ev.tx)
            } else if (ev.type == TxEventType.Destroy) {
                this.destroyTransactionMesh(ev.tx)
            } else if (ev.type == TxEventType.StatusUpdated) {
                this.updateTransactionMeshStatus(ev.tx)
            }
        }
    }
}
