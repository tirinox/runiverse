import * as THREE from "three";
import {ThorTransaction} from "@/provider/midgard/tx";
import {randomPointOnSphere} from "@/helpers/3d";


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

    private static geoBox: THREE.BoxGeometry = new THREE.BoxGeometry(5, 5, 5)

    private static txSourcePlaceRadius: number = 3000

    private static whiteMaterial: THREE.Material = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        reflectivity: 0.5,
    });

    scaleFromTx(tx: ThorTransaction, runesPerAsset: number): number {
        return Math.pow(tx.runeVolume(runesPerAsset), 0.11) / 50
    }

    constructor(tx: ThorTransaction, runesPerAsset: number) {
        this.tx = tx

        this.mesh = new THREE.Mesh(TxObject.geoBox, TxObject.whiteMaterial)
        const position = randomPointOnSphere(TxObject.txSourcePlaceRadius)
        this.mesh.scale.setScalar(this.scaleFromTx(tx, runesPerAsset))
        this.mesh.position.copy(position)
    }

    public dispose() {
        if (this.mesh) {
            this.mesh.parent?.remove(this.mesh)
            this.mesh = undefined
        }
    }

    public update(dt: number) {
        const minUnitsPerSec = 2.0

        if (!this.target || !this.mesh) {
            return
        }

        let deltaPosition = this.target.position.sub(this.mesh.position)
        let shift = deltaPosition.clone()
        shift.multiplyScalar(this.speed)
        if (shift.length() < minUnitsPerSec) {
            shift.normalize()
            shift.multiplyScalar(minUnitsPerSec)
        }
        this.mesh.position.add(shift)
    }

    get isCloseToTarget(): boolean {
        const minDistanceToObject = 3.0

        if (!this.target || !this.mesh) {
            return false
        } else {
            let deltaPosition = this.target.position.sub(this.mesh.position)
            return deltaPosition.length() < minDistanceToObject
        }
    }
}


class TxObjectManager {
    private txMeshes: Record<string, TxObject> = {}

    constructor() {

    }
}