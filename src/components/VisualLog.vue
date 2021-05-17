<template>
    <div class="vlog-area">
        <div v-for="item of messages" :key="item.ident">{{ item.message }}</div>
    </div>
</template>

<script>

import emitter from "@/helpers/emitter.ts"
import cryptoRandomString from "crypto-random-string";
import {Config} from "@/config";

export const VISUAL_LOG_EVENT = 'visualLog'

export function visualLog(message) {
    emitter.emit(VISUAL_LOG_EVENT, message)
}

export default {
    log(msg) {
        visualLog(msg)
    },

    name: 'VisualLog',

    data() {
        return {
            messages: []
        }
    },

    methods: {
        killMessage(ident) {
            this.messages = this.messages.filter(m => m.ident !== ident)
        },

        onNewLogItem(message) {
            if(!Config.Logging.Visual.Enabled) {
                this.messages = []
                return
            }

            const ts = +Date.now()

            const ident = cryptoRandomString({length: 10, type: 'ascii-printable'})

            setTimeout(() => {
                this.killMessage(ident)
            }, Config.Logging.Visual.FadeTime * 1000.0)

            this.messages.push({
                message,
                tsCreatedAt: ts,
                ident
            })

            const excessRows = this.messages.length - Config.Logging.Visual.MaxRows
            if(excessRows > 0) {
                this.messages.splice(0, excessRows)
            }

            console.debug(`Visual log received: ${message}`)
        }
    },

    mounted() {
        emitter.on(VISUAL_LOG_EVENT, this.onNewLogItem)
    }
}

</script>

<style>

.vlog-area {
    user-select: none;
    overflow: hidden;

    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: left;
    color: white;
    font-size: 10pt;
}

</style>
