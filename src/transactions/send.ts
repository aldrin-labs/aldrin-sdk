import { Wallet } from "@project-serum/anchor"
import { Connection, Transaction } from "@solana/web3.js"

export interface SendTransactionParams {
  transaction: Transaction
  wallet: Wallet
  connection: Connection
  timeout?: number
}

export async function sendTransaction({
  transaction,
  wallet,
  connection,
}: SendTransactionParams): Promise<string> {
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash('max')
  ).blockhash

  console.log('Transaction signers', wallet)

  if (!wallet.publicKey) {
    throw new Error(`No publicKey for wallet: ${wallet}`)
  }

  transaction.feePayer = wallet.payer.publicKey

  const transactionFromWallet = await wallet.signTransaction(transaction)

  const rawTransaction = transactionFromWallet.serialize()

  const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
  })

  console.log('Transaction sent: ', txid)

  return txid

}
