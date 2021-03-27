import * as THREE from "three";
import {Font, log, Scene} from "three";
import {EventType, PoolChangeType, ThorEvent, ThorEventListener, TxEventType} from "@/provider/types";
import {PoolDetail} from "@/provider/midgard/poolDetail";
import {ThorTransaction} from "@/provider/midgard/tx";
import {randomPointOnSphere} from "@/helpers/3d";

export default class SimpleScene implements ThorEventListener {
    private scene: Scene;

    private poolMeshes: Record<string, THREE.Object3D> = {}
    private txMeshes: Record<string, THREE.Object3D> = {}

    private font?: THREE.Font;
    private geo20?: THREE.IcosahedronGeometry;
    private geoBox?: THREE.BoxGeometry;

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
            console.debug(`delete pool mesh ${pool.asset}`)
        }
    }

    isTherePoolMesh(poolName: string): boolean {
        return poolName in this.poolMeshes
    }

    scaleFromPool(pool: PoolDetail): number {
        return Math.pow(pool.runeDepth.toNumber(), 0.11) / 20
    }

    private async addNewPoolMesh(pool: PoolDetail) {
        if (this.isTherePoolMesh(pool.asset)) {
            return
        }

        const enabled = pool.isEnabled

        let color = new THREE.Color()
        color.setHSL(Math.random(), enabled ? 1.0 : 0.0, enabled ? 0.5 : 0.3)
        const material = new THREE.MeshBasicMaterial({
            color: color,
            reflectivity: 0.1,
        });

        let wireframe = new THREE.Mesh(this.geo20, material)

        wireframe.scale.setScalar(this.scaleFromPool(pool))
        wireframe.position.add(randomPointOnSphere(enabled ? 600 : 1200))

        this.scene.add(wireframe);
        this.poolMeshes[pool.asset] = wireframe

        const textMesh = await this.addLabel(pool.asset)
        textMesh.position.y = 50
        textMesh.position.x = -40
        wireframe.add(textMesh)

        console.debug(`add new mesh for ${pool.asset}`)
    }

    private heartBeat(pool: PoolDetail) {
        const factor = 1.05
        const mesh = this.poolMeshes[pool.asset]
        const oldScale = mesh.scale.x
        mesh.scale.setScalar(oldScale * factor)
        setTimeout(() => mesh.scale.setScalar(oldScale), 500)
    }

    // -------- tx meshes -------

    createTransactionMesh(tx: ThorTransaction) {
        const material = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            reflectivity: 0.5,
        });

        let txMesh = new THREE.Mesh(this.geoBox, material)

        const position = randomPointOnSphere(3000)
        txMesh.position.add(position)
        this.scene.add(txMesh)
    }

    destoryTransactionMesh(tx: ThorTransaction) {

    }

    updateTransactionMeshStatus(tx: ThorTransaction) {

    }

    isThereTxMesh(txID: string): boolean {
        return txID in this.txMeshes
    }

    // ------ event routing -------

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
                if (change.type == PoolChangeType.DepthChanged) {
                    this.heartBeat(change.pool!)
                }
            }
        } else if (e.eventType == EventType.Transaction) {
            const ev = e.txEvent!
            if (ev.type == TxEventType.Add) {
                this.createTransactionMesh(ev.tx)
            } else if (ev.type == TxEventType.Destroy) {
                this.destoryTransactionMesh(ev.tx)
            } else if (ev.type == TxEventType.StatusUpdated) {
                this.updateTransactionMeshStatus(ev.tx)
            }
        }
    }

    // --------- init & load & service -----

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

    loadFont(url: string): Promise<Font> {
        return new Promise(resolve => {
            new THREE.FontLoader().load(url, resolve);
        });
    }

    initScene() {
        this.geo20 = new THREE.IcosahedronGeometry(50, 1);
        this.geoBox = new THREE.BoxGeometry(5, 5, 5)
    }

    onResize(w: number, h: number) {
    }
}