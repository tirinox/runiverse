import * as THREE from "three";
import {Vector3} from "three";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import {Orbit, randomGauss, randomPointOnSphere, ZeroVector3} from "@/helpers/3d";
import SpriteText from 'three-spritetext';
import {Config} from "@/config";
import {RUNE_COLOR} from "@/helpers/colors";
import {truncStringTail} from "@/helpers/data_utils";


export class PoolObject extends THREE.Object3D {
    public pool?: PoolDetail
    public speed: number = 1.0
    public innerSpeed: number = 1.0
    public orbit?: Orbit

    private innerOrbitHolder = new THREE.Object3D()
    private runeSideMesh?: THREE.Mesh
    private runeSideOrbit?: Orbit
    private assetSideMesh?: THREE.Mesh
    private assetSideOrbit?: Orbit

    private static geoPool: THREE.SphereGeometry = new THREE.SphereGeometry(50, 100, 100)

    scaleFromPool(pool: PoolDetail): number {
        // return Math.pow(pool.runeDepth.toNumber(), 0.11) / 20
        return Math.log10(pool.runeDepth.toNumber()) * 0.1
    }

    private makeOneMesh(isRune: boolean, scale: number, enabled: boolean): THREE.Mesh {
        const cfg = Config.SimpleScene.PoolObject

        let color = new THREE.Color()
        if(enabled) {
            if(isRune) {
                color.set(RUNE_COLOR)
            } else {
                color.setHSL(Math.random(), 1.0, 0.3)
            }
        } else {
            color.setHSL(0.0, 0.0, 0.5)
        }

        const material = new THREE.MeshPhongMaterial({
            color: color,
            reflectivity: 0.1,
            emissive: color,
            emissiveIntensity: 0.2,
            opacity: 0.6,
            transparent: true
        });

        let poolMesh = new THREE.Mesh(PoolObject.geoPool, material)
        poolMesh.scale.setScalar(scale * cfg.InitialScale)
        this.innerOrbitHolder.add(poolMesh)

        const orbitRadius = cfg.InnerOrbitRadius * scale
        let orbit = new Orbit(poolMesh, new Vector3(), orbitRadius)
        orbit.step()

        if(isRune) {
            this.runeSideOrbit = orbit
        } else {
            orbit.t = Math.PI  // counter-phase
            this.assetSideOrbit = orbit
        }

        return poolMesh
    }

    constructor(pool: PoolDetail) {
        super();

        const cfg = Config.SimpleScene.PoolObject

        this.pool = pool

        const enabled = pool.isEnabled
        const scale = this.scaleFromPool(pool)
        this.innerSpeed = scale * cfg.InnerOrbitSpeed

        this.add(this.innerOrbitHolder)
        this.innerOrbitHolder.rotateOnAxis(randomPointOnSphere(), Math.random() * Math.PI * 2)

        this.runeSideMesh = this.makeOneMesh(true, scale, enabled)
        this.assetSideMesh = this.makeOneMesh(false, scale, enabled)

        const radius = enabled ?
            randomGauss(cfg.Enabled.Distance.CenterGauss, cfg.Enabled.Distance.ScaleGauss) :
            randomGauss(cfg.Staged.Distance.CenterGauss, cfg.Staged.Distance.ScaleGauss);

        const n = randomPointOnSphere(1.0)

        this.orbit = new Orbit(this, ZeroVector3.clone(), radius, n)
        this.orbit.randomizePhase()
        this.orbit!.step()

        this.speed = randomGauss(cfg.Speed.CenterGauss, cfg.Speed.ScaleGauss) * scale

        // const geometry = new THREE.CircleGeometry( 5, 32 );
        // const material = new THREE.MeshBasicMaterial( { color: 0x666666 } );
        // const circle = new THREE.Mesh( geometry, material );
        // this.add( circle );

        const label = this.createLabel(pool.asset)
        label.position.y = 80
        label.position.x = -40
        this.add(label)
    }

    createLabel(name: string) {
        const maxLen = Config.SimpleScene.PoolObject.MaxPoolNameLength
        name = truncStringTail(name, maxLen)
        return new SpriteText(name, 24, 'white')
    }

    public update(dt: number) {
        this.orbit!.step(dt, this.speed)

        this.assetSideOrbit?.step(dt * this.innerSpeed)
        this.runeSideOrbit?.step(dt * this.innerSpeed)
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
