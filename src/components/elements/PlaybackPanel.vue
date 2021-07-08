<template>
    <div>
        <button class="outline-button slightly-faded">
            <font-awesome-icon icon="fast-backward"/>
        </button>
        <button class="outline-button slightly-faded">
            <font-awesome-icon icon="step-backward"/>
        </button>
        <button class="outline-button slightly-faded" @click="isPlaying = !isPlaying">
            <font-awesome-icon v-if="isPlaying" icon="pause"/>
            <font-awesome-icon v-else icon="play"/>
        </button>
        <button class="outline-button slightly-faded" disabled>
            <font-awesome-icon icon="step-forward"/>
        </button>
    </div>
</template>

<script>

import "@/assets/css/common.css"

export default {
    name: 'PlaybackPanel',
    data() {
        return {
            isPlaying: false
        }
    },

    computed: {},

    methods: {},

    mounted() {
    }
}

</script>

<style>

</style>

