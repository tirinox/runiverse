import * as THREE from "three";
import {ThorTransaction} from "@/provider/midgard/tx";
import {randomPointOnSphere} from "@/helpers/3d";
import {Vector3} from "three";


export const enum TxObjectState {
    Waiting = 'Waiting',
    FromWalletToPool = 'FromWalletToPool',
    BetweenPools = 'BetweenPools',
    FromPoolToWallet = 'FromPoolToWallet',
    FromWalletToCore = 'FromWalletToCore',
    FromCoreToWallet = 'FromCoreToWallet',
}

export class TxObject {
    public mesh?: THREE.Object3D

    public target?: THREE.Object3D

    public tx?: ThorTransaction
    public state: TxObjectState = TxObjectState.Waiting

    public speed: number = 0.005
    private static txSourcePlaceRadius: number = 3000
    private static MinDistanceToTarget = 3.0
    private static MinSpeed = 0.1

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

    constructor(tx: ThorTransaction, runesPerAsset: number) {
        this.tx = tx

        this.mesh = new THREE.Mesh(TxObject.geoBox, TxObject.whiteMaterial)

        const position = randomPointOnSphere(TxObject.txSourcePlaceRadius)
        this.mesh.position.copy(position)

        const scale = this.scaleFromTx(tx, runesPerAsset)
        this.mesh.scale.setScalar(scale)

        this.speed = 0.05 / scale
    }

    public dispose() {
        if (this.mesh) {
            this.mesh.parent?.remove(this.mesh)
            this.mesh = undefined
        }
    }

    public update(dt: number) {
        const minUnitsPerSec = TxObject.MinSpeed

        if (!this.target || !this.mesh) {
            return
        }

        let dx = this.target.position.clone()
        dx.sub(this.mesh.position)
        dx.multiplyScalar(this.speed)
        if (dx.length() < minUnitsPerSec) {
            dx.normalize()
            dx.multiplyScalar(minUnitsPerSec)
        }
        this.mesh.position.add(dx)
    }

    get isCloseToTarget(): boolean {
        const minDistanceToObject = TxObject.MinDistanceToTarget

        if (!this.target || !this.mesh) {
            return false
        } else {
            // clone is archi importantn
            let deltaPosition = this.target.position.clone().sub(this.mesh.position)
            return deltaPosition.length() < minDistanceToObject
        }
    }
}


class TxObjectManager {
    private txMeshes: Record<string, TxObject> = {}

    constructor() {

    }
}