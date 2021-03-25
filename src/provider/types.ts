import {PoolDetail} from "@/provider/midgard/poolDetail";

export const enum EventType {
    Nope,
    SetNodes,
    CreateTransaction,
    SetPools,
    UpdatePool,
    ResetAll
}

export enum PoolChangeType {
    Added,
    Removed,
    StatusChanged,
    DepthChanged
}

export class PoolChange {
    constructor(
        public type: PoolChangeType,
        public date: number,
        public pool?: PoolDetail,
        public previousPool?: PoolDetail,
    ) {
    }
}

export class ThorEvent {
    eventType: EventType
    poolChange?: PoolChange

    constructor(eventType: EventType = EventType.Nope,
                poolChange?: PoolChange) {
        this.eventType = eventType
        this.poolChange = poolChange
    }
}

export interface ThorEventListener {
    receiveEvent(e: ThorEvent): void
}

