import {setDifference, setIntersection} from "@/helpers/iter";
import {EventType, PoolChange, PoolChangeType, ThorEvent} from "@/provider/types";
import {PoolDetail} from "@/provider/midgard/poolDetail";


export class PoolChangeAnalyzer {
    private prevPoolsMapping: Record<string, PoolDetail> = {}

    public static poolChangeToEvent(poolChange: PoolChange): ThorEvent {
        const now = Date.now()
        return {
            date: now,
            eventType: EventType.UpdatePool,
            poolChange
        }
    }

    public processPools(pools: Array<PoolDetail>): ThorEvent[] {
        if (!pools) {
            return []
        }

        const currentPoolsMapping: Record<string, PoolDetail> = Object.fromEntries(
            pools.map((item: PoolDetail) => [item.asset, item])
        )

        const previousKeys = new Set(Object.keys(this.prevPoolsMapping!))
        const currentKeys = new Set(Object.keys(currentPoolsMapping))

        const removedKeys = setDifference(previousKeys, currentKeys)
        const addedKeys = setDifference(currentKeys, previousKeys)
        const commonKeys = setIntersection(currentKeys, previousKeys)

        let poolChanges: PoolChange[] = []

        for (const key of removedKeys) {
            const previousPool = this.prevPoolsMapping[key]
            poolChanges.push({
                pool: undefined, previousPool, type: PoolChangeType.Removed
            })
        }

        for (const key of addedKeys) {
            poolChanges.push({
                pool: currentPoolsMapping[key], previousPool: undefined, type: PoolChangeType.Added
            })
        }

        for (const key of commonKeys) {
            const currentPool = currentPoolsMapping[key]
            const previousPool = this.prevPoolsMapping[key]

            if (!currentPool.isEqual(previousPool)) {
                const typeOfChange = currentPool.isEnabled != previousPool.isEnabled ?
                    PoolChangeType.StatusChanged : PoolChangeType.DepthChanged
                poolChanges.push({
                    pool: currentPool, previousPool, type: typeOfChange
                })
            }
        }

        // console.info('pool changes: ', poolChanges.map((i) => i.pool.toString()))

        this.prevPoolsMapping = currentPoolsMapping
        return poolChanges.map(e => PoolChangeAnalyzer.poolChangeToEvent(e))
    }
}
