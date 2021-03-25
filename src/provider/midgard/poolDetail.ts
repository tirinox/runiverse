import BigNumber from "bignumber.js";

export class PoolDetail {
    constructor(public asset: string,
                public assetDepth: BigNumber,
                public runeDepth: BigNumber,
                public isEnabled: boolean,
                public units: BigNumber) {
    }

    static from_midgard_v2(j: any): PoolDetail {
        return new PoolDetail(
            j.asset,
            new BigNumber(j.assetDepth),
            new BigNumber(j.runeDepth),
            j.status == 'enabled',
            new BigNumber(j.units)
        )
    }

    static from_midgard_v1(j: any): PoolDetail {
        return new PoolDetail(
            j.asset,
            new BigNumber(j.assetDepth),
            new BigNumber(j.runeDepth),
            j.status == 'enabled',
            new BigNumber(j.poolUnits)
        )
    }

    get runesPerAsset(): BigNumber {
        return this.runeDepth.div(this.assetDepth)
    }

    get assetsPerRune(): BigNumber {
        return this.assetDepth.div(this.runeDepth)
    }

    public isEqual(other: PoolDetail): boolean {
        return this.asset === other.asset &&
            this.runeDepth.isEqualTo(other.runeDepth) &&
            this.assetDepth.isEqualTo(other.assetDepth) &&
            this.units.isEqualTo(other.units) &&
            this.isEnabled === other.isEnabled
    }

    public sub(other: PoolDetail) {
        return new PoolDetail(
            this.asset,
            this.assetDepth.minus(other.assetDepth),
            this.runeDepth.minus(other.runeDepth),
            this.isEnabled,
            this.units.minus(other.units)
        )
    }

    public toString() {
        const status = this.isEnabled ? 'enabled' : 'bootstraping'
        return `Pool(${this.runeDepth.toString()} R vs ${this.assetDepth.toString()} ${this.asset}, units = ${this.units.toString()}, ${status})`
    }
}