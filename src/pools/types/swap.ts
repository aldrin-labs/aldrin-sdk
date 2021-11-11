import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { WithAuhority, WithWallet } from '.';
import { LiquidityPool } from './pools';

export enum SIDE {
  BID = 1,
  ASK = -1
}

type SwapPool = LiquidityPool & { feePoolTokenAccount: PublicKey }

export interface SwapParams extends WithWallet {
  outcomeAmount: BN // Outcome for client - income for program 
  minIncomeAmount: BN // Income for client - outcome for program
  userBaseTokenAccount: PublicKey | undefined
  userQuoteTokenAccount: PublicKey | undefined
  side: SIDE
  pool: SwapPool
}

export interface SwapInstructionParams extends SwapParams, WithAuhority {
  userBaseTokenAccount: PublicKey
  userQuoteTokenAccount: PublicKey
}
