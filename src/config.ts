import {NetworkId} from "@/provider/midgard/midgard";

export const Config = {
    Network: NetworkId.Mainnet,
    MaxPagesOfActions: 2,
    RealtimeScannerTickIntervalSec: 5,
    RealtimeScannerSuppressErrors: false,  // for debug!
    MaxAgeOfPendingTxSec: 12 * 60 * 60,
    IgnoreOldTransactions: false,
}
