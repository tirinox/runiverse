import * as THREE from "three";
import {Object3D, Vector3} from "three";
import {ZeroVector3} from "@/helpers/3d";
import {truncateStringAtMiddle} from "@/helpers/data_utils";
import SpriteText from "three-spritetext";


export class WalletObject {
    public obj?: THREE.Object3D
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

    constructor(address: string) {
        this.address = address

        // const assetIsRune = isRuneStr(coin.asset)

        let color = 0xbbbbbb
        // if(assetIsRune) {
        //     color.setHex(RUNE_COLOR)
        // } else {
        //     color.setHSL(Math.random(), 0.8, 0.5)
        // }

        const material = new THREE.MeshBasicMaterial({
            color: color,
            reflectivity: 0.4,
        });

        let obj = new Object3D()

        this.mesh = new THREE.Mesh(WalletObject.geom, material)
        this.mesh.up.copy(new Vector3(0, 1, 0))
        obj.add(this.mesh)

        // poolMesh.scale.setScalar(this.scaleFromPool(pool))

        this.label = this.createLabel(address)
        this.label.position.y = 80
        this.label.position.x = -40
        obj.add(this.label)

        this.updateDate()

        this.obj = obj
    }

    positionate(pos: Vector3) {
        this.obj?.position.copy(pos)
        this.mesh?.lookAt(ZeroVector3) // look at the center of the Runiverse
    }

    createLabel(name: string): SpriteText {
        name = truncateStringAtMiddle(name, 4, 4, 22)

        const myText = new SpriteText(name, 24, 'rgba(255,255,255,0.6)')
        return myText
    }

    public update(dt: number) {
    }

    public dispose() {
        this.label = undefined

        if (this.obj) {
            this.obj.parent?.remove(this.obj)
            this.obj = undefined
        }
    }
}
