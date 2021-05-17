import * as THREE from "three";
import {WalletObject} from "@/render/simple/walletObject";
import {PoolObject} from "@/render/simple/poolObject";

export const CORE_NAME = 'core!'
export const WALLET_PREFIX = 'wallet:'

export interface IPoolQuery {
    getPoolByName(poolName: string): THREE.Object3D;
    allPools(): Array <PoolObject>;
    runesPerAsset(poolName: string): number
}

export interface IWalletQuery {
    findWalletByAddress(address: string): WalletObject | undefined;
}
