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
import {Config, DataSourcePlayback, DataSourceRealtime} from "@/config";
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
import trivialVertShader from "@/render/simple/shaders/trivial.vert"
import bloomOverlayFragShader from "@/render/simple/shaders/bloom_overlay.frag"
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass";
import {LAYER_BLOOM_SCENE} from "@/render/simple/layers";
import PoolObjectSoloDebug from "@/render/simple/pool/poolObjectSoloDebugScene";
import TWEEN from "tween";


function getScene(scene, name) {
    if(name === 'PoolObjectSoloDebug') {
        return new PoolObjectSoloDebug(scene)
    } else {
        return new SimpleScene(scene)
    }
}

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

                this.bloomComposer.setSize(width, height);
                this.finalComposer.setSize(width, height);

                this.myScene.onResize(width, height)
            }

            return needResize;
        },

        render(time) {
            TWEEN.update()

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

            // render bloom
            const savedBg = this.scene.background
            this.scene.background = null
            this.scene.traverse(this.darkenNonBloomed);
            this.bloomComposer.render();
            this.scene.traverse(this.restoreMaterial);
            this.scene.background = savedBg

            if (!Config.Scene.Core.Simplified) {
                if(this.myScene.core) {
                    this.myScene.core.visible = false;
                }
                this.cubeCamera.position.copy(this.camera.position)
                this.cubeCamera.update(this.renderer, this.scene);
                this.myScene.setEnvironment(this.cubeRenderTarget.texture)
                if(this.myScene.core) {
                    this.myScene.core.visible = true;
                }
            }

            this.finalComposer.render();

            this.objCount = countObjects(this.myScene.scene)

            requestAnimationFrame(this.render);
        },

        createCamera(domElement) {
            const cfg = Config.Camera
            this.camera = new THREE.PerspectiveCamera(cfg.FOV, window.innerWidth / window.innerHeight,
                cfg.Near, cfg.Far);

            const controls = new OrbitControls(this.camera, domElement);

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

        createEnvironmentCamera() {
            const cfg = Config.Camera

            this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(Config.Scene.Cubemap.RenderResolution, {
                format: THREE.RGBFormat,
                generateMipmaps: false,
                minFilter: THREE.LinearMipmapLinearFilter
            });
            this.cubeCamera = new THREE.CubeCamera(cfg.Near, cfg.Far, this.cubeRenderTarget);
            this.scene.add(this.cubeCamera);
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
            } else if(Config.DataSource === DataSourcePlayback) {
                this.createPlaybackDataSource()
            } else {
                console.warn('No data source set up.')
                return
            }
            this.dataProvider.play()
        },

        makeRenderer(canvas) {
            // Make renderer
            let renderer = this.renderer = new THREE.WebGLRenderer({
                canvas,
                antialias: false
            });

            if (devicePixelRatio) {
                console.log(`Renderer: Setting devicePixelRatio = ${devicePixelRatio}.`)
                renderer.setPixelRatio(devicePixelRatio)
            }
            renderer.autoClearColor = true;

            // Make passes
            const renderScene = new RenderPass(this.scene, this.camera);

            // BLOOM PASS
            const bloomPass = new UnrealBloomPass({x: 32, y: 32});
            const bloomCfg = Config.Scene.Postprocessing.Bloom
            bloomPass.threshold = bloomCfg.Threshold
            bloomPass.strength = bloomCfg.Strength
            bloomPass.radius = bloomCfg.Radius

            const bloomComposer = new EffectComposer(renderer);
            bloomComposer.renderToScreen = false;
            bloomComposer.addPass(renderScene);
            bloomComposer.addPass(bloomPass);
            this.bloomComposer = bloomComposer

            this.darkMaterial = new THREE.MeshBasicMaterial({color: "black"});

            this.bloomLayer = new THREE.Layers();
            this.bloomLayer.set(LAYER_BLOOM_SCENE);
            this.materials = {};

            // FINAL PASS

            const finalPass = new ShaderPass(
                new THREE.ShaderMaterial({
                    uniforms: {
                        baseTexture: {value: null},
                        bloomTexture: {value: bloomComposer.renderTarget2.texture}
                    },
                    vertexShader: trivialVertShader,
                    fragmentShader: bloomOverlayFragShader,
                    defines: {}
                }), "baseTexture"
            );
            finalPass.needsSwap = true;

            const finalComposer = new EffectComposer(renderer);
            finalComposer.addPass(renderScene);
            if(bloomCfg.Enabled) {
                finalComposer.addPass(finalPass);
            }
            this.finalComposer = finalComposer
        },

        darkenNonBloomed(obj) {
            if (obj.isMesh && this.bloomLayer.test(obj.layers) === false) {
                this.materials[obj.uuid] = obj.material;
                obj.material = this.darkMaterial;
            }
        },

        restoreMaterial(obj) {
            if (this.materials[obj.uuid]) {
                obj.material = this.materials[obj.uuid];
                delete this.materials[obj.uuid];
            }
        }
    },

    mounted() {
        if (!WEBGL.isWebGLAvailable()) {
            const warning = WEBGL.getWebGLErrorMessage();
            this.showFps = false
            document.getElementById('app').appendChild(warning);
            return
        }

        this.canvas = this.$refs.canvas

        this.scene = new THREE.Scene();
        this.myScene = getScene(this.scene, Config.Debug.SceneName)

        this.createCamera(this.canvas)
        this.createEnvironmentCamera()

        this.makeRenderer(this.canvas)

        this.resizeRendererToDisplaySize();

        this.runDataSource()

        requestAnimationFrame(this.render);
    },

    beforeUnmount() {
        if (this.dataProvider) {
            this.dataProvider.pause()
            this.dataProvider.resetState()
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
