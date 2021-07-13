import * as THREE from "three";
import {MathUtils, Vector3} from "three";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import {Orbit, randomGauss, randomPointOnSphere, ZeroVector3} from "@/helpers/3d";
import SpriteText from 'three-spritetext';
import {Config} from "@/config";
import {RUNE_COLOR} from "@/helpers/colors";
import {truncStringTail} from "@/helpers/data_utils";
import clamp = MathUtils.clamp;
import {LAYER_BLOOM_SCENE} from "@/render/simple/layers";


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

    // private label: SpriteText;

    scaleFromPool(pool: PoolDetail): number {
        // return Math.pow(pool.runeDepth.toNumber(), 0.11) / 20
        const depth = Math.max(1.0, pool.runeDepth.toNumber())

        const ReferenceLog = 11.0
        const scale1 = clamp(Math.log10(depth) - ReferenceLog, 1.0, 6.0)
        return scale1
    }

    private makeOneMesh(isRune: boolean, enabled: boolean): THREE.Mesh {
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

        const material = new THREE.MeshPhongMaterial({
            color: color,
            reflectivity: 0.1,
            emissive: color,
            emissiveIntensity: 0.2,
            // opacity: 0.6,
            // transparent: true
        });

        let poolMesh = new THREE.Mesh(PoolObject.geoPool, material)

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

        // this._addGlow(poolMesh)

        return poolMesh
    }

    updateScale() {
        const scale = this.scaleFromPool(this.pool!)

        console.info(`Pool: ${this.pool!.asset} ,scale = ${scale}`)

        const cfg = Config.Scene.PoolObject
        this.runeSideMesh!.scale.setScalar(scale * cfg.InitialScale)
        this.assetSideMesh!.scale.setScalar(scale * cfg.InitialScale)
        this.innerSpeed = scale * cfg.InnerOrbitSpeed

        this.runeSideOrbit!.radius = cfg.InnerOrbitRadius * scale * cfg.InitialScale
        this.assetSideOrbit!.radius = cfg.InnerOrbitRadius * scale * cfg.InitialScale

        this.heartBeat()  // debug!
    }

    constructor(pool: PoolDetail) {
        super();

        const cfg = Config.Scene.PoolObject

        this.pool = pool

        const enabled = pool.isEnabled

        this.add(this.innerOrbitHolder)
        this.innerOrbitHolder.rotateOnAxis(randomPointOnSphere(), Math.random() * Math.PI * 2)

        this.runeSideMesh = this.makeOneMesh(true, enabled)
        this.assetSideMesh = this.makeOneMesh(false, enabled)

        const radius = enabled ?
            randomGauss(cfg.Enabled.Distance.CenterGauss, cfg.Enabled.Distance.ScaleGauss) :
            randomGauss(cfg.Staged.Distance.CenterGauss, cfg.Staged.Distance.ScaleGauss);

        const n = randomPointOnSphere(1.0)

        this.orbit = new Orbit(this, ZeroVector3.clone(), radius, n)
        this.orbit.randomizePhase()
        this.orbit!.step()

        this.speed = randomGauss(cfg.Speed.CenterGauss, cfg.Speed.ScaleGauss)

        this.updateScale()

        // const geometry = new THREE.CircleGeometry( 5, 32 );
        // const material = new THREE.MeshBasicMaterial( { color: 0x666666 } );
        // const circle = new THREE.Mesh( geometry, material );
        // this.add( circle );

        // this.label = this.createLabel(pool.asset)
        // label.position.y = 80
        // label.position.x = -40
        // this.add(label)
    }

    createLabel(name: string) {
        const maxLen = Config.Scene.PoolObject.MaxPoolNameLength
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

    private _addGlow(obj: THREE.Object3D) {
        const textureLoader = new THREE.TextureLoader()
        const texture = textureLoader.load('textures/glow1.png')
        const spriteMaterial = new THREE.SpriteMaterial(
            {
                map: texture,
                sizeAttenuation: true,
                color: 0xffff66, transparent: false,
                blending: THREE.AdditiveBlending
            });
        var sprite = new THREE.Sprite( spriteMaterial );
        sprite.scale.set(200, 200, 1.0);
        obj.add(sprite); // this centers the glow at the mesh
    }
}
