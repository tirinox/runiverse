import * as THREE from "three";
import {Config} from "@/config";

export default class StarBackground {
    public static makeStarEnvironment(scene: THREE.Scene, srgb: boolean = false) {
        const loader = new THREE.CubeTextureLoader();
        loader.setPath(`textures/environment/${Config.Scene.Cubemap.Name}/`);

        const textureCube = loader.load(['right.png', 'left.png', 'top.png', 'bottom.png', 'front.png', 'back.png'], (tex: THREE.CubeTexture) => {
            console.log('environmental map loaded.')
        })

        if (srgb) {
            textureCube.encoding = THREE.sRGBEncoding;
        }

        scene.background = textureCube;
    }
}
