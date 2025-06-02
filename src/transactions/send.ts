import { Connection, Transaction, Keypair } from '@solana/web3.js';
import type { WalletAdapter } from '../types/web3';
import { wrapWallet } from './wallet-adapter';
import { log } from '../utils';

export interface SendTransactionParams {
  transaction: Transaction;
  wallet: WalletAdapter;
  connection: Connection;
  timeout?: number;
  partialSigners?: Keypair[];
}

export async function sendTransaction({
  transaction,
  wallet: rawWallet,
  connection,
  partialSigners,
}: SendTransactionParams): Promise<string> {
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash('max')
  ).blockhash;

  log('Transaction signers', rawWallet);

  if (!rawWallet.publicKey) {
    throw new Error(`No publicKey for wallet: ${rawWallet}`);
  }

  transaction.feePayer = rawWallet.publicKey;

  if (partialSigners) {
    transaction.partialSign(...partialSigners);
  }

  const wallet = wrapWallet(rawWallet);
  const transactionFromWallet = await wallet.signTransaction(transaction);

  const rawTransaction = transactionFromWallet.serialize();

  const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
  });

  log('Transaction sent: ', txid);

  return txid;
}
