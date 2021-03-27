import {Vector3} from "three";

export const ZeroVector3 = new Vector3()

export function randomPointOnSphere(r: number, center: Vector3 = ZeroVector3): Vector3 {
    let point = new Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
    point.normalize();
    point.multiplyScalar(r);
    point.add(center)
    return point
}