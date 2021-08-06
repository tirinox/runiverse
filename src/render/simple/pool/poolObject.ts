import * as THREE from "three";
import {MathUtils, Vector3} from "three";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import {Orbit, randomPointOnSphere} from "@/helpers/3d";
import SpriteText from 'three-spritetext';
import {Config} from "@/config";
import {RUNE_COLOR_GRAD_1, RUNE_COLOR_GRAD_2} from "@/helpers/colors";
import {truncStringTail} from "@/helpers/data_utils";
import {LAYER_BLOOM_SCENE} from "@/render/simple/layers";
import {PoolObjectMesh} from "@/render/simple/pool/poolObjectMesh";
import clamp = MathUtils.clamp;


export class PoolObject extends THREE.Object3D {
    public pool?: PoolDetail
    public speed: number = 1.0
    public innerSpeed: number = 1.0

    private innerOrbitHolder = new THREE.Object3D()
    public runeSideMesh?: PoolObjectMesh
    public runeSideOrbit?: Orbit
    public assetSideMesh?: PoolObjectMesh
    public assetSideOrbit?: Orbit

    scaleFromPool(pool: PoolDetail): number {
        // return Math.pow(pool.runeDepth.toNumber(), 0.11) / 20
        const depth = Math.max(1.0, pool.runeDepth.toNumber())

        const ReferenceLog = 11.0
        const scale = Math.log10(depth) - ReferenceLog
        return clamp(scale, 1.0, 6.0)
    }

    private makeOneMesh(isRune: boolean, enabled: boolean): PoolObjectMesh {
        const cfg = Config.Scene.PoolObject

        let color1 = new THREE.Color()
        let color2 = new THREE.Color()
        if (enabled) {
            if (isRune) {
                color1.set(RUNE_COLOR_GRAD_1)
                color2.set(RUNE_COLOR_GRAD_2)
            } else {
                // todo! get real asset color
                // color1.setHSL(Math.random(), 1.0, 0.8)
                color1.setHSL(0.0, 1.0, 0.5)
                color2 = color1
            }
        } else {
            color1.setHSL(0.0, 0.0, 0.5)
            color2 = color1
        }

        // const material = new THREE.MeshPhongMaterial({
        //     color: color,
        //     reflectivity: 0.1,
        //     emissive: color,
        //     emissiveIntensity: 0.2,
        //     // opacity: 0.6,
        //     // transparent: true
        // });

        // let poolMesh = new THREE.Mesh(PoolObject.geoPool, this.ballMaterial)
        let poolMesh = new PoolObjectMesh(color1, color2)

        this.innerOrbitHolder.add(poolMesh)

        let orbit = new Orbit(poolMesh, new Vector3(), cfg.InnerOrbitRadius)
        orbit.step()

        if (isRune) {
            this.runeSideOrbit = orbit
        } else {
            orbit.t = Math.PI  // counter-phase
            this.assetSideOrbit = orbit
        }

        poolMesh.layers.enable(LAYER_BLOOM_SCENE)

        return poolMesh
    }

    updateScale() {
        const scale = this.scaleFromPool(this.pool!)

        console.info(`Pool: ${this.pool!.asset} ,scale = ${scale}`)

        const cfg = Config.Scene.PoolObject
        if (this.runeSideMesh && this.assetSideMesh) {
            this.runeSideMesh!.scale.setScalar(scale * cfg.InitialScale)
            this.assetSideMesh!.scale.setScalar(scale * cfg.InitialScale)

            this.innerSpeed = scale * cfg.InnerOrbitSpeed

            this.runeSideOrbit!.radius = cfg.InnerOrbitRadius * scale * cfg.InitialScale
            this.assetSideOrbit!.radius = cfg.InnerOrbitRadius * scale * cfg.InitialScale
        }
    }

    constructor(pool: PoolDetail, withLabel = true) {
        super();

        this.pool = pool

        this.add(this.innerOrbitHolder)
        this.innerOrbitHolder.rotateOnAxis(randomPointOnSphere(), Math.random() * Math.PI * 2)

        if(withLabel) {
            this.createLabel(pool.asset)
        }

        const enabled = this.pool!.isEnabled

        this.runeSideMesh = this.makeOneMesh(true, enabled)
        this.assetSideMesh = this.makeOneMesh(false, enabled)

        this.updateScale()
    }

    createLabel(name: string) {
        const maxLen = Config.Scene.PoolObject.MaxPoolNameLength
        name = truncStringTail(name, maxLen)
        const label = new SpriteText(name, 24, 'white')
        this.add(label)
    }

    public update(dt: number) {
        this.assetSideOrbit?.step(dt * this.innerSpeed)
        this.runeSideOrbit?.step(dt * this.innerSpeed)

        if(this.runeSideMesh && this.assetSideMesh) {
            this.runeSideMesh.update(dt)
            this.assetSideMesh.update(dt)

            const runeWorld = this.runeSideMesh.getWorldPosition(new Vector3())
            const assetWorld = this.assetSideMesh.getWorldPosition(new Vector3())

            const fullDistance = runeWorld.clone().sub(assetWorld).length();

            this.runeSideMesh.setSisterParams(fullDistance, assetWorld, this.assetSideMesh.assetColor)
            this.assetSideMesh.setSisterParams(fullDistance, runeWorld, this.runeSideMesh.assetColor)
        }
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
