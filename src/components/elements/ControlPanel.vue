<template>
    <div>
        <transition name="shrink" mode="out-in">
            <div v-if="isHelpOn" class="window-panel">
                <a href="#" class="close-it" @click="isHelpOn = false">×</a>
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
            <button class="outline-button help-button" v-if="!fullScreen" @click="isHelpOn = !isHelpOn">
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

import "@/assets/css/common.css"
import {isMobile} from "@/helpers/platform";
import emitter from "@/helpers/emitter.ts"
import PlaybackPanel from "@/components/elements/PlaybackPanel";
import {Config, DataSourcePlayback} from "@/config";

export default {
    name: 'ControlPanel',
    components: {PlaybackPanel},
    data() {
        return {
            fullScreen: false,
            isHelpOn: false,
            isPlayback: Config.DataSource === DataSourcePlayback
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

.help-button {
    padding-left: 10px;
    padding-right: 10px;
}

</style>
