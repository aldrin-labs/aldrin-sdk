import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { WithPoolPK, WithWallet } from '../pools'
import { Wallet } from '../types'

export interface StartStakingCommons extends WithPoolPK {
  farmingState: PublicKey
  stakingVault: PublicKey
  userStakingTokenAccount: PublicKey
  tokenAmount: BN
}

export interface StartStakingInstructionParams extends StartStakingCommons {
  userKey: PublicKey
  stakingTicket: PublicKey
  programId: PublicKey
}

export interface MakeStakingParams {
  wallet: Wallet
  stakingPool: any
  tokenAmount: BN
}
