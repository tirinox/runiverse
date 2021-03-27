import {EventType, ThorEventListener} from "@/provider/types";
import {MAX_ACTIONS_PER_CALL, Midgard} from "@/provider/midgard/midgard";
import {PoolChangeAnalyzer} from "@/provider/process/poolChangeAnalize";
import {Config} from "@/config";
import {TxAnalyzer} from "@/provider/process/txAnalyze";
import {ActionStatusEnum} from "@/provider/midgard/v2";


class RealtimeProvider {
    public readonly interval = 5 * 1000

    public delegate: ThorEventListener
    public midgard: Midgard

    private poolAnalyzer: PoolChangeAnalyzer
    private txAnalyzer: TxAnalyzer

    counter: number = 0
    private timer?: number;

    private firstTimeActions = true

    constructor(delegate: ThorEventListener, midgard: Midgard, interval: number = 5) {
        this.delegate = delegate
        this.midgard = midgard
        this.poolAnalyzer = new PoolChangeAnalyzer()
        this.txAnalyzer = new TxAnalyzer()
        this.interval = interval
    }

    private async requestPools() {
        const pools = await this.midgard.getPoolState()
        const changes = this.poolAnalyzer.processPools(pools)
        for(const poolChange of changes) {
            this.delegate.receiveEvent({
                eventType: EventType.UpdatePool,
                poolChange
            })
        }
    }

    private async requestActions() {
        for(let page = 0; page < Config.MaxPagesOfActions; ++page) {
            const offset = page * MAX_ACTIONS_PER_CALL
            const batch = await this.midgard.getUserActions(offset, MAX_ACTIONS_PER_CALL)
            const [changes, goOnFlag] = this.txAnalyzer.processTransactions(batch.txs)

            for(const ev of changes) {
                if(this.firstTimeActions && ev.tx.status == ActionStatusEnum.Success) {
                    // ignore success TX events first time, count only pending
                    continue
                }

                this.delegate.receiveEvent({
                    eventType: EventType.Transaction,
                    txEvent: ev
                })
            }

            if(!goOnFlag) {
                break
            }
        }

        this.firstTimeActions = false
    }

    private async tick() {
        this.counter++
        console.log('tick #', this.counter)

        try {
            await Promise.all([
                this.requestPools(),
                this.requestActions()
            ])
        } catch (e) {
            console.error(`Tick error: ${e}!`)
        }

        this.timer = setTimeout(this.tick.bind(this), this.interval * 1000)
    }

    public async run() {
        console.info('RealtimeProvider starts...')

        this.delegate.receiveEvent({
            eventType: EventType.ResetAll
        })

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