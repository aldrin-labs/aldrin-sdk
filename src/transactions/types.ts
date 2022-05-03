import { Connection, Signer, Transaction } from '@solana/web3.js'
import { Wallet } from '../types'

interface TransactionBase {
  wallet: Wallet
  connection: Connection
  timeout?: number
}

export interface SendTransactionParams extends TransactionBase {
  transaction: Transaction
  partialSigners?: Signer[]
}

export interface SendTransactionsParams extends TransactionBase {
  transactionsAndSigners: {
    transaction: Transaction
    partialSigners?: Signer[]
  }[]
}
