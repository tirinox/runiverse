import * as THREE from "three";
import {MathUtils, Vector3} from "three";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import {Orbit, randomPointOnSphere} from "@/helpers/3d";
import SpriteText from 'three-spritetext';
import {Config} from "@/config";
import {RUNE_COLOR} from "@/helpers/colors";
import {truncStringTail} from "@/helpers/data_utils";
import {LAYER_BLOOM_SCENE} from "@/render/simple/layers";
import ballDeformVert from "@/render/simple/shaders/ball_deform.vert"
import lavaFrag from "@/render/simple/shaders/fire_ball.frag"
import clamp = MathUtils.clamp;
import {PoolObjectMesh} from "@/render/simple/pool/poolObjectMesh";


export class PoolObject extends THREE.Object3D {
    public pool?: PoolDetail
    public speed: number = 1.0
    public innerSpeed: number = 1.0

    private innerOrbitHolder = new THREE.Object3D()
    private runeSideMesh?: PoolObjectMesh
    private runeSideOrbit?: Orbit
    private assetSideMesh?: PoolObjectMesh
    private assetSideOrbit?: Orbit

    scaleFromPool(pool: PoolDetail): number {
        // return Math.pow(pool.runeDepth.toNumber(), 0.11) / 20
        const depth = Math.max(1.0, pool.runeDepth.toNumber())

        const ReferenceLog = 11.0
        const scale = Math.log10(depth) - ReferenceLog
        return clamp(scale, 1.0, 6.0)
    }

    private makeOneMesh(isRune: boolean, enabled: boolean): PoolObjectMesh {
        const cfg = Config.Scene.PoolObject

        let color = new THREE.Color()
        if (enabled) {
            if (isRune) {
                color.set(RUNE_COLOR)
            } else {
                color.setHSL(Math.random(), 1.0, 0.3)
            }
        } else {
            color.setHSL(0.0, 0.0, 0.5)
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
        let poolMesh = new PoolObjectMesh(color)

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

    constructor(pool: PoolDetail) {
        super();

        const cfg = Config.Scene.PoolObject

        this.pool = pool

        this.add(this.innerOrbitHolder)
        this.innerOrbitHolder.rotateOnAxis(randomPointOnSphere(), Math.random() * Math.PI * 2)

        this.createLabel(pool.asset)

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
