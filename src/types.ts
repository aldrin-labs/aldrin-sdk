import { Keypair, PublicKey, Transaction } from '@solana/web3.js';

export interface Wallet {
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  publicKey: PublicKey;
  payer: Keypair
}


export interface TokenSwapClaimFarmedParams {
  wallet?: Wallet
  poolMint: PublicKey
}
