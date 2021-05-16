import * as THREE from "three";
import {Vector3} from "three";
import {ThorTransaction} from "@/provider/midgard/tx";
import {PhysicalObject} from "@/helpers/physics";


export class TxObject extends PhysicalObject {
    public targetPosition = new Vector3()

    private static MinDistanceToTarget = 3.0

    private static geoBox: THREE.BoxGeometry = new THREE.BoxGeometry(5, 5, 5)

    private static whiteMaterial: THREE.Material = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        reflectivity: 0.5,
    });

    scaleFromTx(tx: ThorTransaction, runesPerAsset: number): number {
        const runeVolume = tx.runeVolume(runesPerAsset)
        const sc = Math.pow(runeVolume, 0.15)
        return Math.max(1.0, sc)
    }

    constructor(mass: number, sourcePosition: Vector3) {
        super(mass);

        this.obj3d = new THREE.Mesh(TxObject.geoBox, TxObject.whiteMaterial)
        this.obj3d.position.copy(sourcePosition)
    }

    get isCloseToTarget(): boolean {
        const minDistanceToObject = TxObject.MinDistanceToTarget

        if (!this.targetPosition || !this.obj3d) {
            return false
        } else {
            // clone is acutely important
            let deltaPosition = this.targetPosition.clone().sub(this.position!)
            return deltaPosition.length() < minDistanceToObject
        }
    }
}


