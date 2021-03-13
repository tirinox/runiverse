<template>
    <Renderer msg="Welcome to Your Vue.js + TypeScript App"/>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import Renderer from "@/components/Renderer.vue";
import {CHAOSNET_BEP2CHAIN, Midgard, MidgardURLGenerator} from "@/provider/midgard";

export default defineComponent({
    name: 'App',
    components: {
        Renderer,
    },
    mounted() {
        const urlGen = new MidgardURLGenerator(CHAOSNET_BEP2CHAIN)
        const mg = new Midgard(urlGen)
        mg.getTxBatch().then(console.log)
    }
});
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
