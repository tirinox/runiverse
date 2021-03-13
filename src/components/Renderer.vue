<template>
    <div class="canvas-holder">
        <canvas class="canvas-full" ref="canvas" @mousemove="onMouseMove"></canvas>
        <div class="fps-counter" v-show="showFps">{{ Number(fps).toLocaleString() }} FPS</div>
    </div>
</template>

<script>

import * as THREE from "three"

export default {
    name: 'Renderer',
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

            time *= 0.001;  // convert to seconds

            const renderer = this.renderer
            const uniforms = this.uniforms;
            this.resizeRendererToDisplaySize(renderer);

            const canvas = renderer.domElement;
            uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
            uniforms.iTime.value = time;

            if(this.mouseX && this.mouseY) {
                uniforms.iMouse.value.set(this.mouseX, this.mouseY)
            }

            renderer.render(this.scene, this.camera);

            requestAnimationFrame(this.render);
        }
    },

    mounted() {
        let canvas = this.canvas = this.$refs.canvas

        let renderer = this.renderer = new THREE.WebGLRenderer({canvas});
        renderer.autoClearColor = false;

        this.camera = new THREE.OrthographicCamera(
            -1, // left
            1, // right
            1, // top
            -1, // bottom
            -1, // near,
            1, // far
        );
        let scene = this.scene = new THREE.Scene();
        let plane = this.plane = new THREE.PlaneBufferGeometry(2, 2);

        let loader = this.loader = new THREE.FileLoader();
        let fragmentShader = ``

        loader.load('shaders/cart_gal.frag', (data) => {
            fragmentShader = data

            const material = new THREE.ShaderMaterial({
                fragmentShader,
                uniforms,
            });
            scene.add(new THREE.Mesh(plane, material));
        })

        const uniforms = this.uniforms = {
            iTime: {value: 0},
            iResolution: {value: new THREE.Vector3()},
            iMouse: {value: new THREE.Vector2()},
        };

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
