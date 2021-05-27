<template>
    <div>
        <transition mode="out-in">
            <div class="help-panel" v-if="helpOn">
                <a href="#" class="close-it" @click="helpOn = false">×</a>
                <h2>Runiverse</h2>
                <strong>Controls</strong>
                <p>
                    Use mouse to rotate the scene. Hold <kbd>Shift</kbd> with mouse left button to pan.<br>
                </p>
                <strong>Keyboard shortcuts</strong>
                <p>
                    <kbd>R</kbd> – Reset camera<br>
                    <kbd>D</kbd> – Toggle FPS and debug info<br>
                    <kbd>H</kbd> – Toggle help (this window)
                </p>
                <strong>Info</strong>
                <p>
                    Created by community 2021!<br>
                    <a href="https://github.com/tirinox/runiverse" target="_blank">Source code</a><br>
                    Feedback <a href="http://t.me/account1242" target="_blank">@account1242</a>
                </p>
            </div>
        </transition>

        <div class="control-panel">
            <button class="outline-button help-button" v-if="!fullScreen" @click="helpOn = !helpOn">
                ?
            </button>
            <button class="outline-button" :class="{'button-faded': fullScreen}" @click="goFullScreen" v-if="canGoFullScreen">
                <span v-if="!fullScreen">Go fullscreen</span>
                <span v-else>×</span>
            </button>

            <PlaybackPanel v-if="isPlayback"></PlaybackPanel>
        </div>
    </div>

</template>

<script>

import {isMobile} from "@/helpers/platform";
import emitter from "@/helpers/emitter.ts"
import PlaybackPanel from "@/components/elements/PlaybackPanel";

export default {
    name: 'ControlPanel',
    components: {PlaybackPanel},
    data() {
        return {
            fullScreen: false,
            helpOn: false,
            isPlayback: false,
        }
    },

    computed: {
        canGoFullScreen() {
            return !isMobile()
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
        document.addEventListener('fullscreenchange', () => {
            if(!document.fullscreenElement) {
                this.fullScreen = false
            }
        })
        emitter.on('ToggleHelp', () => {
            this.helpOn = !this.helpOn
        })
    }
}

</script>

<style>

.control-panel {
    position: absolute;
    bottom: 4px;
    right: 4px;
}

.outline-button {
    margin: 4px;
    background: transparent;
    border: 1px solid #afd;
    color: #afd;
    padding: 4px;
    font-size: 10pt;
    border-radius: 5px;
    opacity: 0.4;
    cursor: pointer;
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

.help-button {
    padding-left: 10px;
    padding-right: 10px;
}

.help-panel {
    margin-right: 8px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.62);
    border: 1px solid #afd;
    border-radius: 12px;
    position: absolute;
    right: 0;
    bottom: 42px;
    font-size: 12pt;
    color: white;
    text-align: left;
}


.v-enter,
.v-leave-to {
    opacity: 0;
    transform: rotateY(90deg);
}

.v-enter-active,
.v-leave-active {
    transition: 0.2s ease;
}


.close-it {
    position: absolute;

    right: 0;
    top: 0;
    padding: 2px 6px 2px 6px;
    margin: 6px;
    color: #afd;
    text-decoration: none;
    font-size: 16pt;
    /*border: 1px solid white;*/
}

</style>
