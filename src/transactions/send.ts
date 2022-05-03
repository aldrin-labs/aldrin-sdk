import { log } from '../utils'
import { SendTransactionParams, SendTransactionsParams } from './types'

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

  transaction.feePayer = wallet.publicKey

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


export async function sendTransactions({
  transactionsAndSigners,
  wallet,
  connection,
}: SendTransactionsParams): Promise<string[]> {
  const blockHash = await connection.getRecentBlockhash('max')


  transactionsAndSigners.forEach((t) => {
    t.transaction.recentBlockhash = blockHash.blockhash
    if (t.partialSigners) {
      t.transaction.partialSign(...t.partialSigners)
    }

    if (!wallet.publicKey) {
      throw new Error(`No publicKey for wallet: ${wallet}`)
    }

    t.transaction.feePayer = wallet.publicKey

  })
  log('Transaction signers', wallet)


  const transactionsFromWallet = await wallet.signAllTransactions(transactionsAndSigners.map((t) => t.transaction))

  const rawTransactions = transactionsFromWallet.map((t) => t.serialize())

  const txids = await Promise.all(rawTransactions.map((t) => connection.sendRawTransaction(t, {
    skipPreflight: true,
  })))

  log('Transactions sent: ', txids)

  return txids

}
