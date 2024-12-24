import { Connection, PublicKey, Transaction } from '@solana/web3.js';

export interface WalletAdapter {
  publicKey: PublicKey | null;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  connected: boolean;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  sendTransaction(transaction: Transaction, connection: Connection): Promise<string>;
}

export function wrapWallet(wallet: {
  publicKey: PublicKey | null;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}): WalletAdapter {
  return {
    ...wallet,
    connect: async () => {},
    disconnect: async () => {},
    connected: wallet.publicKey !== null,
    sendTransaction: async (transaction: Transaction, connection: Connection) => {
      const signed = await wallet.signTransaction(transaction);
      return connection.sendRawTransaction(signed.serialize());
    }
  };
}
