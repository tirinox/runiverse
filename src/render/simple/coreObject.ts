import * as THREE from "three";
import SpriteText from 'three-spritetext';
import {Config} from "@/config";
import {truncStringTail} from "@/helpers/data_utils";
import coreGalaxyVert from "@/render/simple/shaders/core_galaxy.vert"
import coreGalaxyFrag from "@/render/simple/shaders/core_galaxy.frag"

const CoreObjSize = Config.Scene.Core.Scale;
const CoreObjScale = Config.Scene.Core.Radius / CoreObjSize


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
                color: new THREE.Color('#555555'),
                transparent: true,
                opacity: 0.5
            })
        )
        this.core.scale.setScalar(CoreObjScale)
        this.add(this.core)
    }

    private async loadCoreMeshBlackHole() {
        const loader = new THREE.FileLoader()
        // const vertexShader: string = <string>await loader.loadAsync('shaders/black_hole.vert')
        // const fragmentShader: string = <string>await loader.loadAsync('shaders/black_hole.frag')
        const vertexShader = coreGalaxyVert
        const fragmentShader = coreGalaxyFrag

        const textureLoader = new THREE.TextureLoader()
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
            // new THREE.BoxGeometry(CoreObjSize, CoreObjSize, CoreObjSize),
            new THREE.SphereGeometry(CoreObjSize, 8, 8),
            this.material
        )
        this.core.scale.setScalar(CoreObjScale)
        this.add(this.core)
    }

    constructor() {
        super();

        if(Config.Scene.Core.Simplified) {
            this.loadCoreMeshSimple().then()
        } else {
            this.loadCoreMeshBlackHole().then()
        }

        const label = this.createLabel("Black hole")
        label.position.y = 180
        label.position.x = -140
        this.add(label)
    }

    createLabel(name: string) {
        const maxLen = Config.Scene.PoolObject.MaxPoolNameLength
        name = truncStringTail(name, maxLen)
        return new SpriteText(name, 24, 'white')
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
