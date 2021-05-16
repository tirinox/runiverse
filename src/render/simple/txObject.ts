import * as THREE from "three";
import {Vector3} from "three";
import {ThorTransaction} from "@/provider/midgard/tx";
import {ZeroVector3} from "@/helpers/3d";
import {Transaction} from "@/provider/midgard/v2";


export class TxObject {
    public mesh?: THREE.Object3D

    public targetPosition = new Vector3()
    public sourcePosition = new Vector3()

    public myLove?: TxObject

    public targets: Array<string> = []

    public tx?: ThorTransaction  // parent tx
    public subTx?: Transaction  // specific sub tx of the parent tx

    private velocity = new Vector3()
    public mass: number = 1.0
    public force = new Vector3()

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

    constructor(tx: ThorTransaction, runesPerAsset: number, sourcePosition: Vector3) {
        this.tx = tx

        this.mesh = new THREE.Mesh(TxObject.geoBox, TxObject.whiteMaterial)

        this.sourcePosition = sourcePosition.clone()
        this.mesh.position.copy(sourcePosition)

        const scale = this.scaleFromTx(tx, runesPerAsset)
        this.mesh.scale.setScalar(scale)
        this.mass = Math.max(scale, 0.1)
    }

    public dispose() {
        if (this.mesh) {
            this.mesh.parent?.remove(this.mesh)
            this.mesh = undefined
        }
    }

    public update(dt: number) {
        if (!this.mesh) {
            return
        }

        let accel = this.force.clone()
        accel.multiplyScalar(dt / this.mass)
        this.velocity.add(accel)

        let shift = this.velocity.clone()
        shift.multiplyScalar(dt)
        this.mesh.position.add(shift)

        if(this.mesh.position.length() > 1e8) {
            console.log('Mesh has fled far away!')
            this.mesh.position.copy(ZeroVector3)
        }
    }

    get isCloseToTarget(): boolean {
        const minDistanceToObject = TxObject.MinDistanceToTarget

        if (!this.targetPosition || !this.mesh) {
            return false
        } else {
            // clone is acutely important
            let deltaPosition = this.targetPosition.clone().sub(this.mesh.position)
            return deltaPosition.length() < minDistanceToObject
        }
    }
}


