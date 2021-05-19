<template>
    <div class="canvas-holder">
        <canvas class="canvas-full" ref="canvas" tabindex="1" @keydown="onKeyDown"></canvas>
        <div class="fps-counter" v-show="showFps">
            <span>{{ Number(fps).toFixed(2) }} FPS</span>
            <VisualLog></VisualLog>
        </div>
    </div>
</template>

<script>

import * as THREE from "three"
import SimpleScene from "@/render/simple/simpleScene";
import {RealtimeProvider} from "@/provider/realtime";
import {Midgard} from "@/provider/midgard/midgard";
import {Config} from "@/config";
import VisualLog from "@/components/VisualLog";
import {WEBGL} from "three/examples/jsm/WebGL";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";


export default {
    name: 'RendererSimple',
    components: {VisualLog},
    props: {},

    data() {
        return {
            fps: 1.0,
            showFps: Config.Logging.FPSCounter,
        }
    },

    methods: {
        onKeyDown(event) {
            console.log(event)
            if(event.code === 'KeyR') {
                this.resetCamera()
                VisualLog.log('Camera reset.')
            }
        },

        resetCamera() {
            this.controls.reset()
        },

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
                this.composer.setSize(width, height)
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
                this.fps = 1000.0 / delta

                const dt = Math.min(Config.Animations.MaxDeltaTimeOfFrame, delta * 0.001)
                this.myScene.updateAnimations(dt)
            }

            this.resizeRendererToDisplaySize(this.renderer);
            this.composer.render();

            requestAnimationFrame(this.render);
        },

        createCamera() {
            const cfg = Config.Camera
            this.camera = new THREE.PerspectiveCamera(cfg.FOV, window.innerWidth / window.innerHeight, 1, 10000);

            const controls = new OrbitControls(this.camera, this.renderer.domElement);

            // const controls = new TrackballControls(this.camera, this.renderer.domElement)
            controls.listenToKeyEvents(this.canvas);

            controls.minDistance = cfg.MinDistance;
            this.camera.position.z = cfg.StartDistance
            controls.maxDistance = cfg.MaxDistance
            controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
            controls.dampingFactor = cfg.Damp
            controls.saveState()
            this.controls = controls
        },

        makeBloom() {
            if(this.bloomPass) {
                return
            }

            this.bloomPass = new UnrealBloomPass({x: 1024, y: 1024});
            this.bloomPass.threshold = 0.4
            this.bloomPass.strength = 1.0
            this.bloomPass.radius = 0
            this.composer.addPass(this.bloomPass);
        },

        runDataSource() {
            const midgard = new Midgard(Config.RealtimeScanner.Network)
            this.dataProvider = new RealtimeProvider(
                this.myScene, midgard,
                Config.RealtimeScanner.TickIntervalSec,
                Config.RealtimeScanner.IgnoreOldTransactions,
                Config.RealtimeScanner.SuppressErrors
            )
            this.dataProvider.run()
        }
    },

    mounted() {
        if (!WEBGL.isWebGLAvailable()) {
            const warning = WEBGL.getWebGLErrorMessage();
            this.showFps = false
            document.getElementById('app').appendChild(warning);
            return
        }

        let canvas = this.canvas = this.$refs.canvas

        // canvas.addEventListener('keydown', (e) => {
        //     console.log(e)
        // })

        let renderer = this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: false
        });

        if (devicePixelRatio) {
            console.log(`Renderer: Setting devicePixelRatio = ${devicePixelRatio}.`)
            renderer.setPixelRatio(devicePixelRatio)
        }
        renderer.autoClearColor = false;

        this.scene = new THREE.Scene();
        this.myScene = new SimpleScene(this.scene)
        this.createCamera()

        const renderScene = new RenderPass(this.scene, this.camera);

        const composer = new EffectComposer(this.renderer);
        composer.addPass(renderScene);
        this.composer = composer

        if (Config.SimpleScene.Postprocessing.Bloom.Enabled) {
            this.makeBloom()
        }

        this.resizeRendererToDisplaySize();

        this.runDataSource()

        requestAnimationFrame(this.render);

    },

    beforeUnmount() {
        if(this.dataProvider) {
            this.dataProvider.stop()
        }
    }
}

</script>

<style>

.canvas-full {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    outline: none;
}

.fps-counter {
    text-align: left;
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
