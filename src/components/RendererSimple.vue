<template>
    <div class="canvas-holder">
        <canvas class="canvas-full" ref="canvas" tabindex="1" @keydown="onKeyDown"></canvas>
        <div class="fps-counter" v-show="showFps">
            <span>{{ Number(fps).toFixed(2) }} FPS, {{ objCount }} objects</span>
            <VisualLog></VisualLog>
        </div>

        <ControlPanel></ControlPanel>
    </div>
</template>

<script>

import * as THREE from "three"
import SimpleScene from "@/render/simple/simpleScene";
import {RealtimeProvider} from "@/provider/realtime";
import {Midgard} from "@/provider/midgard/midgard";
import {Config, DataSourceRealtime} from "@/config";
import VisualLog from "@/components/elements/VisualLog";
import {WEBGL} from "three/examples/jsm/WebGL";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import ControlPanel from "@/components/elements/ControlPanel";
import emitter from "@/helpers/emitter.ts"
import {PlaybackDataProvider} from "@/provider/playback";
import {countObjects} from "@/helpers/3d";

export default {
    name: 'RendererSimple',
    components: {ControlPanel, VisualLog},
    props: {},

    data() {
        return {
            fps: 1.0,
            showFps: Config.Logging.FPSCounter,
            objCount: 0,
        }
    },

    methods: {
        onKeyDown(event) {
            if (event.code === 'KeyR') {
                this.resetCamera()
                VisualLog.log('Camera reset.')
            } else if (event.code === 'KeyD') {
                this.showFps = !this.showFps
                if (this.showFps) {
                    VisualLog.log('debug on!')
                }
            } else if (event.code === 'KeyH') {
                emitter.emit('ToggleHelp')
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

            this.myScene.core.visible = false;
            this.cubeCamera.position.copy(this.camera.position)
            this.cubeCamera.update(this.renderer, this.scene);
            this.myScene.setEnvironment(this.cubeRenderTarget.texture)
            this.myScene.core.visible = true;
            this.composer.render();

            this.objCount = countObjects(this.myScene)

            requestAnimationFrame(this.render);
        },

        createCamera() {
            const near = 1
            const far = 10000
            const cfg = Config.Camera
            this.camera = new THREE.PerspectiveCamera(cfg.FOV, window.innerWidth / window.innerHeight, near, far);

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

            this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(Config.Scene.Cubemap.RenderResolution, {
                format: THREE.RGBFormat,
                generateMipmaps: false,
                minFilter: THREE.LinearMipmapLinearFilter
            });
            this.cubeCamera = new THREE.CubeCamera(near, far, this.cubeRenderTarget);
            this.scene.add(this.cubeCamera);
        },

        makeBloom() {
            if (this.bloomPass) {
                return
            }

            this.bloomPass = new UnrealBloomPass({x: 1024, y: 1024});
            this.bloomPass.threshold = 0.4
            this.bloomPass.strength = 1.0
            this.bloomPass.radius = 0
            this.composer.addPass(this.bloomPass);
        },

        createRealtimeDataSource() {
            const midgard = new Midgard(Config.RealtimeScanner.Network)
            this.dataProvider = new RealtimeProvider(
                this.myScene, midgard,
                Config.RealtimeScanner.TickIntervalSec,
                Config.RealtimeScanner.IgnoreOldTransactions,
                Config.RealtimeScanner.SuppressErrors
            )
        },

        createPlaybackDataSource() {
            const path = Config.Playback.File
            const timeScale = Config.Playback.SpeedMult
            const waitFirst = Config.Playback.WaitFirstEvent
            this.dataProvider = new PlaybackDataProvider(this.myScene, path, timeScale, waitFirst)
        },

        runDataSource() {
            if (Config.DataSource === DataSourceRealtime) {
                this.createRealtimeDataSource()
            } else {
                this.createPlaybackDataSource()
            }
            this.dataProvider.play()
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

        if (Config.Scene.Postprocessing.Bloom.Enabled) {
            this.makeBloom()
        }

        this.resizeRendererToDisplaySize();

        this.runDataSource()

        requestAnimationFrame(this.render);
    },

    beforeUnmount() {
        if (this.dataProvider) {
            this.dataProvider.pause()
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
