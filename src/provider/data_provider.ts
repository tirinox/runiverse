import {EventType, ThorEventListener} from "@/provider/types";


export abstract class BaseDataProvider {
    public delegate: ThorEventListener

    protected constructor(delegate: ThorEventListener) {
        this.delegate = delegate
    }

    public abstract async play(): Promise<void>;
    public abstract pause(): void;

    protected sendReset() {
        // reset scene!
        this.delegate.receiveEvent({
            date: Date.now(),
            eventType: EventType.ResetAll
        })
    }
}
