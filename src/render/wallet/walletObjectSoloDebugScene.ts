import * as THREE from "three";
import {Scene} from "three";
import {ThorEvent, ThorEventListener} from "@/provider/types";
import {Config} from "@/config";
import StarBackground from "@/render/background";
import {IScene} from "@/render/sceneInterface";
import {WalletObject} from "@/render/wallet/walletObject";
import {hashToPolarCoordinates} from "@/helpers/3d";


export default class WalletObjectSoloDebugScene implements ThorEventListener, IScene {
    public scene: Scene;

    private walletObjects: Array<WalletObject> = [];
    private rows: number;
    private columns: number;

    updateAnimations(dt: number) {
        for(let wo of this.walletObjects) {
            wo.update(dt)
        }
    }

    onResize(w: number, h: number) {
    }

    constructor(scene: Scene) {
        this.scene = scene
        this.rows = 5
        this.columns = 6

        let wConfig = Config.Scene

        const xStep = 300
        const yStep = 280

        let counter = 0
        for(let row = 0; row < this.rows; ++row) {
            for(let col = 0; col < this.columns; ++col) {
                const name = counter.toString()

                const wo = new WalletObject(name)
                wo.scale.setScalar(3.0)
                wo.position.x = (col - (this.columns - 1) / 2) * xStep
                wo.position.y = (row - (this.rows - 1) / 2) * yStep
                this.scene.add(wo)
                this.walletObjects.push(wo)

                counter++
            }
        }

        if (Config.Scene.Cubemap.Enabled) {
            StarBackground.makeStarEnvironment(this.scene)
        }
    }

    receiveEvent(e: ThorEvent): void {
    }

    public setEnvironment(environment: THREE.CubeTexture) {
    }
}
