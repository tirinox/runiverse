import emitter from "@/helpers/emitter";

export const VISUAL_LOG_EVENT = 'visualLog'

export function visualLog(message: string) {
    emitter.emit(VISUAL_LOG_EVENT, message)
}