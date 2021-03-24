import * as THREE from "three";
import {Scene} from "three";
import {EventType, PoolChangeType, ThorEvent, ThorEventListener} from "@/provider/types";
import {PoolDetail} from "@/provider/midgard";
import {WireframeGeometry2} from "three/examples/jsm/lines/WireframeGeometry2";
import {LineMaterial} from "three/examples/jsm/lines/LineMaterial";
import {Wireframe} from "three/examples/jsm/lines/Wireframe";

export default class SimpleScene implements ThorEventListener {
    private scene: Scene;
    private poolMeshes: Record<string, THREE.Object3D> = {}
    private geo20?: WireframeGeometry2;
    private matLine?: LineMaterial;

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

    private createPoolMesh() {

    }

    initScene() {
        let scene = this.scene

        let geo20 = new THREE.IcosahedronGeometry(30, 1);
        this.geo20 = new WireframeGeometry2(geo20);

        this.matLine = new LineMaterial({
            color: 0x4080ff,
            linewidth: 5,
            dashed: false
        });
        this.matLine.resolution.set( window.innerWidth, window.innerHeight );
    }

    isTherePoolMesh(poolName: string): boolean {
        return poolName in this.poolMeshes
    }

    private addNewPoolMesh(pool: PoolDetail) {
        if (this.isTherePoolMesh(pool.asset)) {
            return
        }
        let wireframe = new Wireframe( this.geo20, this.matLine );
        wireframe.computeLineDistances();
        wireframe.scale.set( 1, 1, 1 );

        wireframe.position.x = Math.random() * 2 - 1;
        wireframe.position.y = Math.random() * 2 - 1;
        wireframe.position.z = Math.random() * 2 - 1;
        wireframe.position.normalize();
        wireframe.position.multiplyScalar( 1000 );

        this.scene.add( wireframe );
    }

    private removePoolMesh(pool: PoolDetail) {
        const mesh: THREE.Object3D = this.poolMeshes[pool.asset]
        if(mesh) {
            mesh.parent?.remove(mesh)
            delete this.poolMeshes[pool.asset]
        }
    }

    receiveEvent(e: ThorEvent): void {
        if (e.eventType == EventType.ResetAll) {
            console.log('booms! reset all')
            this.removeAllPoolMeshes()
        } else if (e.eventType == EventType.UpdatePool) {
            console.log(e)
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