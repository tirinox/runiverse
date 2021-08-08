import * as THREE from "three";
import {PointLight, Scene} from "three";
import {EventType, PoolChangeType, ThorEvent, ThorEventListener, TxEventType} from "@/provider/types";
import {TxObjectManager} from "@/render/tx/txObjectManager";
import {PoolObjectManager} from "@/render/pool/poolObjectManager";
import {WalletObjectManager} from "@/render/wallet/walletObjectManager";
import {Config} from "@/config";
import {CoreObject} from "@/render/core/coreObject";
import StarBackground from "@/render/background";
import {IScene} from "@/render/sceneInterface";

export default class SimpleScene implements ThorEventListener, IScene {
    private readonly scene: Scene;

    private txObjManager = new TxObjectManager()
    private poolObjManager = new PoolObjectManager()
    private walletObjManager = new WalletObjectManager()
    private core?: CoreObject;

    updateAnimations(dt: number) {
        this.poolObjManager.update(dt)
        this.txObjManager.update(dt)
        this.walletObjManager.update(dt)
        this.core?.update(dt)
    }

    setEnvironment(tex: THREE.CubeTexture) {
        this.core?.setEnvironment(tex)
    }

    // --------- init & load & service -----

    onResize(w: number, h: number) {
    }

    public createCore() {
        if (this.core) {
            return
        }

        this.core = new CoreObject()
        this.scene.add(this.core)
    }

    constructor(scene: Scene) {
        this.scene = scene

        this.createCore()

        this.poolObjManager.scene = scene

        this.txObjManager.scene = scene
        this.txObjManager.poolMan = this.poolObjManager
        this.txObjManager.walletMan = this.walletObjManager

        this.walletObjManager.scene = scene

        this.makeLight()

        if (Config.Scene.Cubemap.Enabled) {
            StarBackground.makeStarEnvironment(this.scene)
        }
    }

    private makeLight() {
        const pointLight = new PointLight(0xffffff, 1.0);
        pointLight.position.set(0, 0, 0);
        this.scene.add(pointLight);

        const ambient = new THREE.AmbientLight(0xffffff);
        this.scene.add(ambient);
    }

    private resetAll() {
        console.log('Boom! Reset the scene!')
        this.poolObjManager.removeAllPoolMeshes()
        this.txObjManager.removeAll()
        this.walletObjManager.removeAll()
    }

    // ------ event routing -------

    receiveEvent(e: ThorEvent): void {
        if (e.eventType == EventType.ResetAll) {
            this.resetAll()
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
                this.txObjManager.createTransactionObjects(ev.tx)
            } else if (ev.type == TxEventType.Destroy) {
                this.txObjManager.destroyTransactionMesh(ev.tx)
            } else if (ev.type == TxEventType.StatusUpdated) {
                this.walletObjManager.makeWalletsFromTx(ev.tx) // this is always 1st!
                this.txObjManager.updateTransactionMeshStatus(ev.tx)
            }
        }
    }
}