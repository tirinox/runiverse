import * as THREE from "three";
import {Scene} from "three";
import {ThorEvent, ThorEventListener} from "@/provider/types";
import {Config} from "@/config";
import {PoolObject} from "@/render/simple/pool/poolObject";
import StarBackground from "@/render/simple/background";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import BigNumber from "bignumber.js";


export default class PoolObjectSoloDebug implements ThorEventListener {
    private readonly scene: Scene;

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

        const pool = new PoolDetail(
            'BTC.BTC',
            new BigNumber(1000000000),
            new BigNumber(400000000000),
            true,
            new BigNumber(123456700)
        )
        this.poolObj = new PoolObject(pool)
        this.poolObj.scale.setScalar(10.0)
        // this.poolObj.prepare().then(() => {})
        this.poolObj.updateScale()
        this.scene.add(this.poolObj)

        if (Config.Scene.Cubemap.Enabled) {
            StarBackground.makeStarEnvironment(this.scene)
        }
    }

    receiveEvent(e: ThorEvent): void {}
    public setEnvironment(environment: THREE.CubeTexture) {}
}
