import * as THREE from "three";
import {Vector3} from "three";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import {Orbit, randomGauss, randomPointOnSphere, ZeroVector3} from "@/helpers/3d";
import SpriteText from 'three-spritetext';
import {Config} from "@/config";


export class PoolObject extends THREE.Object3D {
    public pool?: PoolDetail
    public speed: number = 0.0
    public orbit?: Orbit

    private runeSideMesh?: THREE.Mesh
    private assetSideMesh?: THREE.Mesh

    private static geoPool: THREE.SphereGeometry = new THREE.SphereGeometry(50, 100, 100)

    scaleFromPool(pool: PoolDetail): number {
        return Math.pow(pool.runeDepth.toNumber(), 0.11) / 20
    }

    constructor(pool: PoolDetail) {
        super();

        this.pool = pool

        const enabled = pool.isEnabled

        const cfg = Config.SimpleScene.PoolObject

        let color = new THREE.Color()
        color.setHSL(Math.random(), enabled ? 1.0 : 0.0, enabled ? 0.5 : 0.3)
        const material = new THREE.MeshPhongMaterial({
            color: color,
            reflectivity: 0.1,
            emissive: color,
            emissiveIntensity: 0.5,
        });

        // todo make 2 sides in binary system
        let poolMesh = new THREE.Mesh(PoolObject.geoPool, material)
        poolMesh.scale.setScalar(this.scaleFromPool(pool))
        this.add(poolMesh)

        const radius = enabled ?
            randomGauss(cfg.Enabled.Distance.CenterGauss, cfg.Enabled.Distance.ScaleGauss) :
            randomGauss(cfg.Staged.Distance.CenterGauss, cfg.Staged.Distance.ScaleGauss);

        const n = randomPointOnSphere(1.0)

        this.orbit = new Orbit(this, ZeroVector3.clone(), radius, n)
        this.orbit.randomizePhase()
        this.orbit!.step(0.0016)

        this.speed = randomGauss(cfg.Speed.CenterGauss, cfg.Speed.ScaleGauss)

        const label = this.createLabel(pool.asset)
        label.position.y = 80
        label.position.x = -40
        this.add(label)
    }

    createLabel(name: string) {
        const maxLen = Config.SimpleScene.PoolObject.MaxPoolNameLength
        if (name.length > maxLen) {
            name = name.substring(0, maxLen) + '...'
        }

        return new SpriteText(name, 24, 'white')
    }

    public update(dt: number) {
        this.orbit!.step(dt, this.speed)
        // todo rotate binary system
    }

    public dispose() {
    }

    public heartBeat() {
        const factor = 1.05
        const oldScale = this.scale.x
        this.scale.setScalar(oldScale * factor)
        setTimeout(() => this.scale.setScalar(oldScale), 500)
    }
}
