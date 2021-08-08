import * as THREE from "three";
import {Sprite, Vector3} from "three";
import {textureLoader, ZeroVector3} from "@/helpers/3d";
import {
    hashedParameterChoice,
    hashedParameterFloat, hashedParameterFloat01,
    hashedParameterInt,
    truncateStringAtMiddle
} from "@/helpers/data_utils";
import SpriteText from "three-spritetext";
import {Config} from "@/config";
import {hashedColorBright, RUNE_COLOR} from "@/helpers/colors";

const flareTextures = [
    'circle_01.png',
    'circle_02.png',
    'circle_03.png',
    'circle_04.png',
    'circle_05.png',
    'flare_01.png',
    'scorch_01.png',
    'scorch_02.png',
    'scorch_03.png',
    'star_01.png',
    'star_02.png',
    'star_03.png',
    'star_04.png',
    'star_05.png',
    'star_06.png',
    'star_07.png',
    'star_08.png',
    'star_09.png',
    'twirl_01.png',
    'twirl_02.png',
    'twirl_03.png',
    'smoke_01.png',
    'smoke_02.png',
    'smoke_03.png',
    'smoke_04.png',
    'smoke_05.png',
    'smoke_06.png',
    'smoke_07.png',
    'smoke_08.png',
    'smoke_09.png',
    'smoke_10.png',
]

enum FlareAnimType {
    Rotate,
    RotateRandom,
    Pulse,
    Blink,
}

const AllFlareAnimType = Object.keys(FlareAnimType)

interface FlareInformation {
    anim: FlareAnimType;
    speed: number;
    life: number;
    sprite: Sprite;
    direction: number;
    phase: number;
    initialRadius: number;
}

export class WalletObject extends THREE.Object3D {
    private mesh?: THREE.Object3D
    public label?: SpriteText

    private static geom: THREE.ConeGeometry = new THREE.ConeGeometry(30, 50, 8, 1)
    private address: string;

    private lastUpdatedAt: number = Date.now();

    private flares: Array<FlareInformation> = []

    updateDate() {
        this.lastUpdatedAt = Date.now()
    }

    get age() {
        return Date.now() - this.lastUpdatedAt
    }

    private static material = new THREE.MeshLambertMaterial({
        color: 0xff6600,
        reflectivity: 0.4,
    });

    constructor(address: string) {
        super();
        this.address = address

        const cfg = Config.Scene.WalletObject

        if (cfg.Label.Enabled) {
            this.createLabel(address)
        }

        this.makeFlares()
        this.updateDate()
    }

    private makeLegacy() {
        const material = new THREE.MeshBasicMaterial({
            color: hashedColorBright(this.address, 'color')
        })

        this.mesh = new THREE.Mesh(WalletObject.geom, material)
        this.mesh.up.copy(new Vector3(0, 1, 0))
        this.add(this.mesh)
    }

    private makeFlares() {
        const nFlares = hashedParameterInt(this.address, 'nFlares', 4, 12)
        for(let i = 0; i < nFlares; ++i) {
            this.makeFlare(i)
        }
    }

    private makeFlare(i: number) {
        const prefix = `flare/${i}/`
        const textureName = hashedParameterChoice(this.address, prefix + 'texture', flareTextures)
        const texture = textureLoader.load('textures/particles/wallet/' + textureName)

        const color = hashedColorBright(this.address, prefix + 'main_color')
        const opacity = hashedParameterFloat(this.address, prefix + 'opacity', 0.5, 0.9)

        const spriteMaterial = new THREE.SpriteMaterial(
            {
                map: texture,
                sizeAttenuation: true,
                color,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true,
                opacity
            });

        // const radius = (i + 1) * hashedParameterFloat(this.address, prefix + 'radius', 5, 20);
        const radius = hashedParameterFloat(this.address, prefix + 'radius', 30, 120);
        const obj = new THREE.Sprite(spriteMaterial);
        obj.scale.set(radius, radius, 1.0);

        this.add(obj);
        this.flares.push({
            sprite: obj,
            life: 0.0,
            anim: hashedParameterChoice(this.address, prefix + 'anim/type', AllFlareAnimType),
            speed: hashedParameterFloat(this.address, prefix + 'anim/speed', 0.1, 0.8),
            direction: hashedParameterFloat01(this.address, prefix + 'anim/dir') > 0.5 ? 1.0 : -1.0,
            phase: hashedParameterFloat(this.address, prefix + 'anim/phase', 0.0, Math.PI * 2.0),
            initialRadius: radius
        })
    }

    positionate(pos: Vector3) {
        this.position.copy(pos)
        this.mesh?.lookAt(ZeroVector3) // look at the center of the Runiverse
    }

    createLabel(address: string) {
        const name = truncateStringAtMiddle(address, 4, 4, 22)
        this.label = new SpriteText(name, 24, 'rgba(255, 255, 255, 0.6)')
        this.label.position.y = 42
        this.label.position.x = 0
        this.add(this.label)
    }

    public update(dt: number) {
        for(let flare of this.flares) {
            // todo: implement other animations
            flare.sprite.material.rotation += dt * flare.direction * flare.speed
            flare.sprite.scale.setScalar(flare.initialRadius + 0.5 * Math.sin(
                flare.speed * flare.life + flare.phase
            ))
            flare.life += dt;
        }
    }

    public dispose() {
        this.label = undefined
        this.parent?.remove(this)
    }
}
