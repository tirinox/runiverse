import {PoolDetail} from "@/provider/midgard/poolDetail";
import {ThorTransaction} from "@/provider/midgard/tx";


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


export interface PoolChange {
    type: PoolChangeType,
    date: number,
    pool?: PoolDetail,
    previousPool?: PoolDetail,
}


export enum TxEventType {
    Add,
    StatusUpdated,
    Destroy
}


export interface TxEvent {
    type: TxEventType
    tx: ThorTransaction
}


export interface ThorEvent {
    eventType: EventType
    poolChange?: PoolChange
    txEvent?: TxEvent
}


export interface ThorEventListener {
    receiveEvent(e: ThorEvent): void
}

