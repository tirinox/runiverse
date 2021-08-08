import {PoolDetail} from "@/provider/midgard/poolDetail";
import {PoolObject} from "@/render/pool/poolObject";
import {Object3D} from "three";
import {IPoolQuery} from "@/render/interface";
import {isRuneStr} from "@/provider/midgard/coinName";
import {Orbit, randomGauss, randomPointOnSphere, ZeroVector3} from "@/helpers/3d";
import {Config} from "@/config";

interface PoolStruct {
    obj: PoolObject;
    orbit: Orbit;
    orbitSpeed: number;
}

export class PoolObjectManager implements IPoolQuery {
    private poolObjects: Record<string, PoolStruct> = {}

    // todo: track PoolObject state

    public scene?: Object3D

    constructor() {
    }

    public removeAllPoolMeshes() {
        for (const key of Object.keys(this.poolObjects)) {
            const pm = this.poolObjects[key]
            pm.obj.dispose()
        }
        this.poolObjects = {}
    }

    public removePoolMesh(pool: PoolDetail) {
        const pm = this.poolObjects[pool.asset]
        if (pm) {
            pm.obj.dispose()
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

        const poolStruct = this.poolObjects[poolName]
        if (poolStruct) {
            const pool = poolStruct.obj.pool
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
        const cfg = Config.Scene.PoolObject
        const radius = pool.isEnabled ?
            randomGauss(cfg.Enabled.Distance.CenterGauss, cfg.Enabled.Distance.ScaleGauss) :
            randomGauss(cfg.Staged.Distance.CenterGauss, cfg.Staged.Distance.ScaleGauss);
        const n = randomPointOnSphere(1.0)
        const orbit = new Orbit(poolObj, ZeroVector3.clone(), radius, n)
        orbit.randomizePhase()
        orbit.step()

        const orbitSpeed = randomGauss(cfg.SpeedAvg, cfg.SpeedVar)

        this.poolObjects[pool.asset] = {
            obj: poolObj,
            orbit,
            orbitSpeed,
        }

        if (this.scene) {
            this.scene.add(poolObj);
        }

        console.debug(`add new mesh for ${pool.asset}`)
    }

    public update(dt: number) {
        for (const key of Object.keys(this.poolObjects)) {
            const pm = this.poolObjects[key]
            pm.obj.update(dt)
            pm.orbit.step(dt, pm.orbitSpeed)
        }
    }

    public getPoolByName(poolName: string) {
        return this.poolObjects[poolName].obj
    }

    public hearBeat(pool: PoolDetail) {
        const poolObj = this.poolObjects[pool.asset]
        if (poolObj) {
            poolObj.obj.pool = pool
            poolObj.obj.updateScale()
        }
    }

    public allPools(): Array<PoolObject> {
        const poolStructs = Object.values(this.poolObjects)
        return poolStructs.map((s) => s.obj)
    }
}
