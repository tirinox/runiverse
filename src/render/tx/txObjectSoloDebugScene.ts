import * as THREE from "three";
import {Scene} from "three";
import {ThorEvent, ThorEventListener} from "@/provider/types";
import {Config} from "@/config";
import StarBackground from "@/render/background";
import {IScene} from "@/render/sceneInterface";
import {TxObject} from "@/render/tx/txObject";


export default class TxObjectSoloDebugScene implements ThorEventListener, IScene {
    public scene: Scene;

    private txObj?: TxObject;

    updateAnimations(dt: number) {
        if(this.txObj) {
            this.txObj.update(dt)
        }
    }

    onResize(w: number, h: number) {
    }

    constructor(scene: Scene) {
        this.scene = scene

        let txConfig = Config.Scene.TxObject
        // poConfig.InnerOrbitSpeed *= 0.0001;
        // poConfig.BallShader.BaseSpeed *= 0.1;
        // poConfig.BallShader.BlendSpeed *= 0.1;
        // poConfig.BallShader.BumpSpeed *= 0.1;
        // poConfig.Mesh.RotationVar = 0.0;
        // poConfig.BallShader.BumpScale = 50;

        this.txObj = new TxObject(100, 10000, true)

        this.txObj.scale.setScalar(10.0)
        this.scene.add(this.txObj)

        if (Config.Scene.Cubemap.Enabled) {
            StarBackground.makeStarEnvironment(this.scene)
        }
    }

    receiveEvent(e: ThorEvent): void {}
    public setEnvironment(environment: THREE.CubeTexture) {}
}
