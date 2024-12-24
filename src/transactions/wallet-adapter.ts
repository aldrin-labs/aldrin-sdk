import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { WalletAdapter } from '../types/web3';

export interface BaseWallet {
  publicKey: PublicKey | null;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}

export function wrapWallet(wallet: BaseWallet): WalletAdapter {
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
