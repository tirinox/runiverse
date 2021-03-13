<template>
    <Renderer msg="Runiverse!"/>
</template>

<script>

import Renderer from "@/components/Renderer";
import {Midgard, TESTNET_MULTICHAIN} from "@/provider/midgard.ts";

export default {
    name: 'App',
    components: {
        Renderer,
    },
    mounted() {
        const mg = new Midgard(TESTNET_MULTICHAIN)
        mg.getTxBatch().then(() => console.log)
    }
}
</script>

<style>

@import url('https://fonts.googleapis.com/css2?family=Exo+2&display=swap');

* {
    margin: 0;
    padding: 0;
}

#app {
    font-family: "Exo 2", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    background: darkslateblue;
    color: #2c3e50;
}

html, body {
    margin: 0;
    overflow: hidden;
    overscroll-behavior: none;
    width: 100%;
    height: 100%;
}
</style>
