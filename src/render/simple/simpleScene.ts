import {Scene, Vector3} from "three";
import {EventType, PoolChangeType, ThorEvent, ThorEventListener, TxEventType} from "@/provider/types";
import {TxObjectManager} from "@/render/simple/txObjectManager";
import {PoolObjectManager} from "@/render/simple/poolObjectManager";
import {WalletObjectManager} from "@/render/simple/walletObjectManager";
import {TxObject} from "@/render/simple/txObject";


export default class SimpleScene implements ThorEventListener {
    private scene: Scene;

    private txObjManager = new TxObjectManager()
    private poolObjManager = new PoolObjectManager()
    private walletObjManager = new WalletObjectManager()

    updateAnimations(dt: number) {
        this.poolObjManager.update(dt)
        this.txObjManager.update(dt)
        this.walletObjManager.update(dt)
    }

    // --------- init & load & service -----

    onResize(w: number, h: number) {
    }

    constructor(scene: Scene) {
        this.scene = scene

        this.poolObjManager.scene = scene
        this.poolObjManager.createCore()

        this.txObjManager.scene = scene
        this.txObjManager.poolMan = this.poolObjManager
        this.txObjManager.walletMan = this.walletObjManager

        this.walletObjManager.scene = scene

        // debug!
        // const pos = new Vector3(777, 777, 777)
        // const txo = new TxObject(100, pos)
        // txo.obj3d?.position.copy(pos)
        // this.scene.add(txo.obj3d!)
    }

    // ------ event routing -------

    receiveEvent(e: ThorEvent): void {
        if (e.eventType == EventType.ResetAll) {
            console.log('booms! reset all')
            this.poolObjManager.removeAllPoolMeshes()
        } else if (e.eventType == EventType.UpdatePool) {
            const change = e.poolChange!

            if (change.type == PoolChangeType.Removed) {
                this.poolObjManager.removePoolMesh(change.previousPool!)
            } else {
                if (!this.poolObjManager.isTherePoolMesh(change.pool!.asset)) {
                    this.poolObjManager.addNewPoolMesh(change.pool!)
                }
                if (change.type == PoolChangeType.DepthChanged) {
                    this.poolObjManager.hearBeat(e.poolChange?.pool!)
                }
            }
        } else if (e.eventType == EventType.Transaction) {
            const ev = e.txEvent!

            if (ev.type == TxEventType.Add) {
                this.walletObjManager.makeWalletsFromTx(ev.tx) // this is always 1st!
                this.txObjManager.createTransactionMesh(ev.tx)
            } else if (ev.type == TxEventType.Destroy) {
                this.txObjManager.destroyTransactionMesh(ev.tx)
            } else if (ev.type == TxEventType.StatusUpdated) {
                this.walletObjManager.makeWalletsFromTx(ev.tx) // this is always 1st!
                this.txObjManager.updateTransactionMeshStatus(ev.tx)
            }
        }
    }
}
