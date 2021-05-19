<template>
    <button class="outline-button" :class="{'button-faded': fullScreen}" @click="goFullScreen">
        <span v-if="!fullScreen">Go fullscreen</span>
        <span v-else>Exit fullscreen</span>
    </button>
</template>

<script>

export default {
    name: 'ButtonFullScreen',

    data() {
        return {
            fullScreen: false
        }
    },

    methods: {
        goFullScreen() {
            if (!this.fullScreen) {
                this.fullScreen = true;
                document.documentElement.requestFullscreen();
            } else {
                this.fullScreen = false;
                document.exitFullscreen();
            }
        },
    },

    mounted() {
    }
}

</script>

<style>

.outline-button {
    margin: 12px;
    background: transparent;
    border: 1px solid #aff;
    color: #aff;
    padding: 4px;
    font-size: 10pt;
    border-radius: 2px;
    opacity: 0.4;

    transition: all .15s ease-in-out;

}

.outline-button:hover {
    transform: scale(1.05);
    opacity: 1;
}

.button-faded {
    opacity: 0.23;
}

.button-faded:hover {
    opacity: 1.0;
}

</style>
