import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { WalletAdapter } from '../types/web3';
import { Wallet } from '../types';

export interface BaseWallet {
  publicKey: PublicKey | null;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}

export function wrapWallet(wallet: Wallet | BaseWallet): WalletAdapter {
  // If the wallet already has all the WalletAdapter properties, return it directly
  if (
    'connect' in wallet && 
    'disconnect' in wallet && 
    'connected' in wallet && 
    'sendTransaction' in wallet &&
    typeof wallet.connect === 'function' &&
    typeof wallet.disconnect === 'function' &&
    typeof wallet.sendTransaction === 'function'
  ) {
    return wallet as WalletAdapter;
  }
  
  // Create a WalletAdapter from the wallet, using any existing optional properties
  return {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction.bind(wallet),
    signAllTransactions: wallet.signAllTransactions.bind(wallet),
    connect: 'connect' in wallet && typeof wallet.connect === 'function' 
      ? wallet.connect.bind(wallet) 
      : async () => {},
    disconnect: 'disconnect' in wallet && typeof wallet.disconnect === 'function'
      ? wallet.disconnect.bind(wallet)
      : async () => {},
    connected: 'connected' in wallet && typeof wallet.connected === 'boolean'
      ? wallet.connected
      : wallet.publicKey !== null,
    sendTransaction: 'sendTransaction' in wallet && typeof wallet.sendTransaction === 'function'
      ? wallet.sendTransaction.bind(wallet)
      : async (transaction: Transaction, connection: Connection) => {
          const signed = await wallet.signTransaction(transaction);
          return connection.sendRawTransaction(signed.serialize());
        },
  };
}
