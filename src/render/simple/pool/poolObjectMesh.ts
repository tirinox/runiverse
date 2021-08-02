import * as THREE from "three";
import ballDeformVert from "@/render/simple/shaders/ball_deform.vert"
import lavaFrag from "@/render/simple/shaders/fire_ball.frag"
import {randomGauss} from "@/helpers/3d";
import {Vector3} from "three";
import {LAYER_BLOOM_SCENE} from "@/render/simple/layers";
import {Config} from "@/config";


export class PoolObjectMesh extends THREE.Object3D {
    private glowMaterial?: THREE.SpriteMaterial
    private glow?: THREE.Sprite
    private mesh?: THREE.Mesh

    private static geoPool: THREE.SphereGeometry = new THREE.SphereGeometry(
        50,
        Config.Scene.PoolObject.SphereResolution,
        Config.Scene.PoolObject.SphereResolution)
    public static textureLoader = new THREE.TextureLoader()
    private ballMaterial?: THREE.ShaderMaterial;
    private customUniforms: any;
    private rotationSpeed: Vector3;
    private assetColor: THREE.Color;

    constructor(assetColor: THREE.Color) {
        super();
        this.assetColor = assetColor
        this.rotationSpeed = new Vector3(
            randomGauss(2.0, 1.0),
            randomGauss(2.0, 1.0),
            randomGauss(2.0, 1.0),
        )
        this.prepare().then(() => {
        })
    }

    public update(dt: number) {
        this._rotateMesh(dt)
        if (this.customUniforms) {
            this.customUniforms.time.value += dt;
        }

        if (this.glow) {
            const cfg = Config.Scene.PoolObject.Glow
            const radius = cfg.Radius;
            const radiusX = randomGauss(radius, cfg.RadiusVar)
            const radiusY = randomGauss(radius, cfg.RadiusVar)
            this.glow.scale.set(radiusX, radiusY, 1.0);

            this.glow.position.set(
                randomGauss(0.0, cfg.PosVar),
                randomGauss(0.0, cfg.PosVar),
                randomGauss(0.0, cfg.PosVar),
            )
        }
    }

    private _rotateMesh(dt: number) {
        this.rotateX(dt * this.rotationSpeed.x)
        this.rotateY(dt * this.rotationSpeed.y)
        this.rotateZ(dt * this.rotationSpeed.z)
    }

    private _addPlainGlow(glowColor: THREE.Color) {
        if (this.glow) {
            return
        }

        const texture = PoolObjectMesh.textureLoader.load('textures/glow1.png')
        this.glowMaterial = new THREE.SpriteMaterial(
            {
                map: texture,
                sizeAttenuation: true,
                color: glowColor,
                transparent: false,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });

        const radius = Config.Scene.PoolObject.Glow.Radius;

        this.glow = new THREE.Sprite(this.glowMaterial);
        this.glow.scale.set(radius, radius, 1.0);
        this.add(this.glow); // this centers the glow at the mesh
    }

    private getGlowColor() {
        const glowColor = this.assetColor.clone()
        glowColor.offsetHSL(
            randomGauss(0.0, 0.1),
            randomGauss(0.0, 0.1),
            randomGauss(0.1, 0.2))
        return glowColor
        // return new THREE.Color(0xff0000)
    }

    private async prepare() {
        await this.createBallMaterial()

        this.mesh = new THREE.Mesh(PoolObjectMesh.geoPool, this.ballMaterial)
        this.mesh.layers.enable(LAYER_BLOOM_SCENE)
        this.add(this.mesh)

        this._addPlainGlow(this.getGlowColor())
    }

    private async createBallMaterial() {
        if (this.ballMaterial) {
            return
        }

        const cfg = Config.Scene.PoolObject.BallShader

        // base image texture for mesh
        const lavaTexture = await PoolObjectMesh.textureLoader.loadAsync('textures/lava-bw.png')
        lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping;
        // multiplier for distortion speed
        const baseSpeed = cfg.BaseSpeed;
        // number of times to repeat texture in each direction

        // texture used to generate "randomness", distort all other textures
        const noiseTexture = await PoolObjectMesh.textureLoader.loadAsync('textures/noise-cloud.png');
        noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;

        // texture to additively blend with base image texture
        const blendTexture = await PoolObjectMesh.textureLoader.loadAsync('textures/lava-bw.png');
        blendTexture.wrapS = blendTexture.wrapT = THREE.RepeatWrapping;

        // texture to determine normal displacement
        const bumpTexture = noiseTexture;
        bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;

        // use "this." to create global object
        this.customUniforms = {
            baseTexture: {type: "t", value: lavaTexture},
            baseSpeed: {type: "f", value: baseSpeed},
            repeatS: {type: "f", value: cfg.RepeatS},
            repeatT: {type: "f", value: cfg.RepeatT},
            noiseTexture: {type: "t", value: noiseTexture},
            noiseScale: {type: "f", value: cfg.NoiseScale},
            blendTexture: {type: "t", value: blendTexture},
            blendSpeed: {type: "f", value: cfg.BlendSpeed},
            blendOffset: {type: "f", value: cfg.BlendOffset},
            bumpTexture: {type: "t", value: bumpTexture},
            bumpSpeed: {type: "f", value: cfg.BumpSpeed},
            bumpScale: {type: "f", value: cfg.BumpScale},
            alpha: {type: "f", value: 1.0},
            time: {type: "f", value: 1.0},
            assetColor: {type: "c", value: this.assetColor},
        };

        this.ballMaterial = new THREE.ShaderMaterial({
            uniforms: this.customUniforms,
            vertexShader: ballDeformVert,
            fragmentShader: lavaFrag,
        });
    }
}
