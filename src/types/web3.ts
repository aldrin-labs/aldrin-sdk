import {
  Connection,
  PublicKey,
  Transaction,
  GetProgramAccountsConfig,
  GetProgramAccountsFilter,
  Commitment,
  SendOptions,
  AccountInfo,
  ParsedAccountData
} from '@solana/web3.js';

export interface BaseWallet {
  publicKey: PublicKey | null;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}

export interface WalletAdapter extends BaseWallet {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  connected: boolean;
  sendTransaction(
    transaction: Transaction,
    connection: Connection,
    options?: SendOptions
  ): Promise<string>;
}

// Re-export types from @solana/web3.js
export type {
  GetProgramAccountsConfig,
  GetProgramAccountsFilter,
  Commitment,
  AccountInfo,
  ParsedAccountData,
  Connection,
  PublicKey,
  Transaction,
  SendOptions
};

export type ProgramAccount<T = AccountInfo<Buffer | ParsedAccountData>> = {
  pubkey: PublicKey;
  account: T;
};
