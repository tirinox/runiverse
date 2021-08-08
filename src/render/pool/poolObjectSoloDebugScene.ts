import * as THREE from "three";
import {Scene} from "three";
import {ThorEvent, ThorEventListener} from "@/provider/types";
import {Config} from "@/config";
import {PoolObject} from "@/render/pool/poolObject";
import StarBackground from "@/render/background";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import BigNumber from "bignumber.js";
import {IScene} from "@/render/sceneInterface";


export default class PoolObjectSoloDebugScene implements ThorEventListener, IScene {
    public scene: Scene;

    private poolObj?: PoolObject;

    updateAnimations(dt: number) {
        if(this.poolObj) {
            this.poolObj.update(dt)
        }
    }

    onResize(w: number, h: number) {
    }

    constructor(scene: Scene) {
        this.scene = scene

        let poConfig = Config.Scene.PoolObject
        // poConfig.InnerOrbitSpeed *= 0.0001;
        // poConfig.BallShader.BaseSpeed *= 0.1;
        // poConfig.BallShader.BlendSpeed *= 0.1;
        // poConfig.BallShader.BumpSpeed *= 0.1;
        // poConfig.Mesh.RotationVar = 0.0;
        // poConfig.BallShader.BumpScale = 50;
        poConfig.Glow.Enabled = true;

        const pool = new PoolDetail(
            'BTC.BTC',
            new BigNumber(1000000000),
            new BigNumber(400000000000),
            true,
            new BigNumber(123456700)
        )

        this.poolObj = new PoolObject(pool)
        this.poolObj.scale.setScalar(10.0)
        // this.poolObj.runeSideMesh!.rotationSpeed = ZeroVector3.clone()
        // this.poolObj.assetSideMesh!.rotationSpeed = ZeroVector3.clone()

        this.poolObj.updateScale()
        this.poolObj.position.set(100, 200, 300)
        this.poolObj.rotation.set(5, 3, 2)
        this.scene.add(this.poolObj)

        if (Config.Scene.Cubemap.Enabled) {
            StarBackground.makeStarEnvironment(this.scene)
        }
    }

    receiveEvent(e: ThorEvent): void {}
    public setEnvironment(environment: THREE.CubeTexture) {}
}