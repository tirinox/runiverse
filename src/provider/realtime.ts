import {EventType, ThorEvent, ThorScene} from "@/render/types";
import {Midgard, PoolDetail} from "@/provider/midgard";
import {PoolChangeAnalyzer} from "@/provider/pool_change_analize";


class RealtimeProvider {
    public readonly interval = 5 * 1000

    public delegate?: ThorScene
    public midgard: Midgard

    private poolAnalyzer: PoolChangeAnalyzer

    counter: number = 0

    constructor(delegate: ThorScene, midgard: Midgard) {
        this.delegate = delegate
        this.midgard = midgard
        this.poolAnalyzer = new PoolChangeAnalyzer()
    }

    private async requestPools() {
        const pools = await this.midgard.getPoolState()
        this.poolAnalyzer.processPools(pools)
    }

    private async tick() {
        await this.requestPools()
        this.counter++
        console.log('tick #', this.counter)

        // if (this.delegate) {
        //     this.delegate.receiveEvent(new ThorEvent(EventType.Nope));
        // }
    }

    public async run() {
        console.info('RealtimeProvider starts...')

        if (this.delegate) {
            this.delegate.receiveEvent(new ThorEvent(EventType.ResetAll));
        }

        this.tick()
        setInterval(this.tick.bind(this), this.interval)
    }
}

export {
    RealtimeProvider
}