export enum NetworkId {
    TestnetMultiChain = 'testnet-multi',
    ChaosnetSingleBep2 = 'chaosnet-bep2',
    ChaosnetMultiChain = 'chaosnet-multi',
    Mainnet = ChaosnetMultiChain,
}

export const DataSourcePlayback = 'playback'
export const DataSourceRealtime = 'realtime'
export const DataSourceNone = 'none'

export const Config = {
    DataSource: DataSourceNone,

    Playback: {
        File: './records/example1_v2.json',
        SpeedMult: 5.0,
        WaitFirstEvent: false
    },

    Debug: {
        SceneName: 'PoolObjectSoloDebug'
    },

    RealtimeScanner: {
        Network: NetworkId.Mainnet,
        MaxPagesOfActions: 2,
        SuppressErrors: false,
        TickIntervalSec: 5,
        MaxAgeOfPendingTxSec: 12 * 60 * 60,
        IgnoreOldTransactions: false,
        FetchAttempts: 3,
    },

    Animations: {
        MaxDeltaTimeOfFrame: 0.5,
        ProximityDistance: 35.0  // todo: move to PoolObject/WalletObject
    },

    Physics: {
        Gravity: {
            Constant: 1e5,
            LongDistConstant: 0.0001,
        },
        MaxSpeed: 1e8,
        DistanceLimit: 2e8,
    },

    Camera: {
        MinDistance: 1000,
        StartDistance: 1500,
        MaxDistance: 7000,
        FOV: 60,
        Damp: 0.2,
        Far: 10000,
        Near: 1,
    },

    Scene: {
        Core: {
            Scale: 3.0,
            Radius: 380.0,
            Color: 0x202520,
            Simplified: false,
        },
        PoolObject: {
            MaxPoolNameLength: 14,
            Mass: 10000,
            InitialScale: 0.2,
            Speed: {
                CenterGauss: 0.06,
                ScaleGauss: 0.04
            },
            Staged: {
                Distance: {
                    CenterGauss: 2500.0,
                    ScaleGauss: 770.0
                }
            },
            Enabled: {
                Distance: {
                    CenterGauss: 1400.0,
                    ScaleGauss: 100.0
                }
            },
            InnerOrbitRadius: 85.0,
            InnerOrbitSpeed: 2.1,
            Glow: {
                Enabled: true,
                Radius: 220.0,
                RadiusVar: 20.0,
                PosVar: 0.0,
            },
            SphereResolution: 150,
            BallShader: {
                BaseSpeed: 0.3,
                RepeatS: 1.0,
                RepeatT: 1.0,
                NoiseScale: 0.5, // magnitude of noise effect
                BlendOffset: 0.0, // adjust lightness/darkness of blended texture
                BlendSpeed: 0.2, // multiplier for distortion speed
                BumpSpeed: 0.1, // multiplier for distortion speed
                BumpScale: 30.0, // magnitude of normal displacement
            },
            Mesh: {
                RotationVar: 2.0,
            }
        },
        TxObject: {
            DissipationOfSpeed: 0.4, // 0.2
            RepelFactor: 1e-6,
            InitialSpeed: 1440.0,
            Mass: 100.0,
            ScaleConst: 5.5,
            ScalePower: 0.25,
            RotationSpeedGaussMagnitude: 42.0
        },
        Cubemap: {
            Enabled: true,
            // Name: "starry_cubemap_debug",
            Name: "starry_cubemap_1",
            RenderResolution: 2048,
        },
        Postprocessing: {
            Bloom: {
                Enabled: false,
                Threshold: 0.0,
                Strength: 0.5,
                Radius: 0.5,
            }
        }
    },

    Logging: {
        Visual: {
            Enabled: true,
            MaxRows: 12,
            FadeTime: 2.5,
        },
        FPSCounter: true
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

    GlobalMutableState: {
        PoolLabelVisisble: false
    }
}
