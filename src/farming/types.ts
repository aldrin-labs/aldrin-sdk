import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { WithWallet } from '../pools/types'
import { PoolVersion } from '../types'

export interface GetFarmingStateParams {
  stakeMint?: PublicKey
  farms?: PublicKey[]
}

export interface GetFarmersParams {
  farm?: PublicKey
  authority?: PublicKey
}

export interface GetFarmingCalcParams {
  farmingState?: PublicKey
  userKey?: PublicKey
  poolVersion?: PoolVersion
}

export interface StartFarmingCommons {
  farm: PublicKey
  tokenAmount: BN
}

export interface TakeSnapshotInstructionParams {
  farm: PublicKey
  stakeVault: PublicKey
}

export interface StartFarmingParams extends StartFarmingCommons, WithWallet { }

export interface StartFarmingInstructionParams extends StartFarmingCommons {
  walletAuthority: PublicKey
  stakeWallet: PublicKey
  stakeVault: PublicKey
}

export interface AttachedFarmingState {
  farmingState: PublicKey
  lastWithdrawTime: number
  lastVestedWithdrawTime: number
}

export interface StopfarmingCommons {
  farm: PublicKey
  unstakeMax: BN
}

export interface StopFarmingInstructionParams extends StopfarmingCommons {
  authority: PublicKey,
  stakeWallet: PublicKey
}

export interface StopFarmingParams extends StopfarmingCommons, WithWallet {
}

export interface ClaimFarmedParams extends WithWallet {
  farm: PublicKey
}

export interface ClaimElegibleHarvestRestAccount {
  userRewardAccount: PublicKey
  harvestVaultAccount: PublicKey
}

export interface ClaimEligibleHarvestInstructionParams {
  authority: PublicKey
  farm: PublicKey
  restAccounts: ClaimElegibleHarvestRestAccount[]
}

export interface Harvest {
  mint: PublicKey;
  vault: PublicKey;
  periods: HarvestPeriod[]
}

export interface HarvestPeriod {
  tps: BN
  startsAt: BN
  endsAt: BN
}

export interface Snapshot {
  staked: BN
  startedAt: BN
}

export interface Snapshots {
  ringBuffer: Snapshot[];
  ringBufferTip: BN
}

export interface Farm {
  padding: Uint8Array
  admin: PublicKey
  stakeMint: PublicKey
  stakeVault: PublicKey
  harvests: Harvest[]
  snapshots: Snapshots
  minSnapshotWindowSlots: BN
}

export interface FarmWithPubKey extends Farm {
  publicKey: PublicKey
}

export interface AvailableHarvest {
  mint: PublicKey
  tokens: BN
}

export interface Farmer {
  padding: Uint8Array
  authority: PublicKey
  farm: PublicKey
  staked: BN
  vested: BN
  vestedAt: BN
  calculateNextHarvestFrom: BN
  harvests: AvailableHarvest[]
}

export interface FarmerWithPubKey extends Farmer {
  publicKey: PublicKey
}
