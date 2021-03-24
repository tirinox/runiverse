import {PoolDetail} from "@/provider/midgard";
import {setDifference, setIntersection} from "@/helpers/iter";

export class PoolChangeAnalyzer {
    private prevPoolsMapping?: Record<string, PoolDetail>

    public processPools(pools: Array<PoolDetail>) {
        if (!pools) {
            return
        }

        const currentPoolsMapping: Record<string, PoolDetail> = Object.fromEntries(
            pools.map((item: PoolDetail) => [item.asset, item])
        )
        if(!this.prevPoolsMapping) {
            this.prevPoolsMapping = currentPoolsMapping
            return
        }

        const previousKeys = new Set(Object.keys(this.prevPoolsMapping!))
        const currentKeys = new Set(Object.keys(currentPoolsMapping))

        const removedKeys = setDifference(previousKeys, currentKeys)
        const addedKeys = setDifference(currentKeys, previousKeys)
        const commonKeys = setIntersection(currentKeys, previousKeys)

        for(const key of commonKeys) {
            const currentPool = currentPoolsMapping[key]
            const previousPool = this.prevPoolsMapping[key]
            if(!currentPool.isEqual(previousPool)) {
                // console.warn('POOL Change from ', previousPool, ' to ', currentPool, ' !!!')
            }
        }

        console.log('added: ', addedKeys, '; removed: ', removedKeys, '; intersection = ', commonKeys.size)

        this.prevPoolsMapping = currentPoolsMapping
    }
}