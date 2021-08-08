import * as THREE from "three";
import {Vector3} from "three";
import {ZeroVector3} from "@/helpers/3d";
import {truncateStringAtMiddle} from "@/helpers/data_utils";
import SpriteText from "three-spritetext";


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

        this.mesh = new THREE.Mesh(WalletObject.geom, WalletObject.material)
        this.mesh.up.copy(new Vector3(0, 1, 0))
        this.add(this.mesh)

        // poolMesh.scale.setScalar(this.scaleFromPool(pool))

        this.label = this.createLabel(address)
        this.label.position.y = 80
        this.label.position.x = -40
        this.add(this.label)

        this.updateDate()
    }

    positionate(pos: Vector3) {
        this.position.copy(pos)
        this.mesh?.lookAt(ZeroVector3) // look at the center of the Runiverse
    }

    createLabel(name: string): SpriteText {
        name = truncateStringAtMiddle(name, 4, 4, 22)
        return new SpriteText(name, 24, 'rgba(255, 255, 255, 0.6)')
    }

    public update(dt: number) {
    }

    public dispose() {
        this.label = undefined
        this.parent?.remove(this)
    }
}
