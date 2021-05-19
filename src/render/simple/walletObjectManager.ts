import {WalletObject} from "@/render/simple/walletObject";
import {ThorTransaction} from "@/provider/midgard/tx";
import {Transaction} from "@/provider/midgard/v2";
import {Object3D} from "three";
import {hashToPolarCoordinates, polarToXYZ} from "@/helpers/3d";
import VisualLog from "@/components/elements/VisualLog.vue";
import * as crypto from "crypto-js";


export class WalletObjectManager {
    private walletObjects: Record<string, WalletObject> = {}
    private friendList: Record<string, Array<string>> = {}

    public scene?: Object3D

    private AddressRadius = 4000.0

    public makeWalletsFromTx(tx: ThorTransaction) {
        const subTxs = [...tx._in, ...tx.out]
        let coins = []

        for (const subTx of subTxs) {
            if(subTx.address && subTx.coins.length > 0) {
                this.updateWallet(subTx)
            }

            for (const coin of subTx.coins) {
                coins.push(coin)
            }
        }
    }

    private makeNewWalletObj(address: string) {
        const newWalletObj = new WalletObject(address)

        this.scene?.add(newWalletObj.obj!)

        const addressHash = crypto.SHA256(address).toString(crypto.enc.Hex)
        const pos = polarToXYZ(hashToPolarCoordinates(addressHash, this.AddressRadius))
        newWalletObj.positionate(pos)

        this.walletObjects[address] = newWalletObj

        VisualLog.log(`New wallet ${address}.`)
    }

    private updateWallet(subTx: Transaction) {
        if(!this.isThereAddress(subTx.address)) {
            this.makeNewWalletObj(subTx.address)
        } else {
            this.findWalletByAddress(subTx.address)!.updateDate()
        }
    }

    public isThereAddress(address: string): boolean {
        return address in this.walletObjects
    }

    public findWalletByAddress(address: string): WalletObject | undefined {
        return this.walletObjects[address]
    }

    public update(dt: number) {

    }

    private addFriend(oldFriend: string, newFriend: string) {
        // todo!
    }
}
