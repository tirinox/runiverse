<template>
    <div class="vlog-area">
        <div v-for="item of messages" :key="item.ident">{{ item.message }}</div>
    </div>
</template>

<script>

import emitter from "@/helpers/emitter.ts"
import cryptoRandomString from "crypto-random-string";

export const VISUAL_LOG_EVENT = 'visualLog'

export function visualLog(message) {
    emitter.emit(VISUAL_LOG_EVENT, message)
}

const LOG_STAY_TIME = 2000

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
            this.messages.splice(ident, 1)
        },

        onNewLogItem(message) {
            const ts = +Date.now()

            const ident = cryptoRandomString({length: 10, type: 'ascii-printable'})

            setTimeout(() => {
                this.killMessage(ident)
            }, LOG_STAY_TIME)

            this.messages.push({
                message,
                tsCreatedAt: ts,
                ident
            })

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
