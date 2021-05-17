import * as THREE from "three";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import {Orbit, randomGauss, randomPointOnSphere, ZeroVector3} from "@/helpers/3d";
// @ts-ignore
import {Text} from 'troika-three-text'


export class PoolObject {
    public mesh?: THREE.Object3D
    public pool?: PoolDetail
    public speed: number = 0.0
    public orbit?: Orbit
    public label?: Text

    public static OrbitSpeedScale = 0.0001
    public static MaxPoolNameLength = 14

    private static geoPool: THREE.SphereGeometry = new THREE.SphereGeometry(50, 100, 100)

    scaleFromPool(pool: PoolDetail): number {
        return Math.pow(pool.runeDepth.toNumber(), 0.11) / 20
    }

    constructor(pool: PoolDetail) {
        this.pool = pool

        const enabled = pool.isEnabled

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

        const radius = enabled ? randomGauss(600, 50) : randomGauss(1200, 50);

        const n = randomPointOnSphere(1.0)

        this.orbit = new Orbit(poolMesh, ZeroVector3.clone(), radius, n)
        this.orbit.randomizePhase()
        this.orbit!.step(0.0016)

        this.speed = randomGauss(50.0, 40.0)

        this.label = this.createLabel(pool.asset)
        this.label.position.y = 80
        this.label.position.x = -40
        poolMesh.add(this.label)
    }

    createLabel(name: string): Text {
        if (name.length > PoolObject.MaxPoolNameLength) {
            name = name.substring(0, PoolObject.MaxPoolNameLength) + '...'
        }

        const myText = new Text()
        myText.text = name
        myText.fontSize = 24
        myText.color = 0xFFFFFF
        myText.sync()
        return myText
    }

    public update(dt: number) {
        this.orbit!.step(dt, PoolObject.OrbitSpeedScale * this.speed)
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
