import * as THREE from "three";
import {randomGauss, randomGaussV3} from "@/helpers/3d";
import {Config} from "@/config";


export class PoolParticles {
    constructor(obj, texName, color) {
        const cfg = Config.Scene.PoolObject.Particles
        this.n = cfg.N

        this.obj = obj
        this.texName = texName
        this.time = 0.0

        this.flowVert = [];

        this.geometry = new THREE.BufferGeometry();

        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(this.texName);

        this.params = []
        for (let i = 0; i < this.n; i++) {
            this.flowVert.push(0, 0, 0);
            const pos = randomGaussV3(0.0, cfg.ShiftVar)
            this.params.push({
                life: THREE.MathUtils.randFloat(0.0, cfg.Life),
                speed: randomGauss(cfg.MoveSpeedAvg, cfg.MoveSpeedVar),
                pos,
            })
        }

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.flowVert, 3));

        this.mat = new THREE.PointsMaterial({
            size: cfg.Size,
            map: texture,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true
        })

        this.assetColor = color
        this.mat.color.copy(this.assetColor)

        this.particles = new THREE.Points(this.geometry, this.mat);
        this.obj.add(this.particles)
    }

    updateParticles(dt, sisterDirection) {
        this.time += dt
        // this.particles.rotation.y += dt * 0.0000005;

        const cfg = Config.Scene.PoolObject.Particles

        const verts = this.geometry.attributes.position.array
        const baseDir = sisterDirection.clone().normalize()
        let vi = 0
        for (let i = 0; i < verts.length; i += 3, vi += 1) {
            let param = this.params[vi]

            if (param.life > cfg.Life) {
                param.life = 0.0;
                param.speed = randomGauss(cfg.MoveSpeedAvg, cfg.MoveSpeedVar)
                param.pos = randomGaussV3(0.0, cfg.ShiftVar)
            }

            param.life += dt;
            param.pos.add(baseDir.clone().multiplyScalar(dt * param.speed))

            verts[i] = param.pos.x
            verts[i + 1] = param.pos.y
            verts[i + 2] = param.pos.z
        }
        this.geometry.attributes.position.needsUpdate = true
    }
}