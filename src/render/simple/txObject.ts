import * as THREE from "three";
import {ThorTransaction} from "@/provider/midgard/tx";

export interface TxMesh {
    obj: THREE.Object3D
    target?: THREE.Object3D
    tx: ThorTransaction
    poolToFollow: string
}

export const enum TxObjectState {
    Waiting = 'Waiting',
    FromWalletToPool = 'FromWalletToPool',
    BetweenPools = 'BetweenPools',
    FromPoolToWallet = 'FromPoolToWallet',
    FromWalletToCore = 'FromWalletToCore',
    FromCoreToWallet = 'FromCoreToWallet',
}

class TxObject {
    public mesh?: THREE.Object3D
    public tx?: ThorTransaction
    public state: TxObjectState = TxObjectState.Waiting

    private static geoBox: THREE.BoxGeometry = new THREE.BoxGeometry(5, 5, 5)

    constructor() {

    }
}


class TxObjectManager {
    private txMeshes: Record<string, TxObject> = {}

    constructor() {

    }
}