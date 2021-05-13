import {PoolDetail} from "@/provider/midgard/poolDetail";
import {PoolObject} from "@/render/simple/poolObject";
import {TxObject} from "@/render/simple/txObject";
import * as THREE from "three";
import {Mesh, Object3D} from "three";
import {IPoolQuery} from "@/render/simple/interface";

export class PoolObjectManager implements IPoolQuery {
    private poolObjects: Record<string, PoolObject> = {}
    private txObjects: Record<string, TxObject> = {}
    private core?: Mesh;

    public scene?: Object3D

    constructor() {
    }

    public removeAllPoolMeshes() {
        for (const key of Object.keys(this.poolObjects)) {
            const pm = this.poolObjects[key]
            pm.dispose()
        }
        this.poolObjects = {}
    }

    public removePoolMesh(pool: PoolDetail) {
        const pm = this.poolObjects[pool.asset]
        if (pm) {
            pm.dispose()
            delete this.poolObjects[pool.asset]
            console.debug(`delete pool mesh ${pool.asset}`)
        }
    }

    public isTherePoolMesh(poolName: string): boolean {
        return poolName in this.poolObjects
    }

    public runesPerAsset(poolName: string): number {
        const poolMesh = this.poolObjects[poolName]
        if (poolMesh) {
            const pool = poolMesh.pool
            if (pool) {
                return pool.runesPerAsset.toNumber()
            }
        }
        return 0.0
    }

    public async addNewPoolMesh(pool: PoolDetail) {
        if (this.isTherePoolMesh(pool.asset)) {
            return
        }

        const poolObj = new PoolObject(pool)

        this.poolObjects[pool.asset] = poolObj

        if(this.scene) {
            this.scene.add(poolObj.mesh!);
        }

        console.debug(`add new mesh for ${pool.asset}`)
    }

    public update(dt: number) {
        for (const key of Object.keys(this.poolObjects)) {
            const pm = this.poolObjects[key]
            pm.update(dt)
        }
    }

    public getPoolObjectOfTxMesh(t: TxObject, index: number = 0): THREE.Object3D {
        const poolName = t.tx!.pools[index]
        const p = this.poolObjects[poolName]
        return p ? p.mesh! : this.core!
    }

    public createCore() {
        if(this.core) {
            return
        }

        const sphere = new THREE.SphereGeometry(140, 10, 10)
        this.core = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({color: 0x202520}))
        if(this.scene) {
            this.scene.add(this.core)
        }
    }
}