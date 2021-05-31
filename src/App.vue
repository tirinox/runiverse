<template>
    <RendererSimple/>
</template>


<script lang="ts">

import {defineComponent} from 'vue';
import RendererSimple from "@/components/RendererSimple.vue";

export default defineComponent({
    name: 'App',

    methods: {},

    components: {
        RendererSimple,
    },

    mounted() {
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
    overflow: hidden;
    background: black;
}

a {
    color: white;
}

a:visited {
    color: white;
}

</style>
