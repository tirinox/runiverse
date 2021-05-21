import * as THREE from "three";
import {Vector3} from "three";
import {ThorTransaction} from "@/provider/midgard/tx";
import {PhysicalObject} from "@/helpers/physics";
import {randomGauss, randomPointOnSphere} from "@/helpers/3d";
import {Config} from "@/config";
import {RUNE_COLOR} from "@/helpers/colors";


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

    public rotationAxis = randomPointOnSphere(1.0)
    public rotationSpeed = randomGauss(0.0, Config.SimpleScene.TxObject.RotationSpeedGaussMagnitude)

    private static geoBox: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)

    private static whiteMaterial: THREE.Material = new THREE.MeshBasicMaterial({
        color: RUNE_COLOR,
        reflectivity: 0.1,
    });

    scaleFromTx(runeAmount: number): number {
        const cfg = Config.SimpleScene.TxObject
        const sc = cfg.ScaleConst * Math.pow(runeAmount, cfg.ScalePower)
        return Math.max(1.0, sc)
    }

    constructor(mass: number, sourcePosition: Vector3, runeAmount: number) {
        super(mass);

        this.obj3d = new THREE.Mesh(TxObject.geoBox, TxObject.whiteMaterial)

        this.obj3d.scale.setScalar(this.scaleFromTx(runeAmount))

        this.obj3d.position.copy(sourcePosition)
    }

    update(dt: number) {
        super.update(dt);
        if(this.obj3d) {
            this.obj3d.rotateOnAxis(this.rotationAxis, this.rotationSpeed * dt)
        }
    }
}
