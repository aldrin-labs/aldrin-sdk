import { Connection, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { Wallet } from '../types';

interface CreateInstructionParams {
  wallet: Wallet
  size: number
  connection: Connection
  programId: PublicKey
  newAccountPubkey: PublicKey
}
export const createAccountInstruction = async (params: CreateInstructionParams): Promise<TransactionInstruction> => {
  const {
    wallet,
    size,
    connection,
    programId,
    newAccountPubkey,
  } = params

  return SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey,
    space: size,
    lamports: await connection.getMinimumBalanceForRentExemption(size),
    programId,
  });
}
