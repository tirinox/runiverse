import {setDifference, setIntersection} from "@/helpers/iter";
import {PoolChange, PoolChangeType} from "@/provider/types";
import {PoolDetail} from "@/provider/midgard/poolDetail";


export class PoolChangeAnalyzer {
    private prevPoolsMapping: Record<string, PoolDetail> = {}

    public processPools(pools: Array<PoolDetail>): PoolChange[] {
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

        const now = Date.now()

        for (const key of removedKeys) {
            const previousPool = this.prevPoolsMapping[key]
            poolChanges.push({
                date: now, pool: undefined, previousPool, type: PoolChangeType.Removed
            })
        }

        for (const key of addedKeys) {
            poolChanges.push({
                date: now, pool: currentPoolsMapping[key], previousPool: undefined, type: PoolChangeType.Added
            })
        }

        for (const key of commonKeys) {
            const currentPool = currentPoolsMapping[key]
            const previousPool = this.prevPoolsMapping[key]

            if (!currentPool.isEqual(previousPool)) {
                const typeOfChange = currentPool.isEnabled != previousPool.isEnabled ?
                    PoolChangeType.StatusChanged : PoolChangeType.DepthChanged
                poolChanges.push({
                    date: now, pool: currentPool, previousPool, type: typeOfChange
                })
            }
        }

        // console.info('pool changes: ', poolChanges.map((i) => i.pool.toString()))

        this.prevPoolsMapping = currentPoolsMapping
        return poolChanges
    }
}