import {PoolDetail} from "@/provider/midgard/poolDetail";
import {PoolObject} from "@/render/simple/poolObject";
import {Object3D} from "three";
import {IPoolQuery} from "@/render/simple/interface";
import {isRuneStr} from "@/provider/midgard/coinName";
import {CoreObject} from "@/render/simple/coreObject";
import * as THREE from "three";

export class PoolObjectManager implements IPoolQuery {
    private poolObjects: Record<string, PoolObject> = {}
    private core?: CoreObject;

    // todo: track PoolObject state

    public scene?: Object3D

    constructor() {
    }

    public setEnvironment(environment: THREE.CubeTexture) {
        if(this.core) {
            this.core.setEnvironment(environment)
        }
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
        if (isRuneStr(poolName)) {
            return 1.0
        }

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

        if (this.scene) {
            this.scene.add(poolObj);
        }

        console.debug(`add new mesh for ${pool.asset}`)
    }

    public update(dt: number) {
        for (const key of Object.keys(this.poolObjects)) {
            const pm = this.poolObjects[key]
            pm.update(dt)
        }
    }

    public getPoolByName(poolName: string) {
        return this.poolObjects[poolName]
    }

    public createCore() {
        if (this.core) {
            return
        }

        if (this.scene) {
            this.core = new CoreObject()
            this.scene.add(this.core)
        }
    }

    public hearBeat(pool: PoolDetail) {
        const poolObj = this.poolObjects[pool.asset]
        if (poolObj) {
            poolObj.heartBeat()
        }
    }

    public allPools(): Array<PoolObject> {
        return Object.values(this.poolObjects)
    }
}
