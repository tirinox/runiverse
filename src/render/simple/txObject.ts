import * as THREE from "three";
import {Mesh, Vector3} from "three";
import {PhysicalObject} from "@/helpers/physics";
import {randomGauss, randomPointOnSphere} from "@/helpers/3d";
import {Config} from "@/config";
import {RUNE_COLOR} from "@/helpers/colors";


export const enum TxState {
    ToPool,
    CrossPool,
    ToWallet,
    ToCore,
}

export class TxObject extends PhysicalObject {
    public walletAddress = ''
    public poolName = ''
    public state: TxState = TxState.ToPool
    public waiting = false
    public iterations = 0

    private mesh?: Mesh

    public rotationAxis = randomPointOnSphere(1.0)
    public rotationSpeed = randomGauss(0.0, Config.SimpleScene.TxObject.RotationSpeedGaussMagnitude)

    private static geoBox: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)

    private static whiteMaterial: THREE.Material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        reflectivity: 0.1,
    });

    private static runeMaterial: THREE.Material = new THREE.MeshLambertMaterial({
        color: RUNE_COLOR,
        reflectivity: 0.1,
    });

    scaleFromTx(runeAmount: number): number {
        const cfg = Config.SimpleScene.TxObject
        const sc = cfg.ScaleConst * Math.pow(runeAmount, cfg.ScalePower)
        return Math.max(1.0, sc)
    }

    constructor(mass: number, runeAmount: number, isRune: boolean) {
        super(mass);

        const mat = isRune ? TxObject.runeMaterial : TxObject.whiteMaterial
        this.mesh = new THREE.Mesh(TxObject.geoBox, mat)
        this.mesh.scale.setScalar(this.scaleFromTx(runeAmount))
        this.add(this.mesh)
    }

    update(dt: number) {
        super.update(dt);
        this.iterations++
        if(this.mesh) {
            this.mesh.rotateOnAxis(this.rotationAxis, this.rotationSpeed * dt)
        }
    }
}
