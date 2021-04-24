<template>
    <RendererSimple :msg="debugMessage"/>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import RendererSimple from "@/components/RendererSimple.vue";
import {VISUAL_LOG_EVENT} from "@/helpers/log";
import emitter from "@/helpers/emitter";

export default defineComponent({
    name: 'App',
    data() {
        return {
            debugMessage: '',
            debugHideTo: 0
        }
    },
    components: {
        RendererSimple,
    },
    mounted() {
        this.debugHideTo = 0
        emitter.on(VISUAL_LOG_EVENT, (message) => {
            this.debugMessage = message
            console.debug(`Visual log received: ${message}`)

            if(this.debugHideTo) {
                clearTimeout(this.debugHideTo)
            }
            this.debugHideTo = setTimeout(() => {
                this.debugMessage = ''
            }, 2000)
        })
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
