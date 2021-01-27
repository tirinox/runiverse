<template>
    <canvas class="canvas-full" ref="canvas"></canvas>
</template>

<script>

import * as THREE from "three"

export default {
    name: 'Renderer',
    props: {
        msg: String
    },

    mounted() {
        const canvas = this.$refs.canvas

        const renderer = new THREE.WebGLRenderer({canvas});
        renderer.autoClearColor = false;

        const camera = new THREE.OrthographicCamera(
            -1, // left
            1, // right
            1, // top
            -1, // bottom
            -1, // near,
            1, // far
        );
        const scene = new THREE.Scene();
        const plane = new THREE.PlaneBufferGeometry(2, 2);

        const loader = new THREE.FileLoader();
        let fragmentShader = ``

        loader.load('shaders/clouds.frag', (data) => {
            fragmentShader = data

            const material = new THREE.ShaderMaterial({
                fragmentShader,
                uniforms,
            });
            scene.add(new THREE.Mesh(plane, material));
        })

        const uniforms = {
            iTime: {value: 0},
            iResolution: {value: new THREE.Vector3()},
        };

        function resizeRendererToDisplaySize(renderer) {
            const canvas = renderer.domElement;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            const needResize = canvas.width !== width || canvas.height !== height;
            if (needResize) {
                renderer.setSize(width, height, false);
            }
            return needResize;
        }

        function render(time) {
            time *= 0.001;  // convert to seconds

            resizeRendererToDisplaySize(renderer);

            const canvas = renderer.domElement;
            uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
            uniforms.iTime.value = time;

            renderer.render(scene, camera);

            requestAnimationFrame(render);
        }

        requestAnimationFrame(render);
    }
}
</script>

<style>
.canvas-full {
    width: 100%;
    height: 100%;
    display: block;
}
</style>
