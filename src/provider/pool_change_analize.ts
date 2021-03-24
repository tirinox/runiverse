import {PoolDetail} from "@/provider/midgard";
import {setDifference, setIntersection} from "@/helpers/iter";

export enum PoolChangeType {
    Added,
    Removed,
    StatusChanged,
    DepthChanged
}

export class PoolChange {
    constructor(
        public type: PoolChangeType,
        public pool: PoolDetail,
        public date: number
    ) {
    }
}

export class PoolChangeAnalyzer {
    private prevPoolsMapping?: Record<string, PoolDetail>

    public processPools(pools: Array<PoolDetail>): PoolChange[] {
        if (!pools) {
            return []
        }

        const currentPoolsMapping: Record<string, PoolDetail> = Object.fromEntries(
            pools.map((item: PoolDetail) => [item.asset, item])
        )

        if (!this.prevPoolsMapping) {
            this.prevPoolsMapping = currentPoolsMapping
            return []
        }

        const previousKeys = new Set(Object.keys(this.prevPoolsMapping!))
        const currentKeys = new Set(Object.keys(currentPoolsMapping))

        const removedKeys = setDifference(previousKeys, currentKeys)
        const addedKeys = setDifference(currentKeys, previousKeys)
        const commonKeys = setIntersection(currentKeys, previousKeys)

        let poolChanges: PoolChange[] = []

        const now = Date.now()

        for (const key of removedKeys) {
            const previousPool = this.prevPoolsMapping[key]
            poolChanges.push(new PoolChange(PoolChangeType.Removed, previousPool, now))
        }

        for (const key of addedKeys) {
            const currentPool = currentPoolsMapping[key]
            poolChanges.push(new PoolChange(PoolChangeType.Added, currentPool, now))
        }

        for (const key of commonKeys) {
            const currentPool = currentPoolsMapping[key]
            const previousPool = this.prevPoolsMapping[key]

            if (!currentPool.isEqual(previousPool)) {
                const typeOfChange = currentPool.isEnabled != previousPool.isEnabled ?
                    PoolChangeType.StatusChanged : PoolChangeType.DepthChanged
                poolChanges.push(new PoolChange(typeOfChange, currentPool.sub(previousPool), now))
            }
        }

        // console.info('pool changes: ', poolChanges.map((i) => i.pool.toString()))

        this.prevPoolsMapping = currentPoolsMapping
        return poolChanges
    }
}