import { Wallet } from '@project-serum/anchor'
import { Connection, Signer, Transaction } from '@solana/web3.js'
import { log } from '..'

export interface SendTransactionParams {
  transaction: Transaction
  wallet: Wallet
  connection: Connection
  timeout?: number
  partialSigners?: Signer[]
}


export async function sendTransaction({
  transaction,
  wallet,
  connection,
  partialSigners,
}: SendTransactionParams): Promise<string> {
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash('max')
  ).blockhash

  log('Transaction signers', wallet)

  if (!wallet.publicKey) {
    throw new Error(`No publicKey for wallet: ${wallet}`)
  }

  transaction.feePayer = wallet.payer.publicKey

  if (partialSigners) {
    transaction.partialSign(...partialSigners)
  }

  const transactionFromWallet = await wallet.signTransaction(transaction)

  const rawTransaction = transactionFromWallet.serialize()

  const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
  })

  log('Transaction sent: ', txid)

  return txid

}
