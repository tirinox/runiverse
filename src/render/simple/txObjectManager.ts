import VisualLog from "@/components/elements/VisualLog.vue";
import {Object3D, Vector3} from "three";
import {ThorTransaction} from "@/provider/midgard/tx";
import {TxObject, TxState} from "@/render/simple/txObject";
import {IPoolQuery, IWalletQuery} from "@/render/simple/interface";
import {randomPointOnSphere, ZeroVector3} from "@/helpers/3d";
import {ActionStatusEnum, ActionTypeEnum, Coin} from "@/provider/midgard/v2";
import {Config} from "@/config";
import {CoinName, convertToThorBigNumber, isRuneStr, parseThorBigNumber} from "@/provider/midgard/coinName";
import {truncStringTail} from "@/helpers/data_utils";

const NO_POOL = ''

interface TxObjectMeta {
    objects: Array<TxObject>,
    action: ThorTransaction,
    orbiting: boolean
}

export class TxObjectManager {
    public scene?: Object3D
    public poolMan?: IPoolQuery
    public walletMan?: IWalletQuery

    private txObjects: Record<string, TxObjectMeta> = {}

    private static someUnknownPlace() {
        return randomPointOnSphere(1e5)
    }

    public removeAll() {
        for(let txObjGroup of Object.values(this.txObjects)) {
            for(let txObj of txObjGroup.objects) {
                txObj.parent?.remove(txObj)
            }
        }
        this.txObjects = {}
    }

    private forceRepelAllPoolsExceptOne(poolName: string, txObj: TxObject): Vector3 {
        if (!this.poolMan) {
            return new Vector3()
        }

        const poolMass = Config.SimpleScene.PoolObject.Mass

        let force = new Vector3()
        for (const poolObj of this.poolMan?.allPools()) {
            const poolPos = poolObj.position!
            let forcePart: Vector3
            if (poolObj.pool?.asset! === poolName) {
                forcePart = txObj.myGravityTo(poolMass, poolPos)
            } else {
                forcePart = txObj.repelFrom(poolMass, poolPos, Config.SimpleScene.TxObject.RepelFactor)
                forcePart = ZeroVector3.clone()
            }
            force.add(forcePart)
        }
        force.clampLength(0.0, 1e6)
        return force
    }

    private updateTxState(txMeta: TxObjectMeta, txObj: TxObject) {
        const WalletMass = 1e3

        if (txObj.state == TxState.ToPool || txObj.state == TxState.CrossPool) {
            const targetPoolPos = this.poolMan?.getPoolByName(txObj.poolName)?.position
            if (targetPoolPos) {
                txObj.force = this.forceRepelAllPoolsExceptOne(txObj.poolName, txObj)

                if (txObj.isCloseToTarget(targetPoolPos)) {
                    this.onReachedPool(txMeta, txObj)
                }
            }
        } else if (txObj.state == TxState.ToWallet) {
            const targetPos = this.getWalletPosition(txObj.walletAddress)
            if (targetPos) {
                txObj.force = txObj.myGravityTo(WalletMass, targetPos)

                if (txObj.isCloseToTarget(targetPos)) {
                    this.onReachedWallet(txMeta, txObj)
                }
            } else {
                console.warn(`no wallet: ${txObj.walletAddress}`)
            }
        } else if (txObj.state == TxState.ToCore) {
            const targetPos = new Vector3()
            txObj.force = txObj.myGravityTo(1e3, targetPos)

            if (txObj.isCloseToTarget(targetPos)) {
                this.onReachedCore(txMeta, txObj)
            }
        }
    }

    private static isLastOneObject(txMeta: TxObjectMeta) {
        return txMeta.objects.length == 1
    }

    private createCrossPoolTxObject(txMeta: TxObjectMeta) {
        const inputCoin = txMeta.action._in[0].coins[0]
        const runesPerInputAsset = this.poolMan?.runesPerAsset(inputCoin.asset)!

        const pos = this.getPoolPosition(txMeta.action.pools[0]) ?? TxObjectManager.someUnknownPlace()
        const amount = convertToThorBigNumber(parseThorBigNumber(inputCoin.amount) * runesPerInputAsset)
        let newTxObj = this.createNewTxObject(
            txMeta.action,
            pos,
            {asset: CoinName.Rune, amount},
            TxState.CrossPool)
        if(newTxObj) {
            newTxObj.poolName = txMeta.action.pools[1]
            newTxObj.walletAddress = ''
        }
    }

    private createOutToWalletTxObject(txMeta: TxObjectMeta, poolName: string) {
        const tx = txMeta.action
        for (const outTx of tx.out) {
            let sourcePosition = this.getPoolPosition(poolName) ?? TxObjectManager.someUnknownPlace()
            let targetPosition = this.getWalletPosition(outTx.address) ?? TxObjectManager.someUnknownPlace()

            for (const coin of outTx.coins) {
                console.info(`emit ${truncStringTail(coin.asset, 20)} to wallet ${outTx.address}`)
                let newTxObj = this.createNewTxObject(tx, sourcePosition, coin, TxState.ToWallet)
                if (newTxObj) {
                    newTxObj.walletAddress = outTx.address
                    newTxObj.poolName = NO_POOL
                    newTxObj.dissipation = 0.00
                    newTxObj.setVelocityToDirection(targetPosition, Config.SimpleScene.TxObject.InitialSpeed)
                }
            }
        }
    }

    private onReachedPool(txMeta: TxObjectMeta, txObj: TxObject) {
        if (TxObjectManager.isLastOneObject(txMeta)) {
            // it is time to go to the next state
            if (txMeta.action.type == ActionTypeEnum.Swap) {
                if (txMeta.action.isDoubleSwap) {
                    if (txObj.state == TxState.CrossPool) {
                        this.createOutToWalletTxObject(txMeta, txObj.poolName)
                    } else {
                        this.createCrossPoolTxObject(txMeta)
                    }
                } else {
                    this.createOutToWalletTxObject(txMeta, txObj.poolName)
                }
            } else {
                this.createOutToWalletTxObject(txMeta, txObj.poolName)
            }
        }
        // we do not need the old TxObj anymore
        this.destroyTxObject(txMeta, txObj)
    }

    private onReachedWallet(txMeta: TxObjectMeta, txObj: TxObject) {
        this.destroyTxObject(txMeta, txObj)
        // todo: make boom?
    }

    private onReachedCore(txMeta: TxObjectMeta, txObj: TxObject) {
        if (TxObjectManager.isLastOneObject(txMeta)) {
            this.createOutToWalletTxObject(txMeta, NO_POOL)
        }
        this.destroyTxObject(txMeta, txObj)
    }

    public update(dt: number) {
        for (const txObjMeta of Object.values(this.txObjects)) {
            for (const txObjElement of txObjMeta.objects) {
                if (!txObjElement.waiting) {
                    txObjElement.update(dt)
                    this.updateTxState(txObjMeta, txObjElement)
                }
            }
        }
    }

    private calcRuneAmount(coin: Coin) {
        const amt = parseThorBigNumber(coin.amount)
        if (isRuneStr(coin.asset)) {
            return amt
        } else {
            const price = this.poolMan?.runesPerAsset(coin.asset) ?? 0.0
            return amt * price
        }
    }

    private createNewTxObject(tx: ThorTransaction, sourcePosition: Vector3, coin: Coin, state: TxState) {
        const hash = tx.realInputHash
        let txMeta = this.txObjects[hash!]
        if (!txMeta) {
            console.error('no TX meta for this tx', hash, coin)
            return
        }

        if (!this.scene) {
            console.error('no scene detected!')
            return
        }

        // if(state == TxState.Pool_to_Wallet) {
        //     console.warn('debug!')
        // }

        const runeAmount = this.calcRuneAmount(coin)
        if (!runeAmount) {
            console.warn('no value of tx object!', tx)
            return
        }

        const mass = Config.SimpleScene.TxObject.Mass * Math.log10(runeAmount)
        let txObject = new TxObject(mass, runeAmount, isRuneStr(coin.asset))
        txObject.position.copy(sourcePosition)
        txObject.dissipation = Config.SimpleScene.TxObject.DissipationOfSpeed
        txObject.state = state
        txObject.waiting = false

        let velocityDirection = randomPointOnSphere(1.0)
        txObject.setVelocityToDirection(velocityDirection, Config.SimpleScene.TxObject.InitialSpeed)

        this.scene.add(txObject)

        txMeta.objects.push(txObject)  // register it

        const coinName = truncStringTail(coin.asset, 20)
        VisualLog.log(`New Tx Obj ${coinName} state = ${state}`)

        return txObject
    }

    private getWalletPosition(address: string): Vector3 | undefined {
        return this.walletMan?.findWalletByAddress(address)?.position
    }

    public getPoolPosition(pool: string): Vector3 | undefined {
        return this.poolMan?.getPoolByName(pool)?.position
    }

    public createTransactionObjects(tx: ThorTransaction) {
        const hash = tx.realInputHash
        if (hash === null || tx.inputAddress === null) {
            return
        }

        if (this.isThereTxMesh(hash)) {
            this.updateTransactionMeshStatus(tx)
            return
        }

        let state: TxState
        if (tx.type == ActionTypeEnum.Switch) {
            state = TxState.ToCore
        } else {
            state = TxState.ToPool
        }

        // store in cache
        this.txObjects[hash] = {
            action: tx,
            objects: [],
            orbiting: tx.status == ActionStatusEnum.Pending,
        }

        for (const inTx of tx._in) {
            let sourcePosition = this.getWalletPosition(inTx.address) ?? TxObjectManager.someUnknownPlace()

            for (const coin of inTx.coins) {
                let txObj = this.createNewTxObject(tx, sourcePosition, coin, state)
                if(txObj) {
                    txObj.walletAddress = tx.inputAddress!
                    txObj.poolName = tx.pools.length > 0 ? tx.pools[0] : NO_POOL
                }
            }
        }
    }

    public updateTransactionMeshStatus(tx: ThorTransaction) {
        // todo!

        // const txObj = this.txObjects[tx.realInputHash]
        // if(txObj) {
        //     txObj.tx = tx
        // }
    }

    public destroyTxObject(txMeta: TxObjectMeta, txObj?: TxObject) {
        if (txObj) {
            txObj.parent?.remove(txObj)
            VisualLog.log(`deleting tx mesh: ${txObj.poolName}`)
            txMeta.objects = txMeta.objects.filter(o => o.uuid !== txObj.uuid)
            if (!txMeta.objects.length) {
                delete this.txObjects[txMeta.action.realInputHash!]
            }
        }
    }

    public destroyTransactionMesh(tx: ThorTransaction) {
        const hash = tx.realInputHash!
        const txMeta = this.txObjects[hash]
        if (txMeta) {
            for (const txObj of txMeta.objects) {
                this.destroyTxObject(txMeta, txObj)
            }
            delete this.txObjects[hash]
        }
    }

    public isThereTxMesh(txID: string): boolean {
        return txID in this.txObjects
    }
}
