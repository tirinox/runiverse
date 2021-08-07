import * as THREE from "three";
import {Vector3} from "three";
import ballDeformVert from "@/render/simple/shaders/ball_deform.vert"
import lavaFrag from "@/render/simple/shaders/fire_ball.frag"
import {randomGauss, ZeroVector3} from "@/helpers/3d";
import {LAYER_BLOOM_SCENE} from "@/render/simple/layers";
import {Config} from "@/config";
import {Geometry} from "three/examples/jsm/deprecated/Geometry";


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
    private _rotationSpeed: Vector3;
    public readonly assetColor: THREE.Color;
    public readonly assetColor2: THREE.Color;
    private flowVert: any[] = [];
    private geometry?: THREE.BufferGeometry;
    private sisterDirection: Vector3 = ZeroVector3.clone();

    set rotationSpeed(value: Vector3) {
        this._rotationSpeed = value;
    }

    constructor(assetColor: THREE.Color, assetColor2: THREE.Color) {
        super();
        this.assetColor = assetColor
        this.assetColor2 = assetColor2
        const rSpeedVar = Config.Scene.PoolObject.Mesh.RotationVar
        this._rotationSpeed = new Vector3(
            randomGauss(0, rSpeedVar),
            randomGauss(0, rSpeedVar),
            randomGauss(0, rSpeedVar),
        )
        this.prepare().then(() => {
        })
    }

    public setSisterParams(localDir: THREE.Vector3,
                           sistersDistance: number,
                           sisterWorldPos: THREE.Vector3,
                           sisterColor: THREE.Color) {
        if (this.customUniforms) {
            this.customUniforms.sisterWorldPos.value = sisterWorldPos.clone()
            this.customUniforms.sisterColor.value = sisterColor.clone().lerp(this.assetColor, 0.5);
            this.customUniforms.sistersDistance.value = sistersDistance
            this.customUniforms.thisWorldPos.value = this.getWorldPosition(new Vector3())
            this.sisterDirection = localDir.clone().negate()
        }
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

        this.updateParticles()
    }

    private _rotateMesh(dt: number) {
        this.rotateX(dt * this._rotationSpeed.x)
        this.rotateY(dt * this._rotationSpeed.y)
        this.rotateZ(dt * this._rotationSpeed.z)
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

        if (Config.Scene.PoolObject.Glow.Enabled) {
            this._addPlainGlow(this.getGlowColor())
        }

        await this.createParticles()
    }

    private async createBallMaterial() {
        if (this.ballMaterial) {
            return
        }

        const baseTexName = 'textures/lava-bw.png'
        const blendTexName = 'textures/noise-perlin1.png'
        // const blendTexName = 'textures/lava-bw.png'

        const cfg = Config.Scene.PoolObject.BallShader

        // base image texture for mesh
        const baseTexture = await PoolObjectMesh.textureLoader.loadAsync(baseTexName)
        baseTexture.wrapS = baseTexture.wrapT = THREE.RepeatWrapping;
        // multiplier for distortion speed
        const baseSpeed = cfg.BaseSpeed;
        // number of times to repeat texture in each direction

        // texture used to generate "randomness", distort all other textures
        // noise-perlin1
        const noiseTexture = await PoolObjectMesh.textureLoader.loadAsync('textures/noise-cloud.png');
        noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;

        // texture to additively blend with base image texture
        const blendTexture = await PoolObjectMesh.textureLoader.loadAsync(blendTexName);
        blendTexture.wrapS = blendTexture.wrapT = THREE.RepeatWrapping;

        // texture to determine normal displacement
        const bumpTexture = noiseTexture;
        bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;

        // use "this." to create global object
        this.customUniforms = {
            baseTexture: {type: "t", value: baseTexture},
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
            assetColor2: {type: "c", value: this.assetColor2},
            sisterColor: {type: "c", value: new THREE.Color(0)},
            sisterWorldPos: {type: "v3", value: new Vector3(0, 0, 1)},
            thisWorldPos: {type: "v3", value: new Vector3(0, 0, 1)},
            sistersDistance: {type: "f", value: 100.0},
        };

        this.ballMaterial = new THREE.ShaderMaterial({
            uniforms: this.customUniforms,
            vertexShader: ballDeformVert,
            fragmentShader: lavaFrag,
        });
    }

    private updateParticles() {
        const time = Date.now() * 0.00005;

        // for (let i = 0; i < this.children.length; i++) {
        //     const object = this.children[i];
        //     if (object instanceof THREE.Points) {
        //         // object.rotation.y = time * (i < 4 ? i + 1 : -(i + 1));
        //     }
        // }

        if (this.geometry) {
            const verts = this.geometry.attributes.position.array
            // const fullDist = this.sisterDirection.length()
            // const normDir = this.sisterDirection.clone().normalize()

            //
            for (let i = 0; i < verts.length / 3; ++i) {
                const d = THREE.MathUtils.randFloat(1.0, 5.5)
                this.setParticlePosition(verts, i, this.sisterDirection.clone().multiplyScalar(d).add(
                    new Vector3(
                        randomGauss(0, 50),
                        randomGauss(0, 50),
                        randomGauss(0, 50),
                    )
                ))
            }

            this.geometry.attributes.position.needsUpdate = true;
        }
    }

    private setParticlePosition(buff: any, i: number, pos: Vector3) {
        buff[i * 3] = pos.x
        buff[i * 3 + 1] = pos.y
        buff[i * 3 + 2] = pos.z
    }

    private async createParticles() {
        const n = 300;
        const geometry = this.geometry = new THREE.BufferGeometry();
        this.flowVert = [];

        const textureLoader = new THREE.TextureLoader();

        const sprite1 = textureLoader.load('textures/particles/trail.png');
        const sprite2 = textureLoader.load('textures/particles/trail2.png');
        const sprite3 = textureLoader.load('textures/particles/trail3.png');

        const rVar = 30
        for (let i = 0; i < n; i++) {
            const x = randomGauss(0, rVar)
            const y = randomGauss(0, rVar)
            const z = randomGauss(0, rVar)

            // const y = Math.random() * 2000 - 1000;

            this.flowVert.push(x, y, z);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.flowVert, 3));

        const materials = [];
        for (let texture of [sprite1, sprite2, sprite3]) {
            const mat = new THREE.PointsMaterial({
                size: randomGauss(20, 10),
                map: texture,
                blending: THREE.AdditiveBlending,
                depthTest: true,
                transparent: true
            })

            mat.color.copy(this.assetColor)

            materials.push(mat)
            const particles = new THREE.Points(geometry, mat);
            this.add(particles)
        }
    }
}
