import * as THREE from "three";

export interface IScene {
    setEnvironment(tex: THREE.CubeTexture): void;
    onResize(w: number, h: number): void;
    updateAnimations(dt: number): void;
}
