import { Connection, PublicKey, SystemProgram, TransactionInstruction, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Wallet } from '../types';
import { ClaimFarmedInstructionParams, WITHDRAW_FARMED_INSTRUCTION_LAYOUT } from '../farming';
import { account, instructionDiscriminator } from '../utils';

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

/**
 * Create withdrawFarmed instruction
 */

export const withdrawFarmedInstruction = (params: ClaimFarmedInstructionParams): TransactionInstruction => {
  const {
    poolPublicKey, farmingCalc, farmingState, farmingTokenVault, poolSigner, userFarmingTokenAccount,
    userKey, programId,
  } = params
  const data = Buffer.alloc(WITHDRAW_FARMED_INSTRUCTION_LAYOUT.span)
  WITHDRAW_FARMED_INSTRUCTION_LAYOUT.encode(
    {
      instruction: instructionDiscriminator('withdraw_farmed'),
    },
    data,
  );

  const keys = [
    account(poolPublicKey),
    account(farmingState),
    account(farmingCalc, true),
    account(farmingTokenVault, true),
    account(poolSigner),
    account(userFarmingTokenAccount, true),
    account(userKey, false, true),
    account(TOKEN_PROGRAM_ID),
    account(SYSVAR_CLOCK_PUBKEY),
  ]

  return new TransactionInstruction({
    programId,
    keys,
    data,
  });
}

