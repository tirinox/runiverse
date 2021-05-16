import {limitMaxLength, ZeroVector3} from "@/helpers/3d";
import {Object3D, Vector3} from "three";

export class PhysicalObject {
    public mass = 1.0
    public obj3d?: Object3D
    public force = new Vector3()
    public velocity = new Vector3()

    public maxSpeed = 10000.0

    get position() {
        return this.obj3d?.position
    }

    constructor(mass: number = 1.0, obj3d?: Object3D) {
        this.mass = mass
        this.obj3d = obj3d
    }

    setVelocityToDirection(dir: Vector3, speed: number) {
        let delta = this.obj3d?.position.clone()!
        delta.sub(dir)
        delta.normalize()
        delta.multiplyScalar(-speed)
        this.velocity = delta
    }

    public dispose() {
        if (this.obj3d) {
            this.obj3d.parent?.remove(this.obj3d)
            this.obj3d = undefined
        }
    }

    public update(dt: number) {
        if (!this.obj3d) {
            return
        }

        let accel = this.force.clone()
        accel.multiplyScalar(dt / this.mass)
        this.velocity.add(accel)

        this.velocity = limitMaxLength(this.velocity, this.maxSpeed)

        let shift = this.velocity.clone()
        shift.multiplyScalar(dt)
        this.obj3d.position.add(shift)

        // console.log(this.obj3d.position)

        if (this.obj3d.position.length() > 1e8) {
            console.log('Mesh has fled far away!')
            this.obj3d.position.copy(ZeroVector3)
        }
    }

    isCloseToTarget(targetPosition: Vector3, minDistance = 10.0): boolean {
        let deltaPosition = targetPosition.clone().sub(this.position!)
        return deltaPosition.length() < minDistance
    }

    public static gravityForce(m1: number, pos1: Vector3, m2: number, pos2: Vector3): Vector3 {
        const GravityConst = 1e-2
        let dx = pos2.clone().sub(pos1)
        const r = Math.max(0.01, dx.length())
        dx.normalize()
        return dx.multiplyScalar(GravityConst * m1 * m2 / (Math.pow(r, 2)))
    }

    public myGravityTo(mass: number, position: Vector3) {
        return PhysicalObject.gravityForce(this.mass, this.obj3d?.position!, mass, position)
    }

    public static logForce(m1: number, pos1: Vector3, m2: number, pos2: Vector3, cutDistance: 100.0): Vector3 {
        let dx = pos2.clone().sub(pos1)
        const r = Math.max(0.01, dx.length())
        dx.normalize()
        const f = Math.log10
        const mult = 10000 * f(r) + f(cutDistance) + f(m1) + f(m2)
        return dx.multiplyScalar(mult)
    }

    public myLogForceTo(mass: number, position: Vector3, cutDistance: 100.0) {
        return PhysicalObject.logForce(this.mass, this.obj3d?.position!, mass, position, cutDistance)
    }
}
