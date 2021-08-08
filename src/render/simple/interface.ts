import {WalletObject} from "@/render/simple/walletObject";
import {PoolObject} from "@/render/simple/pool/poolObject";

export const CORE_NAME = 'core!'
export const WALLET_PREFIX = 'wallet:'

export interface IPoolQuery {
    getPoolByName(poolName: string): PoolObject | undefined;
    allPools(): Array <PoolObject>;
    runesPerAsset(poolName: string): number
}

export interface IWalletQuery {
    findWalletByAddress(address: string): WalletObject | undefined;
}
