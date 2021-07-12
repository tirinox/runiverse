import {Quaternion, Vector3, Object3D} from "three";
import {hexToBigInt} from "@/helpers/data_utils";

export const ZeroVector3 = new Vector3()

export function randomPointOnSphere(r: number = 1.0, center: Vector3 = ZeroVector3): Vector3 {
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

    step(dt: number = 0.016, speed: number = 1.0): Vector3 {
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
    let v = new Vector3()
    v.setFromSphericalCoords(p.r, p.phi, p.theta)
    return v
}

export function limitLength(v: Vector3, minLen: number = 0.0, maxLen: number = 1e10): Vector3 {
    const currentLen = v.length()
    if (currentLen === 0.0) {
        return ZeroVector3.clone()
    }

    minLen = Math.abs(minLen)
    maxLen = Math.abs(maxLen)

    if (currentLen > maxLen || currentLen < minLen) {
        let newV = v.clone()
        newV.normalize()
        if (currentLen > maxLen) {
            newV.multiplyScalar(maxLen)
        } else {
            newV.multiplyScalar(minLen)
        }
        return newV
    } else {
        return v
    }
}

export function vectorFromPositionToDirection(pos: Vector3, dir: Vector3, magnitude: number = 1.0) {
    let delta = pos.clone()
    delta.sub(dir)
    delta.normalize()
    delta.multiplyScalar(-magnitude)
    return delta
}

export function countObjects(parent: THREE.Object3D) {
    var numOfMeshes = 0;
    parent.traverse(function (child) {
        numOfMeshes++;
    });
    return numOfMeshes
}
