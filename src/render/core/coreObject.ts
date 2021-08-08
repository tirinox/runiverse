import * as THREE from "three";
import {Config} from "@/config";
import coreGalaxyVert from "@/render/core/core_galaxy.vert"
import coreGalaxyFrag from "@/render/core/core_galaxy.frag"
import coreBlackholeVert from "@/render/core/black_hole.vert"
import coreBlackholeFrag from "@/render/core/black_hole.frag"
import coreBlackholeLabVert from "@/render/core/black_hole_lab.vert"
import coreBlackholeLabFrag from "@/render/core/black_hole_lab.frag"
import simpleGlowVert from "@/render/shaders/simple_glow.vert"
import simpleGlowFrag from "@/render/shaders/simple_glow.frag"
import {textureLoader} from "@/helpers/3d";


const CoreObjSize = Config.Scene.Core.Scale;
const CoreObjScale = Config.Scene.Core.Radius / CoreObjSize

enum BlackHoleType {
    Lab, Galaxy, Standart
}

const BH_Type = BlackHoleType.Lab

export class CoreObject extends THREE.Group {
    private core?: THREE.Mesh;
    private material?: THREE.ShaderMaterial;

    private cubeMap?: THREE.CubeTexture;

    private t = 0.0

    public setEnvironment(environment: THREE.CubeTexture) {
        this.cubeMap = environment
        if (this.material) {
            this.material.uniforms["texEnvironMap"].value = this.cubeMap
        }
    }

    private async loadCoreMeshSimple() {
        this.core = new THREE.Mesh(
            // new THREE.BoxGeometry(CoreObjSize, CoreObjSize, CoreObjSize),
            new THREE.SphereGeometry(CoreObjSize, 50, 50),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color('#000000'),
            })
        )
        this.core.scale.setScalar(CoreObjScale)
        this.add(this.core)

        const glowMat = new THREE.ShaderMaterial(
            {
                uniforms: {},
                vertexShader: simpleGlowVert,
                fragmentShader: simpleGlowFrag,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                transparent: true
            });

        const coreGlow = new THREE.Mesh(
            new THREE.SphereGeometry(CoreObjSize * 1.1, 50, 50),
            glowMat
        )
        this.core.add(coreGlow)
    }

    private bhVertAndFragShaders(t: BlackHoleType): [string, string] {
        if(t == BlackHoleType.Lab) {
            return [coreBlackholeLabVert, coreBlackholeLabFrag]
        } else if(t == BlackHoleType.Galaxy) {
            return [coreGalaxyVert, coreGalaxyFrag]
        } else {
            return [coreBlackholeVert, coreBlackholeFrag]
        }
    }

    private async loadCoreMeshBlackHole() {
        // const loader = new THREE.FileLoader()
        // const vertexShader: string = <string>await loader.loadAsync('shaders/black_hole.vert')
        // const fragmentShader: string = <string>await loader.loadAsync('shaders/black_hole.frag')

        let [vertexShader, fragmentShader] = this.bhVertAndFragShaders(BH_Type)

        const noiseTexture = await textureLoader.loadAsync("textures/noise-rgb64.png")

        const uniforms = {
            "time": {value: 1.0},
            texEnvironMap: {type: 't', value: this.cubeMap},
            texNoise: {type: 't', value: noiseTexture}
        }

        this.material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            transparent: true
        })

        this.core = new THREE.Mesh(
            new THREE.BoxGeometry(CoreObjSize, CoreObjSize, CoreObjSize),
            // new THREE.SphereGeometry(CoreObjSize, 8, 8),
            this.material
        )
        this.core.scale.setScalar(CoreObjScale)
        this.add(this.core)
    }

    constructor() {
        super();

        if (Config.Scene.Core.Simplified) {
            this.loadCoreMeshSimple().then()
        } else {
            this.loadCoreMeshBlackHole().then()
        }
    }

    public update(dt: number) {
        this.t += dt
        if (this.material) {
            this.material.uniforms.time.value = this.t
            this.material.uniformsNeedUpdate = true
        }
    }

    public dispose() {
    }
}
