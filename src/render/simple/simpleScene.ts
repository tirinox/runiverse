import * as THREE from "three";
import {Font, Scene} from "three";
import {EventType, PoolChangeType, ThorEvent, ThorEventListener} from "@/provider/types";
import {PoolDetail} from "@/provider/midgard";
import {WireframeGeometry2} from "three/examples/jsm/lines/WireframeGeometry2";
import {Wireframe} from "three/examples/jsm/lines/Wireframe";

export default class SimpleScene implements ThorEventListener {
    private scene: Scene;


    private poolMeshes: Record<string, THREE.Object3D> = {}

    private font?: THREE.Font;
    private materialEnabled?: THREE.MeshBasicMaterial;
    private materialDisabled?: THREE.MeshBasicMaterial;
    private geo20?: THREE.IcosahedronGeometry;

    constructor(scene: Scene) {
        this.scene = scene
    }

    private removeAllPoolMeshes() {
        for (const key of Object.keys(this.poolMeshes)) {
            const mesh: THREE.Object3D = this.poolMeshes[key]
            mesh.parent?.remove(mesh)
        }
        this.poolMeshes = {}
    }

    private removePoolMesh(pool: PoolDetail) {
        const mesh: THREE.Object3D = this.poolMeshes[pool.asset]
        if (mesh) {
            mesh.parent?.remove(mesh)
            delete this.poolMeshes[pool.asset]
            console.info(`delete pool mesh ${pool.asset}`)
        }
    }

    isTherePoolMesh(poolName: string): boolean {
        return poolName in this.poolMeshes
    }

    private async addNewPoolMesh(pool: PoolDetail) {
        if (this.isTherePoolMesh(pool.asset)) {
            return
        }

        const material = pool.isEnabled ? this.materialEnabled : this.materialDisabled

        let wireframe = new THREE.Mesh(this.geo20, material)

        wireframe.scale.set(1, 1, 1);

        wireframe.position.x = Math.random() * 2 - 1;
        wireframe.position.y = Math.random() * 2 - 1;
        wireframe.position.z = Math.random() * 2 - 1;
        wireframe.position.normalize();
        wireframe.position.multiplyScalar(500);

        this.scene.add(wireframe);
        this.poolMeshes[pool.asset] = wireframe

        const textMesh = await this.addLabel(pool.asset)
        textMesh.position.y = 50
        textMesh.position.x = -40
        wireframe.add(textMesh)

        // console.info(`add new mesh for ${pool.asset}`)1
    }

    loadFont(url: string): Promise<Font> {
        return new Promise(resolve => {
            new THREE.FontLoader().load(url, resolve);
        });
    }

    async addLabel(name: string): Promise<THREE.Mesh> {
        if (!this.font) {
            const loader = new THREE.FontLoader()
            this.font = await loader.loadAsync('fonts/helvetiker_bold.typeface.json')
        }

        const textGeo = new THREE.TextGeometry(name, {
            font: this.font!,
            size: 16,
            height: 1,
            curveSegments: 1
        });

        const textMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
        return new THREE.Mesh(textGeo, textMaterial)
    }


    initScene() {
        let scene = this.scene

        this.geo20 = new THREE.IcosahedronGeometry(50, 1);


        this.materialEnabled = new THREE.MeshBasicMaterial({
            color: 0x4080ff,
            reflectivity: 0.1,
        });

        this.materialDisabled = new THREE.MeshBasicMaterial({
            color: 0xff6060,
            reflectivity: 0.1,
        });
    }

    onResize(w: number, h: number) {

    }

    receiveEvent(e: ThorEvent): void {
        if (e.eventType == EventType.ResetAll) {
            console.log('booms! reset all')
            this.removeAllPoolMeshes()
        } else if (e.eventType == EventType.UpdatePool) {
            const change = e.poolChange!

            if (change.type == PoolChangeType.Removed) {
                this.removePoolMesh(change.previousPool!)
            } else {
                if (!this.isTherePoolMesh(change.pool!.asset)) {
                    this.addNewPoolMesh(change.pool!)
                }
            }
        }
    }
}