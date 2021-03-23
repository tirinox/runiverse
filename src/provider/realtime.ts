import {EventType, ThorEvent, ThorScene} from "@/render/types";

class RealtimeProvider {
    public readonly interval = 5 * 1000

    public delegate?: ThorScene

    constructor(delegate: ThorScene) {
        this.delegate = delegate
    }

    private tick(): void {
        console.log('tick!')

        if(this.delegate) {
            this.delegate.receiveEvent(new ThorEvent(EventType.Nope));
        }
    }

    public run(): void {
        console.info('RealtimeProvider starts...')

        if(this.delegate) {
            this.delegate.receiveEvent(new ThorEvent(EventType.ResetAll));
        }

        this.tick()
        setInterval(this.tick, this.interval)
    }
}

export {
    RealtimeProvider
}