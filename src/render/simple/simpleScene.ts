import * as THREE from "three";
import {Scene} from "three";
import {EventType, ThorEvent, ThorScene} from "@/render/types";

export default class SimpleScene implements ThorScene {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene
    }

    initScene() {
        let scene = this.scene
        const geometry = new THREE.CylinderGeometry(0, 10, 30, 7, 1);
        const material = new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: true});

        for (let i = 0; i < 111; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = Math.random() * 1600 - 800;
            mesh.position.y = 0;
            mesh.position.z = Math.random() * 1600 - 800;
            mesh.updateMatrix();
            mesh.matrixAutoUpdate = false;
            scene.add(mesh);
        }

        // lights
        const dirLight1 = new THREE.DirectionalLight(0xffffff);
        dirLight1.position.set(1, 1, 1);
        scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0x002288);
        dirLight2.position.set(-1, -1, -1);
        scene.add(dirLight2);

        const ambientLight = new THREE.AmbientLight(0x222222);
        scene.add(ambientLight);
    }

    receiveEvent(e: ThorEvent): void {
        if(e.eventType == EventType.ResetAll) {
            console.log('booms! reset all')
        }
    }
}