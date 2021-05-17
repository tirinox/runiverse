import * as THREE from "three";
import {Vector3} from "three";
import {ThorTransaction} from "@/provider/midgard/tx";
import {PhysicalObject} from "@/helpers/physics";
import {RUNE_COLOR} from "@/helpers/3d";


export const enum TxState {
    Wallet_to_Pool,
    Pool_to_Pool,
    Pool_to_Wallet,
    Wallet_to_Core,
    Core_to_Wallet
}

export class TxObject extends PhysicalObject {
    public walletAddress = ''
    public poolName = ''
    public state: TxState = TxState.Wallet_to_Pool

    private static geoBox: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)

    private static whiteMaterial: THREE.Material = new THREE.MeshBasicMaterial({
        color: RUNE_COLOR,
        reflectivity: 0.1,
    });

    scaleFromTx(tx: ThorTransaction, runesPerAsset: number): number {
        const runeVolume = tx.runeVolume(runesPerAsset)
        const sc = Math.pow(runeVolume, 0.15)
        return Math.max(1.0, sc)
    }

    constructor(mass: number, sourcePosition: Vector3) {
        super(mass);

        this.obj3d = new THREE.Mesh(TxObject.geoBox, TxObject.whiteMaterial)

        const scale = Math.log10(Math.max(1e-5, mass)) + 10

        this.obj3d.scale.setScalar(scale)

        this.obj3d.position.copy(sourcePosition)
    }
}
