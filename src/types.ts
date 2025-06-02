import { Connection, PublicKey, Transaction } from '@solana/web3.js';

export interface Wallet {
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  publicKey: PublicKey;
  // Optional properties for WalletAdapter compatibility
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  connected?: boolean;
  sendTransaction?: (transaction: Transaction, connection: Connection) => Promise<string>;
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

export interface TokenSwapGetFarmedParams {
  wallet: Wallet
  poolMint: PublicKey
}
