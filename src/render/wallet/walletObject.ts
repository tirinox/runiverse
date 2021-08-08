import * as THREE from "three";
import {Vector3} from "three";
import {ZeroVector3} from "@/helpers/3d";
import {easyHash, truncateStringAtMiddle} from "@/helpers/data_utils";
import SpriteText from "three-spritetext";
import {Config} from "@/config";
import {hashedColorTint} from "@/helpers/colors";


export class WalletObject extends THREE.Object3D {
    private mesh?: THREE.Object3D
    public label?: SpriteText

    private static geom: THREE.ConeGeometry = new THREE.ConeGeometry(30, 50, 8, 1)
    private address: string;

    private lastUpdatedAt: number = Date.now();

    updateDate() {
        this.lastUpdatedAt = Date.now()
    }

    get age() {
        return Date.now() - this.lastUpdatedAt
    }

    private static material = new THREE.MeshLambertMaterial({
        color: 0xff6600,
        reflectivity: 0.4,
    });

    constructor(address: string) {
        super();
        this.address = address

        const cfg = Config.Scene.WalletObject
        
        const material = new THREE.MeshBasicMaterial({
            color: hashedColorTint(address, 'color')
        })

        this.mesh = new THREE.Mesh(WalletObject.geom, material)
        this.mesh.up.copy(new Vector3(0, 1, 0))
        this.add(this.mesh)

        if (cfg.Label.Enabled) {
            this.createLabel(address)
        }

        this.updateDate()
    }

    positionate(pos: Vector3) {
        this.position.copy(pos)
        this.mesh?.lookAt(ZeroVector3) // look at the center of the Runiverse
    }

    createLabel(address: string) {
        const name = truncateStringAtMiddle(address, 4, 4, 22)
        this.label = new SpriteText(name, 24, 'rgba(255, 255, 255, 0.6)')
        this.label.position.y = 42
        this.label.position.x = 0
        this.add(this.label)
    }

    public update(dt: number) {
    }

    public dispose() {
        this.label = undefined
        this.parent?.remove(this)
    }
}
