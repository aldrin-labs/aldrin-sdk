import { PublicKey, Transaction } from '@solana/web3.js';

export interface Wallet {
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  publicKey: PublicKey;
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
