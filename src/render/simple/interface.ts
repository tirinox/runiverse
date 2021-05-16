import {TxObject} from "@/render/simple/txObject";
import * as THREE from "three";
import {WalletObject} from "@/render/simple/walletObject";

export const CORE_NAME = 'core!'
export const WALLET_PREFIX = 'wallet:'

export interface IPoolQuery {
    getPoolByName(poolName: string): THREE.Object3D;
}

export interface IWalletQuery {
    findWalletByAddress(address: string): WalletObject | undefined;
}