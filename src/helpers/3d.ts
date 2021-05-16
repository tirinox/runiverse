import {Quaternion, Vector3} from "three";
import {hexToBigInt} from "@/helpers/data_utils";

export const ZeroVector3 = new Vector3()

export function randomPointOnSphere(r: number, center: Vector3 = ZeroVector3): Vector3 {
    let point = new Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
    point.normalize();
    point.multiplyScalar(r);
    point.add(center)
    return point
}


export class Orbit {
    targetObj: THREE.Object3D;
    center: Vector3;
    private _normal: Vector3 = Orbit.up.clone();
    radius: number;
    t: number = 0.0;
    private q: Quaternion = new Quaternion()
    static up: Vector3 = new Vector3(0, 1, 0)

    get normal(): Vector3 {
        return this._normal;
    }

    set normal(value: Vector3) {
        this._normal = value;
        this.q.setFromUnitVectors(Orbit.up, value)
    }

    getPosition(t: number) {
        const x = this.radius * Math.sin(t)
        const y = this.radius * Math.cos(t)
        const z = 0.0

        let vector = new Vector3(x, y, z)
        vector.applyQuaternion(this.q)
        vector.add(this.center)

        return vector
    }

    randomizePhase() {
        this.t = Math.random() * Math.PI * 2
    }

    step(dt: number, speed: number = 1.0): Vector3 {
        this.t += dt * speed
        const p = this.getPosition(this.t)
        if (this.targetObj) {
            this.targetObj.position.copy(p)
        }
        return p
    }

    constructor(targetObj: THREE.Object3D,
                center: Vector3 = ZeroVector3.clone(),
                radius: number = 100,
                normal: Vector3 = new Vector3(0, 1, 0)) {
        this.targetObj = targetObj
        this.radius = radius
        this.normal = normal
        this.center = center
    }
}

export function randomGauss(center: number, scale: number) {
    let r = 0;
    const v = 5
    for (let i = v; i > 0; i--) {
        r += Math.random();
    }
    return (r / v - 0.5) * scale + center
}

export interface PolarCoordinates {
    r: number
    phi: number
    theta: number
}

export function hashToPolarCoordinates(hash: string, r: number = 1.0): PolarCoordinates {
    const middle = Math.floor(hash.length / 2)
    const leftPart = hash.substring(0, middle)
    const rightPart = hash.substring(middle, hash.length)

    const phiInt = hexToBigInt(leftPart).valueOf() % BigInt(36000)
    const thetaInt = hexToBigInt(rightPart).valueOf() % BigInt(36000)

    const phi = (Number(phiInt) * 0.01) * Math.PI / 180.0
    const theta = (Number(thetaInt) * 0.01 - 180.0) * Math.PI / 180.0

    return {
        r,
        phi,
        theta
    }
}

export function polarToXYZ(p: PolarCoordinates): Vector3 {
    const x = p.r * Math.sin(p.theta) * Math.cos(p.phi)
    const y = p.r * Math.sin(p.theta) * Math.sin(p.phi)
    const z = p.r * Math.cos(p.theta)
    return new Vector3(x, y, z)
}

export const RUNE_COLOR = 0x28f4af

export function limitMaxLength(v: Vector3, maxLen: number): Vector3 {
    if(v.length() > maxLen) {
        let newV = v.clone()
        newV.normalize()
        newV.multiplyScalar(maxLen)
        return newV
    } else {
        return v
    }
}