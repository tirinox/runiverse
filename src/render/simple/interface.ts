import {TxObject} from "@/render/simple/txObject";
import * as THREE from "three";

export interface IPoolQuery {
    getPoolObjectOfTxMesh(t: TxObject, index: number): THREE.Object3D;
}