import {Quaternion, Vector3} from "three";

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