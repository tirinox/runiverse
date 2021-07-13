import {ThorEventListener} from "@/provider/types";
import {MAX_ACTIONS_PER_CALL, Midgard} from "@/provider/midgard/midgard";
import {PoolChangeAnalyzer} from "@/provider/process/poolChangeAnalize";
import {Config} from "@/config";
import {TxAnalyzer} from "@/provider/process/txAnalyze";
import {ActionStatusEnum} from "@/provider/midgard/v2";
import {sleep} from "@/helpers/async_utils";
import VisualLog from "@/components/elements/VisualLog.vue";
import {BaseDataProvider} from "@/provider/data_provider";


export class RealtimeProvider extends BaseDataProvider {
    public readonly intervalSec: number = 5

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
        super(delegate);
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
        if (!pools) {
            return
        }

        const poolEvents = this.poolAnalyzer.processPools(pools)
        for (const poolEvent of poolEvents) {
            this.delegate.receiveEvent(poolEvent)
        }
    }

    private async requestActions() {
        const maxPage = Config.RealtimeScanner.MaxPagesOfActions
        for (let page = 0; page < maxPage; ++page) {
            const offset = page * MAX_ACTIONS_PER_CALL
            const batch = await this.midgard.getUserActions(offset, MAX_ACTIONS_PER_CALL)
            if (!batch) {
                break
            }

            const [events, goOnFlag] = this.txAnalyzer.processTransactions(batch.txs)

            for (const ev of events) {
                const tx = ev.txEvent!.tx
                if (this.ignoreFirstTime && this.firstTimeActions && tx.status == ActionStatusEnum.Success) {
                    // ignore success TX events first time, count only pending
                    continue
                }

                this.delegate.receiveEvent(ev)
            }

            if (!goOnFlag) {
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

        for (let attempt = 0; attempt < Config.RealtimeScanner.FetchAttempts; ++attempt) {
            if (this.suppressErrors) {
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

    public async play() {
        console.info('RealtimeProvider starts...')

        this.sendReset()

        try {
            await this.requestPools()  // pools first!
        } catch (e) {
            VisualLog.log('failed to initially get pools info!')
        }

        await this.tick()
    }

    public pause() {
        console.warn('stop data provider!')

        if (this.timer) {
            clearTimeout(this.timer!)
            this.timer = undefined
        }
    }

    public resetState() {
        // todo
    }
}
