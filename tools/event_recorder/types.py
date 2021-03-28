from dataclasses import dataclass


class EventType:
    NOPE = 'nope'
    SET_NODES = 'setNodes'
    TRANSACTION = 'transaction'
    SET_POOLS = 'setPools'
    UPDATE_POOL = 'updatePools'
    RESET_ALL = 'resetPools'


@dataclass
class PoolDetail:
    asset: str = ''
    asset_depth: int = 0
    rune_depth: int = 0
    is_enabled: bool = False
    units: int = 0


class PoolChangeType:
    ADDED = 'added',
    REMOVED = 'removed'
    STATUS_CHANGED = 'statusChanged'
    DEPTH_CHANGE = 'depthChanged'


@dataclass
class PoolChange:
    type: str = PoolChangeType.ADDED
    date: int = 0
    pool: PoolDetail = None
    previous_pool: PoolDetail = None
