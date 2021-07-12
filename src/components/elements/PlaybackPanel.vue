<template>
    <div>
        <button class="outline-button slightly-faded" :disabled="atBeginning" @click="goToBeginning">
            <font-awesome-icon icon="fast-backward"/>
        </button>
        <button class="outline-button slightly-faded" :disabled="atBeginning" @click="stepBackward">
            <font-awesome-icon icon="step-backward"/>
        </button>
        <button class="outline-button slightly-faded" :disabled="finished" @click="stopPlayClick">
            <font-awesome-icon v-if="isPlaying" icon="pause"/>
            <font-awesome-icon v-else icon="play"/>
        </button>
        <button class="outline-button slightly-faded" :disabled="finished" @click="stepForward">
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
            isPlaying: false,
            finished: false,
            atBeginning: true
        }
    },

    computed: {},

    methods: {
        async stopPlayClick() {
            this.isPlaying = !this.isPlaying
            if(this.isPlaying) {
                this.atBeginning = false
                await this.dataProvider.play()
            } else {
                this.dataProvider.pause()
            }
        },
        stepForward() {

        },
        stepBackward() {

        },
        goToBeginning() {
            this.atBeginning = true
            this.isPlaying = false
            this.finished = false
        }
    },

    mounted() {
    }
}

</script>

<style>

</style>

