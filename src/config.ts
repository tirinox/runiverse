export enum NetworkId {
    TestnetMultiChain = 'testnet-multi',
    ChaosnetSingleBep2 = 'chaosnet-bep2',
    ChaosnetMultiChain = 'chaosnet-multi',
    Mainnet = ChaosnetMultiChain,
}


export const Config = {
    RealtimeScanner: {
        Network: NetworkId.Mainnet,
        MaxPagesOfActions: 2,
        SuppressErrors: false,
        TickIntervalSec: 5,
        MaxAgeOfPendingTxSec: 12 * 60 * 60,
        IgnoreOldTransactions: false,
        FetchAttempts: 3,
    },

    Tx: {
        InitialSpeed: 50
    },

    Animations: {
        MaxDeltaTimeOfFrame: 0.5,
        ProximityDistance: 15.0
    },

    SimpleScene: {
        Core: {
            Radius: 140.0
        }
    },

    getMidgardBaseUrl(networkId: NetworkId): string {
        if (networkId === NetworkId.TestnetMultiChain) {
            return `https://testnet.midgard.thorchain.info`
        } else if (networkId === NetworkId.ChaosnetSingleBep2) {
            return `https://chaosnet-midgard.bepswap.com`
        } else if (networkId === NetworkId.ChaosnetMultiChain) {
            return 'https://midgard.thorchain.info'
        } else {
            alert(`Network "${networkId}" is not supported!`)
        }
        return ''
    },

}
