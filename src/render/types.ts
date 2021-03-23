export const enum EventType {
    Nope,
    SetNodes,
    CreateTransaction,
    SetPools,
    UpdatePool,
    ResetAll
}

export class ThorEvent {
    eventType: EventType

    constructor(eventType: EventType = EventType.Nope) {
        this.eventType = eventType
    }
}

export interface ThorScene {
    receiveEvent(e: ThorEvent): void
}

