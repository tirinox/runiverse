<template>
    <div class="canvas-holder">
        <canvas class="canvas-full" ref="canvas"></canvas>
        <div class="fps-counter" v-show="showFps">{{ Number(fps).toLocaleString() }} FPS</div>
    </div>
</template>

<script>

import * as THREE from "three"
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import SimpleScene from "@/render/simple/simpleScene";
import {RealtimeProvider} from "@/provider/realtime";
import {CHAOSNET_BEP2CHAIN, Midgard, MidgardURLGenerator} from "@/provider/midgard";

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
                this.myScene.onResize(width, height)
            }

            return needResize;
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
        },

        createCamera() {
            this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
            this.camera.position.z = 2000

            const controls = new OrbitControls(this.camera, this.renderer.domElement);
            controls.listenToKeyEvents(this.canvas);

            controls.minDistance = 100;
            controls.maxDistance = 5000;
            controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
            controls.dampingFactor = 0.5;
        }
    },

    mounted() {
        let canvas = this.canvas = this.$refs.canvas

        let renderer = this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true
        });
        renderer.autoClearColor = false;

        this.scene = new THREE.Scene();

        this.myScene = new SimpleScene(this.scene)
        this.myScene.initScene()
        this.createCamera()

        const urlGen = new MidgardURLGenerator(CHAOSNET_BEP2CHAIN)
        const midgard = new Midgard(urlGen)
        this.dataProvider = new RealtimeProvider(this.myScene, midgard)
        this.dataProvider.run()

        this.resizeRendererToDisplaySize();
        requestAnimationFrame(this.render);
    },

    beforeUnmount() {
        this.dataProvider.stop()
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
