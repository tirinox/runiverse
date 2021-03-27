import {NetworkId} from "@/provider/midgard/midgard";

export const Config = {
    Network: NetworkId.ChaosnetSingleBep2,
    MaxPagesOfActions: 2,
    RealtimeScannerTickIntervalSec: 5,
    MaxAgeOfPendingTxSec: 12 * 60 * 60
}
