import * as THREE from "three";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import {Orbit, randomGauss, randomPointOnSphere, ZeroVector3} from "@/helpers/3d";
// @ts-ignore
import {Text} from 'troika-three-text'
import SpriteText from 'three-spritetext';
import {Config} from "@/config";
import {Vector3} from "three";


export class PoolObject {
    public mesh?: THREE.Object3D
    public pool?: PoolDetail
    public speed: number = 0.0
    public orbit?: Orbit
    public label?: Text

    private static geoPool: THREE.SphereGeometry = new THREE.SphereGeometry(50, 100, 100)

    scaleFromPool(pool: PoolDetail): number {
        return Math.pow(pool.runeDepth.toNumber(), 0.11) / 20
    }

    get position() {
        return this.mesh?.position ?? new Vector3()
    }

    constructor(pool: PoolDetail) {
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

        let poolMesh = new THREE.Mesh(PoolObject.geoPool, material)

        poolMesh.scale.setScalar(this.scaleFromPool(pool))

        this.mesh = poolMesh

        const radius = enabled ?
            randomGauss(cfg.Enabled.Distance.CenterGauss, cfg.Enabled.Distance.ScaleGauss) :
            randomGauss(cfg.Staged.Distance.CenterGauss, cfg.Staged.Distance.ScaleGauss);

        const n = randomPointOnSphere(1.0)

        this.orbit = new Orbit(poolMesh, ZeroVector3.clone(), radius, n)
        this.orbit.randomizePhase()
        this.orbit!.step(0.0016)

        this.speed = randomGauss(cfg.Speed.CenterGauss, cfg.Speed.ScaleGauss)

        this.label = this.createLabel(pool.asset)
        this.label.position.y = 80
        this.label.position.x = -40
        poolMesh.add(this.label)
    }

    createLabel(name: string) {
        const maxLen = Config.SimpleScene.PoolObject.MaxPoolNameLength
        if (name.length > maxLen) {
            name = name.substring(0, maxLen) + '...'
        }

        const myText = new SpriteText(name, 24, 'white')
        return myText
    }

    public update(dt: number) {
        this.orbit!.step(dt, this.speed)
    }

    public dispose() {
        this.label.dispose()
        this.label = undefined

        if (this.mesh) {
            this.mesh.parent?.remove(this.mesh)
            this.mesh = undefined
        }
    }

    public heartBeat() {
        const factor = 1.05
        if (this.mesh) {
            const oldScale = this.mesh.scale.x
            this.mesh.scale.setScalar(oldScale * factor)
            setTimeout(() => this.mesh!.scale.setScalar(oldScale), 500)
        }
    }
}
