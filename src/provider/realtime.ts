import {EventType, ThorEventListener} from "@/provider/types";
import {MAX_ACTIONS_PER_CALL, Midgard} from "@/provider/midgard/midgard";
import {PoolChangeAnalyzer} from "@/provider/process/poolChangeAnalize";
import {Config} from "@/config";
import {TxAnalyzer} from "@/provider/process/txAnalyze";
import {ActionStatusEnum} from "@/provider/midgard/v2";
import {sleep} from "@/helpers/async_utils";


class RealtimeProvider {
    public readonly intervalSec: number = 5

    public delegate: ThorEventListener
    public midgard: Midgard

    private poolAnalyzer: PoolChangeAnalyzer
    private txAnalyzer: TxAnalyzer

    counter: number = 0
    private timer?: number;

    public ignoreFirstTime: boolean = false

    private firstTimeActions = true
    public suppressErrors = true

    constructor(delegate: ThorEventListener, midgard: Midgard, intervalSec: number = 5,
                ignoreFirstTime: boolean = false,
                suppressErrors: boolean = false) {
        this.delegate = delegate
        this.midgard = midgard
        this.poolAnalyzer = new PoolChangeAnalyzer()
        this.txAnalyzer = new TxAnalyzer()
        this.intervalSec = intervalSec
        this.ignoreFirstTime = ignoreFirstTime
        this.suppressErrors = suppressErrors
    }

    private async requestPools() {
        const now = Date.now()

        const pools = await this.midgard.getPoolState()
        const changes = this.poolAnalyzer.processPools(pools)
        for(const poolChange of changes) {
            this.delegate.receiveEvent({
                date: now,
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
                if(this.ignoreFirstTime && this.firstTimeActions && ev.tx.status == ActionStatusEnum.Success) {
                    // ignore success TX events first time, count only pending
                    continue
                }

                this.delegate.receiveEvent({
                    date: ev.tx.dateTimestampMs,  // todo: or maybe now?
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

    private async tickJob() {
        await Promise.all([
            this.requestPools(),
            this.requestActions()
        ])
    }

    private async tick() {
        this.counter++

        for(let attempt = 0; attempt < 3; ++attempt) {
            if(this.suppressErrors) {
                try {
                    await this.tickJob()
                    break
                } catch (e) {
                    console.error(`Tick error at ${attempt + 1} attempt: ${e}!`)
                    await sleep(1.0)
                }
            } else {
                await this.tickJob()
            }
        }

        this.timer = setTimeout(this.tick.bind(this), this.intervalSec * 1000)
    }

    public async run() {
        console.info('RealtimeProvider starts...')

        this.delegate.receiveEvent({
            date: Date.now(),
            eventType: EventType.ResetAll
        })

        await this.tick()
    }

    public stop() {
        console.warn('stop data provider!')

        if(this.timer) {
            clearTimeout(this.timer!)
            this.timer = undefined
        }
    }
}

export {
    RealtimeProvider
}