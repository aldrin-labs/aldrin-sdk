import { PublicKey, Transaction } from '@solana/web3.js';
import BN from 'bn.js'

export interface Wallet {
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  publicKey: PublicKey;
}


export interface TokenSwapClaimFarmedParams {
  wallet?: Wallet
  poolMint: PublicKey
}

export interface WithReferral {
  referralAccount: PublicKey
  referralPercent: number
  createTokenAccounts?: boolean // Allow to create token accounts (take additional rental fee)
}

export type PoolVersion = 1 | 2

export enum SIDE {
  BID = 1,
  ASK = -1,
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
