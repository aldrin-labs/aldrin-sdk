import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { WithWallet } from '../'
import { WithPoolPK } from '../pools'

export type GetFarmingStateParams = WithPoolPK

export interface GetFarmingTicketsParams {
  pool?: PublicKey
  userKey?: PublicKey
}

export interface FarmingState {
  tokensUnlocked: BN
  tokensPerPeriod: BN
  tokensTotal: BN
  vestingType: number
  periodLength: number
  noWithdrawalTime: number
  vestingPeriod: number
  startTime: number
  currentTime: number
  pool: PublicKey
  farmingTokenVault: PublicKey
  farmingSnapshots: PublicKey
  farmingStatePublicKey: PublicKey
}

export interface StartFarmingCommons extends WithPoolPK {
  farmingState: PublicKey
  lpTokenFreezeVault: PublicKey
  lpTokenAccount: PublicKey
  tokenAmount: BN
}

export interface StartFarmingParams extends StartFarmingCommons, WithWallet { }

export interface StartFarmingInstructionParams extends StartFarmingCommons {
  userKey: PublicKey
  farmingTicket: PublicKey
}

export interface AttachedFarmingState {
  farmingState: PublicKey
  lastWithdrawTime: number
  lastVestedWithdrawTime: number
}


export interface FarmingTicket {
  tokensFrozen: BN
  startTime: BN
  endTime: BN // Could be infinity
  userKey: PublicKey
  pool: PublicKey
  nextAttached: BN
  statesAttached: AttachedFarmingState[]
  farmingTicketPublicKey: PublicKey
}

export interface EndFarmingCommon extends WithPoolPK {
  farmingState: PublicKey
  farmingSnapshots: PublicKey
  farmingTicket: PublicKey
  lpTokenFreezeVault: PublicKey
  userPoolTokenAccount: PublicKey
}

export interface EndFarmingParams extends EndFarmingCommon, WithWallet {

}

export interface EndFarmingInstructionParams extends EndFarmingCommon {
  userKey: PublicKey,
  poolSigner: PublicKey
}

export interface FarmingSnapshot {
  /**
   * 
   * Rewards  
   * 
   * */

  tokensFrozen: BN

  /**
   * 
   * Total tokens
   * 
   * */
  farmingTokens: BN

  time: number
}

export interface FarmingSnapshotQueue {
  snapshots: FarmingSnapshot[]
  nextIndex: BN
  queuePublicKey: PublicKey
}


export interface GetFarmingRewardParams {
  state: FarmingState
  queue: FarmingSnapshotQueue[]
  ticket: FarmingTicket
}
