import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { CreateBasketPool } from './pools';

export enum SIDE {
  BID = 1,
  ASK = -1
}

type SwapPool = CreateBasketPool & { feePoolTokenAccount: PublicKey }

export interface SwapParams {
  outcomeAmount: BN // Outcome for client - income for program 
  minIncomeAmount: BN // Income for client - outcome for program
  baseTokenAccount: PublicKey | undefined
  quoteTokenAccount: PublicKey | undefined
  side: SIDE
  pool: SwapPool
}
