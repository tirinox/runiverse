<template>
    <RendererSimple />
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import {CHAOSNET_BEP2CHAIN, Midgard, MidgardURLGenerator, TESTNET_MULTICHAIN} from "@/provider/midgard";
import RendererSimple from "@/components/RendererSimple.vue";

export default defineComponent({
    name: 'App',
    components: {
        RendererSimple,
    },
    mounted() {
        const urlGen = new MidgardURLGenerator(CHAOSNET_BEP2CHAIN)
        const mg = new Midgard(urlGen)
        mg.getPoolState().then(console.log)

        const urlGen2 = new MidgardURLGenerator(TESTNET_MULTICHAIN)
        const mg2 = new Midgard(urlGen2)
        mg2.getPoolState().then(console.log)
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
