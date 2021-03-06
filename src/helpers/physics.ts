import {limitLength, vectorFromPositionToDirection, ZeroVector3} from "@/helpers/3d";
import {Object3D, Vector3} from "three";
import {Config} from "@/config";


export class PhysicalObject extends Object3D {
    public mass = 1.0
    public force = new Vector3()
    public velocity = new Vector3()
    public dissipation = 0.0
    public enabledPhysics = true

    public maxSpeed = Config.Physics.MaxSpeed

    constructor(mass: number = 1.0) {
        super();
        this.mass = mass
    }

    setVelocityToDirection(dir: Vector3, speed: number) {
        this.velocity = vectorFromPositionToDirection(this.position, dir, speed)
    }

    public update(dt: number) {
        if(!this.enabledPhysics) {
            return
        }

        let accel = this.force.clone()
        accel.multiplyScalar(dt / this.mass)
        this.velocity.add(accel)

        this.velocity = limitLength(this.velocity, 0.0, this.maxSpeed)

        let shift = this.velocity.clone()
        shift.multiplyScalar(dt)
        this.position.add(shift)

        this.velocity.multiplyScalar(1.0 - this.dissipation * dt)

        // console.log(this.obj3d.position)

        if (this.position.length() > Config.Physics.DistanceLimit) {
            console.log('Mesh has fled far away!')
            this.position.copy(ZeroVector3)
        }
    }

    isCloseToTarget(targetPosition: Vector3, minDistance = Config.Animations.ProximityDistance): boolean {
        let deltaPosition = targetPosition.clone().sub(this.position!)
        return deltaPosition.length() < minDistance
    }

    public static gravityForce(m1: number, pos1: Vector3, m2: number, pos2: Vector3): Vector3 {
        let dx = pos2.clone().sub(pos1)
        const r = Math.max(0.01, dx.length())
        dx.normalize()
        const mag =
            Config.Physics.Gravity.Constant * m1 * m2 / (Math.pow(r, 2)) +
            Config.Physics.Gravity.LongDistConstant * Math.pow(r, 1.6)

        return dx.multiplyScalar(mag)
    }

    public myGravityTo(mass: number, position: Vector3) {
        return PhysicalObject.gravityForce(this.mass, this.position, mass, position)
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
        return PhysicalObject.logForce(this.mass, this.position, mass, position, cutDistance)
    }

    public repelFrom(mass: number, position: Vector3, repelConst: number = 1e-6): Vector3 {
        let dx = this.position.clone().sub(position)
        dx.normalize()
        const mag = Math.pow(dx.length(), 2) * repelConst
        dx.multiplyScalar(mag)
        return dx
    }
}
