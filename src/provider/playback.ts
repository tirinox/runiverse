import {BaseDataProvider} from "@/provider/data_provider";
import {EventType, ThorEventListener} from "@/provider/types";
import {lastElement} from "@/helpers/data_utils";
import {PoolChangeAnalyzer} from "@/provider/process/poolChangeAnalize";
import {TxAnalyzer} from "@/provider/process/txAnalyze";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import {ThorTransaction} from "@/provider/midgard/tx";


interface RecordEventContents {
    added: Array<any>
    changed: Array<any>
    removed: Array<any>
}

interface RecordEvent {
    timestamp: number;
    sec_from_start: number;
    type: string;
    event: RecordEventContents;
}

interface RecordHeader {
    version: string;
    start_date: string;
    events: Array<RecordEvent>
}

const enum RecordEventType {
    PoolEvent = 'pool_event',
    TxEvent = 'tx_event'
}


const V2 = 'v2'

export class PlaybackDataProvider extends BaseDataProvider {
    private fileName: string;
    private isFileLoaded: boolean = false
    private timeScale: number
    private timer: number = -1
    private _isRunning: boolean = false
    private currentEventIndex: number = 0
    private eventStreamArray: Array<RecordEvent> = []
    private prevEventTime: number = 0.0
    private started: boolean = false
    private version: string = ''

    private poolsState: Record<string, PoolDetail> = {}
    private txState: Record<string, ThorTransaction> = {}

    private poolAnalyzer: PoolChangeAnalyzer
    private txAnalyzer: TxAnalyzer

    get isRunning() {
        return this._isRunning
    }

    get totalDurationSec(): number {
        return lastElement(this.eventStreamArray).sec_from_start * this.timeScale
    }

    get progress(): number {
        const duration = this.totalDurationSec
        const curr = this.currentEvent
        if (curr) {
            return curr.sec_from_start / duration
        } else {
            return 0.0
        }
    }

    get currentEvent(): RecordEvent | undefined {
        if (this.isFinished) {
            return undefined
        } else {
            return this.eventStreamArray[this.currentEventIndex]
        }
    }

    get isFinished() {
        return this.currentEventIndex >= this.eventStreamArray.length
    }

    constructor(delegate: ThorEventListener, fileName: string, timeScale: number = 1.0) {
        super(delegate);
        this.fileName = fileName
        this.timeScale = timeScale
        this._isRunning = false
        this.poolAnalyzer = new PoolChangeAnalyzer()
        this.txAnalyzer = new TxAnalyzer()
    }

    async loadFile() {
        if (this._isRunning) {
            this.stop()
        }

        const response = await fetch(this.fileName)
        const json = await response.json()

        this.resetState()
        this.isFileLoaded = true
        this.eventStreamArray = json.events
        this.version = json.version

        console.log('PlaybackDataProvider loaded: version:', json.version, 'start =', json.start_date)
    }

    async run(): Promise<void> {
        if (this._isRunning) {
            console.warn('Playback is running! Can not run it again! Call stop()')
            return
        }

        if (!this.isFileLoaded) {
            await this.loadFile()
            // reset scene!
            this.delegate.receiveEvent({
                date: Date.now(),
                eventType: EventType.ResetAll
            })
        }

        if (this.eventStreamArray.length == 0) {
            console.error('no events for playback')
            return
        }

        this.stop()
        this._isRunning = true
        await this.tick()
    }

    private executePoolEvent(e: RecordEventContents) {
        const parser = this.version == V2 ? PoolDetail.fromMidgardV2 : PoolDetail.fromMidgardV1

        if(e.removed.length) {
            const removedAssets = e.removed.map(o => o.asset)
            for(const removedAsset of removedAssets) {
                delete this.poolsState[removedAsset]
            }
        }
        for(const newPoolJson of [...e.added, ...e.changed]) {
            const poolDetails = parser(newPoolJson)
            this.poolsState[poolDetails.asset] = poolDetails
        }

        const events = this.poolAnalyzer.processPools(Object.values(this.poolsState))
        for(const ev of events) {
            this.delegate.receiveEvent(ev)
        }
    }

    private executeTxEvent(e: RecordEventContents) {
        const parser = this.version == V2 ? ThorTransaction.fromMidgardV2 : ThorTransaction.fromMidgardV1

        for(const newTx of [...e.added, ...e.changed]) {
            const tx = parser(newTx)
            const hash = tx.realInputHash
            if(hash) {
                this.txState[hash] = tx
            }
        }

        const txStream = Object.values(this.txState).sort((a, b) => a.dateTimestampMs - b.dateTimestampMs)
        const maxNumber = 50
        const txStreamExcess = txStream.slice(maxNumber)
        for(const tx of txStreamExcess) {
            delete this.txState[tx.realInputHash!]
        }
        const txStreamLimited = txStream.slice(0, maxNumber)
        const [events, _] = this.txAnalyzer.processTransactions(txStreamLimited)

        for(const ev of events) {
            this.delegate.receiveEvent(ev)
        }
    }

    private executeEvent(evt: RecordEvent) {
        console.log('event:', evt, "progress = ", this.progress * 100, '%')
        if (evt.type == RecordEventType.PoolEvent) {
            this.executePoolEvent(evt.event)
        } else if (evt.type == RecordEventType.TxEvent) {
            this.executeTxEvent(evt.event)
        }
    }

    private async tick() {
        if (this.eventStreamArray.length == 0) {
            console.error('no events for playback')
            return
        }

        if (this.isFinished) {
            console.log('playback finished!')
            this.stop()
            return
        }

        const currentEvent = this.currentEvent
        const currentEventTime = currentEvent!.sec_from_start

        let secondsToNextEvent = 0.0
        if (!this.started) {
            secondsToNextEvent = currentEventTime
            this.prevEventTime = currentEventTime
            this.currentEventIndex = 0
            this.started = true
        } else {
            this.executeEvent(currentEvent!)
            this.currentEventIndex++
            const nextEvent = this.currentEvent
            if (nextEvent) {
                secondsToNextEvent = nextEvent.sec_from_start - this.prevEventTime
                this.prevEventTime = nextEvent.sec_from_start
            }
        }

        this.timer = setTimeout(this.tick.bind(this), secondsToNextEvent * 1000)
    }

    resetState() {
        this.started = false
        this.prevEventTime = 0.0
        this.currentEventIndex = 0
        this.txState = {}
        this.poolsState = {}
        this.poolAnalyzer = new PoolChangeAnalyzer()
        this.txAnalyzer = new TxAnalyzer()
    }

    rewindToStart() {
        this.stop()
        this.sendReset()
        this.resetState()
    }

    stop(): void {
        if (this.timer >= 0) {
            clearInterval(this.timer)
            this.timer = -1
        }
        this._isRunning = false
    }
}
