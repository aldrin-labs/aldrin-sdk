import { RpcResponseAndContext, SimulatedTransactionResponse } from '@solana/web3.js'
import { SendTransactionParams } from '.'
import { log } from '../utils'


export async function simulateTransaction({
  transaction,
  wallet,
  connection,
  partialSigners,
}: SendTransactionParams): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
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

  return await connection.simulateTransaction(transactionFromWallet, partialSigners, true)


}
