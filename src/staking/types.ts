import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { WithPoolPK } from '../pools'
import {PoolVersion, Wallet} from '../types'
import {StakingPoolInfoResponse} from '../api/types';
import {AttachedFarmingState} from '../farming';

export interface StakingCommons extends WithPoolPK {
  farmingState: PublicKey
  stakingVault: PublicKey
  userStakingTokenAccount: PublicKey
  tokenAmount: BN
}

export interface UnstakingCommons extends WithPoolPK {
  farmingState: PublicKey
  stakingVault: PublicKey
  userStakingTokenAccount: PublicKey
  lpTokenFreezeVault: PublicKey
  poolSigner: PublicKey
  stakingSnapshots: PublicKey
}

export interface StakingInstructionParams extends StakingCommons {
  userKey: PublicKey
  stakingTicket: PublicKey
  programId: PublicKey
}

export interface UnstakingInstructionParams extends UnstakingCommons {
  userKey: PublicKey
  stakingTicket: PublicKey
  programId: PublicKey
}

export interface StartStakingParams {
  wallet: Wallet
  tokenAmount: BN
}

export interface EndStakingParams {
  wallet: Wallet
}

export interface EndStakingTicketParams {
  wallet: Wallet
  poolPublicKey: PublicKey
  farmingState: PublicKey
  stakingSnapshots: PublicKey
  stakingVault: PublicKey
  userStakingTokenAccount: PublicKey
  poolSigner: PublicKey
  stakingTicket: PublicKey
}

export interface GetStakingTicketsParams {
  userKey?: PublicKey
  poolVersion?: PoolVersion
}

export interface StakingTicket {
  tokensFrozen: BN
  startTime: BN
  endTime: BN // Could be infinity
  userKey: PublicKey
  pool: PublicKey
  nextAttached: BN
  statesAttached: AttachedFarmingState[]
  stakingTicketPublicKey: PublicKey
}

export interface ClaimParams {
  wallet: Wallet
  stakingPool: StakingPoolInfoResponse
}
