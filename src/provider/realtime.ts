import {EventType, ThorEvent, ThorEventListener} from "@/provider/types";
import {Midgard} from "@/provider/midgard";
import {PoolChangeAnalyzer} from "@/provider/pool_change_analize";


class RealtimeProvider {
    public readonly interval = 5 * 1000

    public delegate: ThorEventListener
    public midgard: Midgard

    private poolAnalyzer: PoolChangeAnalyzer

    counter: number = 0

    constructor(delegate: ThorEventListener, midgard: Midgard) {
        this.delegate = delegate
        this.midgard = midgard
        this.poolAnalyzer = new PoolChangeAnalyzer()
    }

    private async requestPools() {
        const pools = await this.midgard.getPoolState()
        const changes = this.poolAnalyzer.processPools(pools)
        for(const c of changes) {
            this.delegate.receiveEvent(new ThorEvent(EventType.UpdatePool, c))
        }
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

        this.delegate.receiveEvent(new ThorEvent(EventType.ResetAll))

        this.tick()
        setInterval(this.tick.bind(this), this.interval)
    }
}

export {
    RealtimeProvider
}