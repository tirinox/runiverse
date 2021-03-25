import {EventType, ThorEvent, ThorEventListener} from "@/provider/types";
import {MAX_ACTIONS_PER_CALL, Midgard} from "@/provider/midgard/midgard";
import {PoolChangeAnalyzer} from "@/provider/process/poolChangeAnalize";


const MAX_ACTIONS_PAGES = 2

class RealtimeProvider {
    public readonly interval = 5 * 1000

    public delegate: ThorEventListener
    public midgard: Midgard

    private poolAnalyzer: PoolChangeAnalyzer

    counter: number = 0
    private timer?: number;

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

    private async requestActions() {
        for(let page = 0; page < MAX_ACTIONS_PAGES; ++page) {
            const offset = page * MAX_ACTIONS_PER_CALL
            const batch = await this.midgard.getUserActions(offset, MAX_ACTIONS_PER_CALL)
            // todo: handle or break
            console.info(batch)
            if(batch.txs.length > 1) {
                break
            }
        }
    }

    private async tick() {
        this.counter++
        console.log('tick #', this.counter)

        await this.requestPools()
        await this.requestActions()

        this.timer = setTimeout(this.tick.bind(this), this.interval)
    }

    public async run() {
        console.info('RealtimeProvider starts...')

        this.delegate.receiveEvent(new ThorEvent(EventType.ResetAll))

        this.tick()
    }

    public stop() {
        console.warn('stop data provider!')
        // clearInterval(this.timer!)
        if(this.timer) {
            clearTimeout(this.timer!)
            this.timer = undefined
        }
    }
}

export {
    RealtimeProvider
}