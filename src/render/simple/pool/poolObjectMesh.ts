import * as THREE from "three";
import ballDeformVert from "@/render/simple/shaders/ball_deform.vert"
import lavaFrag from "@/render/simple/shaders/fire_ball.frag"
import {randomGauss} from "@/helpers/3d";
import {Vector3} from "three";
import {LAYER_BLOOM_SCENE} from "@/render/simple/layers";


export class PoolObjectMesh extends THREE.Object3D {
    private glowMaterial?: THREE.SpriteMaterial
    private glow?: THREE.Sprite
    private mesh?: THREE.Mesh

    private static geoPool: THREE.SphereGeometry = new THREE.SphereGeometry(50, 100, 100)
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
        this.prepare().then(() => {})
    }

    public update(dt: number) {
        this._rotateMesh(dt)
    }

    private _rotateMesh(dt: number) {
        this.rotateX(dt)
        this.rotateY(dt)
        this.rotateZ(dt * 0.5)
    }

    private _addPlainGlow(glowColor: THREE.Color) {
        if(this.glow) {
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

        this.glow = new THREE.Sprite(this.glowMaterial);
        this.glow.scale.set(160, 160, 1.0);
        this.add(this.glow); // this centers the glow at the mesh
    }

    private getGlowColor() {
        const glowColor = this.assetColor.clone()
        glowColor.offsetHSL(0.0, 0.0, 0.5)
        return glowColor
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

        // base image texture for mesh
        const lavaTexture = await PoolObjectMesh.textureLoader.loadAsync('textures/lava-bw.png')
        lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping;
        // multiplier for distortion speed
        const baseSpeed = 0.02;
        // number of times to repeat texture in each direction
        const repeatS = 4.0;
        const repeatT = 4.0;

        // texture used to generate "randomness", distort all other textures
        const noiseTexture = await PoolObjectMesh.textureLoader.loadAsync('textures/noise-cloud.png');
        noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;
        // magnitude of noise effect
        const noiseScale = 0.5;

        // texture to additively blend with base image texture
        const blendTexture = await PoolObjectMesh.textureLoader.loadAsync('textures/lava-bw.png');
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
            time: {type: "f", value: 1.0},
            assetColor: this.assetColor
        };

        this.ballMaterial = new THREE.ShaderMaterial({
            uniforms: this.customUniforms,
            vertexShader: ballDeformVert,
            fragmentShader: lavaFrag
        });
    }
}
