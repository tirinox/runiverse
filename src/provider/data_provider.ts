import {EventType, ThorEventListener} from "@/provider/types";


export abstract class BaseDataProvider {
    public delegate: ThorEventListener

    protected constructor(delegate: ThorEventListener) {
        this.delegate = delegate
    }

    public abstract async run(): Promise<void>;
    public abstract stop(): void;

    protected sendReset() {
        // reset scene!
        this.delegate.receiveEvent({
            date: Date.now(),
            eventType: EventType.ResetAll
        })
    }
}
