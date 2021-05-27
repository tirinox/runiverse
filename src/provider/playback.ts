import {BaseDataProvider} from "@/provider/data_provider";
import {EventType, ThorEventListener} from "@/provider/types";
import {lastElement} from "@/helpers/data_utils";

interface RecordEvent {
    timestamp: number;
    sec_from_start: number;
    type: string;
    event: object;
}

interface RecordHeader {
    version: string;
    start_date: string;
    events: Array<RecordEvent>
}

export class PlaybackDataProvider extends BaseDataProvider {
    private fileName: string;
    private isFileLoaded: boolean = false
    private timeScale: number
    private timer: number = -1
    private _isRunning: boolean = false
    private currentEventIndex: number = 0
    private events: Array<RecordEvent> = []
    private prevEventTime: number = 0.0
    private started: boolean = false

    get isRunning() {
        return this._isRunning
    }

    get totalDurationSec(): number {
        return lastElement(this.events).sec_from_start * this.timeScale
    }

    public progress(): number {
        const duration = this.totalDurationSec
        const dt = duration - this.currentEvent!.sec_from_start
        return dt / duration
    }

    get currentEvent(): RecordEvent | undefined {
        if(this.isFinished) {
            return undefined
        } else {
            return this.events[this.currentEventIndex]
        }
    }

    get isFinished() {
        return this.currentEventIndex >= this.events.length
    }

    constructor(delegate: ThorEventListener, fileName: string, timeScale: number = 1.0) {
        super(delegate);
        this.fileName = fileName
        this.timeScale = timeScale
        this._isRunning = false
    }

    async loadFile() {
        if(this._isRunning) {
            this.stop()
        }

        const response = await fetch(this.fileName)
        const json = await response.json()

        this.isFileLoaded = true
        this.currentEventIndex = 0
        this.events = json
        console.log('PlaybackDataProvider loaded: v =', json.version, 'start =', json.start_date)
    }

    async run(): Promise<void> {
        if(this._isRunning) {
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

        if(this.events.length == 0) {
            console.error('no events for playback')
            return
        }

        this.stop()
        this._isRunning = true
        await this.tick()
    }

    private executeEvent(evt: RecordEvent) {
        console.log('event:', evt)
    }

    private async tick() {
        if(this.events.length == 0) {
            console.error('no events for playback')
            return
        }

        if(this.isFinished) {
            console.log('playback finished!')
            this.stop()
            return
        }

        const currentEvent = this.currentEvent
        const currentEventTime = currentEvent!.sec_from_start

        let secondsToNextEvent = 0.0
        if(!this.started) {
            secondsToNextEvent = currentEventTime
            this.prevEventTime = currentEventTime
            this.currentEventIndex = 0
            this.started = true
        } else {
            this.executeEvent(currentEvent!)
            this.currentEventIndex++
            const nextEvent = this.currentEvent
            if(nextEvent) {
                secondsToNextEvent = nextEvent.sec_from_start - this.prevEventTime
                this.prevEventTime = nextEvent.sec_from_start
            }
        }

        this.timer = setTimeout(this.tick.bind(this), secondsToNextEvent * 1000)
    }

    rewindToStart() {
        this.stop()
        this.sendReset()
        this.started = false
        this.prevEventTime = 0.0
        this.currentEventIndex = 0
    }

    stop(): void {
        if(this.timer >= 0) {
            clearInterval(this.timer)
            this.timer = -1
        }
        this._isRunning = false
    }
}
