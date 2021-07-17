import * as THREE from "three";
import {MathUtils, Vector3} from "three";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import {Orbit, randomGauss, randomPointOnSphere, ZeroVector3} from "@/helpers/3d";
import SpriteText from 'three-spritetext';
import {Config} from "@/config";
import {RUNE_COLOR} from "@/helpers/colors";
import {truncStringTail} from "@/helpers/data_utils";
import {LAYER_BLOOM_SCENE} from "@/render/simple/layers";
import ballDeformVert from "@/render/simple/shaders/ball_deform.vert"
import lavaFrag from "@/render/simple/shaders/fire_ball.frag"
import clamp = MathUtils.clamp;


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

    public static textureLoader = new THREE.TextureLoader()

    private static geoPool: THREE.SphereGeometry = new THREE.SphereGeometry(50, 100, 100)

    // private label: SpriteText;
    private customUniforms: any;
    private ballMaterial?: THREE.ShaderMaterial;

    scaleFromPool(pool: PoolDetail): number {
        // return Math.pow(pool.runeDepth.toNumber(), 0.11) / 20
        const depth = Math.max(1.0, pool.runeDepth.toNumber())

        const ReferenceLog = 11.0
        const scale = Math.log10(depth) - ReferenceLog
        return clamp(scale, 1.0, 6.0)
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

        // const material = new THREE.MeshPhongMaterial({
        //     color: color,
        //     reflectivity: 0.1,
        //     emissive: color,
        //     emissiveIntensity: 0.2,
        //     // opacity: 0.6,
        //     // transparent: true
        // });

        // let poolMesh = new THREE.Mesh(PoolObject.geoPool, this.ballMaterial)
        let poolMesh = new THREE.Mesh(PoolObject.geoPool, this.ballMaterial)

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

    private async createPoolMaterial() {
        // base image texture for mesh
        const lavaTexture = await PoolObject.textureLoader.loadAsync('textures/lava.jpeg')
        lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping;
        // multiplier for distortion speed
        const baseSpeed = 0.02;
        // number of times to repeat texture in each direction
        const repeatS = 4.0;
        const repeatT = 4.0;

        // texture used to generate "randomness", distort all other textures
        const noiseTexture = await PoolObject.textureLoader.loadAsync('textures/noise-cloud.png');
        noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;
        // magnitude of noise effect
        const noiseScale = 0.5;

        // texture to additively blend with base image texture
        const blendTexture = await PoolObject.textureLoader.loadAsync('textures/lava.jpeg');
        blendTexture.wrapS = blendTexture.wrapT = THREE.RepeatWrapping;
        // multiplier for distortion speed
        const blendSpeed = 0.01;
        // adjust lightness/darkness of blended texture
        const blendOffset = 0.25;

        // texture to determine normal displacement
        const bumpTexture = noiseTexture;
        bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;
        // multiplier for distortion speed
        const bumpSpeed = 0.15;
        // magnitude of normal displacement
        const bumpScale = 40.0;

        // use "this." to create global object
        this.customUniforms = {
            baseTexture: {type: "t", value: lavaTexture},
            baseSpeed: {type: "f", value: baseSpeed},
            repeatS: {type: "f", value: repeatS},
            repeatT: {type: "f", value: repeatT},
            noiseTexture: {type: "t", value: noiseTexture},
            noiseScale: {type: "f", value: noiseScale},
            blendTexture: {type: "t", value: blendTexture},
            blendSpeed: {type: "f", value: blendSpeed},
            blendOffset: {type: "f", value: blendOffset},
            bumpTexture: {type: "t", value: bumpTexture},
            bumpSpeed: {type: "f", value: bumpSpeed},
            bumpScale: {type: "f", value: bumpScale},
            alpha: {type: "f", value: 1.0},
            time: {type: "f", value: 1.0}
        };

        this.ballMaterial = new THREE.ShaderMaterial({
            uniforms: this.customUniforms,
            vertexShader: ballDeformVert,
            fragmentShader: lavaFrag
        });
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

    async prepare() {
        const enabled = this.pool!.isEnabled

        await this.createPoolMaterial()

        this.runeSideMesh = this.makeOneMesh(true, enabled)
        this.assetSideMesh = this.makeOneMesh(false, enabled)

        this.updateScale()
    }

    constructor(pool: PoolDetail) {
        super();

        const cfg = Config.Scene.PoolObject

        this.pool = pool

        this.add(this.innerOrbitHolder)
        this.innerOrbitHolder.rotateOnAxis(randomPointOnSphere(), Math.random() * Math.PI * 2)
        this.speed = randomGauss(cfg.Speed.CenterGauss, cfg.Speed.ScaleGauss)

        const radius = this.pool!.isEnabled ?
            randomGauss(cfg.Enabled.Distance.CenterGauss, cfg.Enabled.Distance.ScaleGauss) :
            randomGauss(cfg.Staged.Distance.CenterGauss, cfg.Staged.Distance.ScaleGauss);
        const n = randomPointOnSphere(1.0)
        this.orbit = new Orbit(this, ZeroVector3.clone(), radius, n)
        this.orbit.randomizePhase()
        this.orbit.step()

        this.createLabel(pool.asset)
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
        const label = new SpriteText(name, 24, 'white')
        this.add(label)
    }

    public update(dt: number) {
        if (this.orbit) {
            this.orbit.step(dt, this.speed)
        }

        this.assetSideOrbit?.step(dt * this.innerSpeed)
        this.runeSideOrbit?.step(dt * this.innerSpeed)

        if (this.customUniforms) {
            this.customUniforms.time.value += dt;
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

    private static _addGlow(obj: THREE.Object3D) {
        const textureLoader = new THREE.TextureLoader()
        const texture = textureLoader.load('textures/glow1.png')
        const spriteMaterial = new THREE.SpriteMaterial(
            {
                map: texture,
                sizeAttenuation: true,
                color: 0xffff66, transparent: false,
                blending: THREE.AdditiveBlending
            });
        let sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(200, 200, 1.0);
        obj.add(sprite); // this centers the glow at the mesh
    }
}
