import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { WithPoolPK } from './pools'

export type GetFarmingStateParams = WithPoolPK

export interface FarmingSnapshotBase<L> {
  tokensUnlocked: BN
  tokensPerPeriod: BN
  tokensTotal: BN
  vestingType: number
  periodLength: L
  noWithdrawalTime: L
  vestingPeriod: L
  startTime: L
  currentTime: L
  pool: PublicKey
  farmingTokenVault: PublicKey
  farmingSnapshots: PublicKey
}

export type FarmingSnapshotRpcResponse = FarmingSnapshotBase<BN>

export interface StartFarminParams extends WithPoolPK {
  farmingState: PublicKey
  lpTokenFreezeVault: PublicKey
  lpTokenAccount: PublicKey
  tokenAmount: BN
}
