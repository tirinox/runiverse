import * as THREE from "three";
import SpriteText from 'three-spritetext';
import {Config} from "@/config";
import {truncStringTail} from "@/helpers/data_utils";
import {Mesh} from "three";


export class CoreObject extends THREE.Object3D {
    private static geoCore: THREE.SphereGeometry = new THREE.SphereGeometry(Config.SimpleScene.Core.Radius, 100, 100)
    private core: Mesh;

    constructor() {
        super();

        this.core = new THREE.Mesh(CoreObject.geoCore, new THREE.MeshBasicMaterial({color: Config.SimpleScene.Core.Color}))
        this.add(this.core)

        const label = this.createLabel("Black hole")
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
    }

    public dispose() {
    }
}
