import {EventType, ThorEvent, ThorScene} from "@/render/types";
import {Midgard, PoolDetail} from "@/provider/midgard";
import {PoolChangeAnalyzer} from "@/provider/pool_change_analize";


class RealtimeProvider {
    public readonly interval = 15 * 1000

    public delegate?: ThorScene
    public midgard: Midgard

    private oldPools?: Record<string, PoolDetail>
    private poolAnalyzer: PoolChangeAnalyzer;

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

        if (this.delegate) {
            this.delegate.receiveEvent(new ThorEvent(EventType.Nope));
        }
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