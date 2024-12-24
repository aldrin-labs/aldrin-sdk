import { Connection, PublicKey, Transaction, GetProgramAccountsConfig } from '@solana/web3.js';
export * from '@solana/web3.js';

export interface WalletAdapter {
  publicKey: PublicKey | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connected: boolean;
  sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>;
}

export interface ProgramAccountFilter {
  dataSize?: number;
  memcmp?: {
    offset: number;
    bytes: string;
  };
}
