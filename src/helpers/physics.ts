import {limitMaxLength, ZeroVector3} from "@/helpers/3d";
import {Object3D, Vector3} from "three";

export class PhysicalObject {
    public mass = 1.0
    public obj3d?: Object3D
    public force = new Vector3()
    public velocity = new Vector3()

    public maxSpeed = 100.0

    get position() {
        return this.obj3d?.position
    }

    constructor(mass: number = 1.0, obj3d?: Object3D) {
        this.mass = mass
        this.obj3d = obj3d
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

        if (this.obj3d.position.length() > 1e8) {
            console.log('Mesh has fled far away!')
            this.obj3d.position.copy(ZeroVector3)
        }
    }
}
