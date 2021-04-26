import * as THREE from "three";
import {Scene, Vector3} from "three";
import {EventType, PoolChangeType, ThorEvent, ThorEventListener, TxEventType} from "@/provider/types";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import {ThorTransaction} from "@/provider/midgard/tx";
import {randomPointOnSphere, ZeroVector3} from "@/helpers/3d";
import {visualLog} from "@/helpers/log";

import {TxMesh} from "@/render/simple/txObject";
import {PoolObject} from "@/render/simple/poolObject";

export default class SimpleScene implements ThorEventListener {
    private scene: Scene;

    private poolMeshes: Record<string, PoolObject> = {}
    private txMeshes: Record<string, TxMesh> = {}

    private geo20?: THREE.IcosahedronGeometry;
    private geoBox?: THREE.BoxGeometry;

    private whiteMaterial?: THREE.Material;

    private txSourcePlaceRadius: number = 3000

    private removeAllPoolMeshes() {
        for (const key of Object.keys(this.poolMeshes)) {
            const pm = this.poolMeshes[key]
            pm.dispose()
        }
        this.poolMeshes = {}
    }

    private removePoolMesh(pool: PoolDetail) {
        const pm = this.poolMeshes[pool.asset]
        if (pm) {
            pm.dispose()
            delete this.poolMeshes[pool.asset]
            console.debug(`delete pool mesh ${pool.asset}`)
        }
    }

    private isTherePoolMesh(poolName: string): boolean {
        return poolName in this.poolMeshes
    }

    scaleFromPool(pool: PoolDetail): number {
        return Math.pow(pool.runeDepth.toNumber(), 0.11) / 20
    }

    private async addNewPoolMesh(pool: PoolDetail) {
        if (this.isTherePoolMesh(pool.asset)) {
            return
        }

        const poolObj = new PoolObject(pool)

        this.poolMeshes[pool.asset] = poolObj

        this.scene.add(poolObj.mesh!);

        console.debug(`add new mesh for ${pool.asset}`)
    }

    updatePoolOrbits(dt: number) {
        for (const key of Object.keys(this.poolMeshes)) {
            const pm = this.poolMeshes[key]
            pm.update(dt)
        }
    }

    getPoolObjectOfTxMesh(txMesh: TxMesh, index: number = 0): THREE.Object3D | undefined {
        const p = this.poolMeshes[txMesh.tx.pools[index]]
        return p ? p.mesh : undefined
    }

    // -------- tx meshes -------

    createTransactionMesh(tx: ThorTransaction) {
        const hash = tx.hash

        if (this.isThereTxMesh(hash)) {
            return
        }

        let txMesh = new THREE.Mesh(this.geoBox, this.whiteMaterial)

        // store in cache
        this.txMeshes[hash] = {
            obj: txMesh,
            tx,
            target: undefined,
            poolToFollow: ''
        }

        const position = randomPointOnSphere(this.txSourcePlaceRadius)
        txMesh.position.copy(position)
        this.scene.add(txMesh)

        visualLog(`new tx mesh ${tx.type} ${tx.pools[0]} ${tx.status}`)
    }

    destroyTransactionMesh(tx: ThorTransaction) {
        const hash = tx.hash
        const mesh = this.txMeshes[hash]
        if (mesh) {
            mesh.obj.parent?.remove(mesh.obj)
            delete this.txMeshes[hash]
        }
    }

    updateTransactionMeshStatus(tx: ThorTransaction) {

    }

    updateTxMeshPositions(dt: number) {
        const speed = 0.005
        const minDistanceToObject = 3.0
        const minUnitsPerSec = 2.0

        for (const key of Object.keys(this.txMeshes)) {
            const txMesh = this.txMeshes[key]

            let targetPosition: Vector3
            if (txMesh.target) {
                targetPosition = txMesh.target.position.clone()
            } else {
                txMesh.target = this.getPoolObjectOfTxMesh(txMesh)
                targetPosition = ZeroVector3.clone()
            }

            let deltaPosition = targetPosition.sub(txMesh.obj.position)
            let shift = deltaPosition.clone()
            shift.multiplyScalar(speed)
            if (shift.length() < minUnitsPerSec) {
                shift.normalize()
                shift.multiplyScalar(minUnitsPerSec)
            }
            txMesh.obj.position.add(shift)

            // close to the target
            if (deltaPosition.length() < minDistanceToObject) {
                txMesh.obj.parent?.remove(txMesh.obj)
                delete this.txMeshes[key]
                visualLog(`deleting tx mesh: ${txMesh.tx.hash}`)
            }
        }
    }

    isThereTxMesh(txID: string): boolean {
        return txID in this.txMeshes
    }

    updateAnimations(dt: number) {
        this.updateTxMeshPositions(dt)
        this.updatePoolOrbits(dt)
    }

    private heartBeat(pool: PoolDetail) {
        const pm = this.poolMeshes[pool.asset]
        if (pm) {
            pm.heartBeat()
        }
    }

    // --------- init & load & service -----

    initScene() {
        this.geoBox = new THREE.BoxGeometry(5, 5, 5)

        const sphere = new THREE.SphereGeometry(140, 10, 10)
        const core = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({color: 0x101010}))
        this.scene.add(core)
    }

    onResize(w: number, h: number) {
    }

    constructor(scene: Scene) {
        this.scene = scene
        this.whiteMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            reflectivity: 0.5,
        });
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
