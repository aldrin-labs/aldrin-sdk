import { Wallet } from '@project-serum/anchor'
import { PublicKey, Transaction } from '@solana/web3.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

interface CreateAccountParams {
  wallet: Wallet
  mint: PublicKey
}

interface CreateAccountResponse {
  transaction: Transaction
  newAccountPubkey: PublicKey
}

export async function createTokenAccountTransaction({
  wallet,
  mint,
}: CreateAccountParams): Promise<CreateAccountResponse> {
  const ata = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    wallet.publicKey
  )

  const transaction = new Transaction()
  transaction.add(
    Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      ata,
      wallet.publicKey,
      wallet.publicKey
    )
  )
  return {
    transaction,
    newAccountPubkey: ata,
  }
}