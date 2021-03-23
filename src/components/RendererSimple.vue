<template>
    <div class="canvas-holder">
        <canvas class="canvas-full" ref="canvas" @mousemove="onMouseMove"></canvas>
        <div class="fps-counter" v-show="showFps">{{ Number(fps).toLocaleString() }} FPS</div>
    </div>
</template>

<script>

import * as THREE from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default {
    name: 'RendererSimple',
    props: {
        msg: String
    },

    data() {
        return {
            fps: 1.0,
            showFps: true,
        }
    },

    methods: {
        resizeRendererToDisplaySize() {
            const renderer = this.renderer
            const canvas = renderer.domElement;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            const needResize = canvas.width !== width || canvas.height !== height;
            if (needResize) {
                renderer.setSize(width, height, false);
            }
            return needResize;
        },

        onMouseMove(e) {
            const mouseScale = 0.1
            const rect = this.canvas.getBoundingClientRect()
            this.mouseX = mouseScale * (e.clientX - rect.left)
            this.mouseY = mouseScale * (rect.height - (e.clientY - rect.top) - 1)
        },

        render(time) {
            if (!this.lastCalledTime) {
                this.lastCalledTime = time;
                this.fps = 0;
            } else {
                const delta = (time - this.lastCalledTime);
                this.lastCalledTime = time;
                this.fps = 1000 / delta;
            }

            this.resizeRendererToDisplaySize(this.renderer);
            this.renderer.render(this.scene, this.camera);

            requestAnimationFrame(this.render);
        }
    },

    mounted() {
        let canvas = this.canvas = this.$refs.canvas

        let renderer = this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true
        });
        renderer.autoClearColor = false;

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
        let scene = this.scene = new THREE.Scene();

        const geometry = new THREE.CylinderGeometry(0, 10, 30, 4, 1);
        const material = new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: true});

        for (let i = 0; i < 500; i++) {
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

        const controls = new OrbitControls(this.camera, renderer.domElement );
        controls.maxPolarAngle = Math.PI * 0.5;
        controls.minDistance = 100;
        controls.maxDistance = 5000;

        this.resizeRendererToDisplaySize();
        requestAnimationFrame(this.render);
    }
}
</script>

<style>

.canvas-full {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0
}

.fps-counter {
    font-size: 14pt;
    color: whitesmoke;
    position: absolute;
    margin: 10px;
    left: 0;
    top: 0;
}

.canvas-holder {
    width: 100%;
    height: 100%;
}

</style>
