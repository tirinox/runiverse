import {PoolDetail} from "@/provider/midgard/poolDetail";
import {ThorTransaction} from "@/provider/midgard/tx";


export const enum EventType {
    Nope = 'nope',
    SetNodes = 'setNodes',
    Transaction = 'transaction',
    SetPools = 'setPools',
    UpdatePool = 'updatePools',
    ResetAll = 'resetPools'
}


export enum PoolChangeType {
    Added = 'added',
    Removed = 'removed',
    StatusChanged = 'statusChanged',
    DepthChanged = 'depthChanged'
}


export interface PoolChange {
    type: PoolChangeType,
    date: number,
    pool?: PoolDetail,
    previousPool?: PoolDetail,
}


export enum TxEventType {
    Add = 'addTx',
    StatusUpdated = 'statusUpdated',
    Destroy = 'destroyTx'
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

