import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import {
  StakingInstructionParams,
  STAKING_INSTRUCTION_LAYOUT,
  UnstakingInstructionParams,
  UNSTAKING_INSTRUCTION_LAYOUT,
} from '.';
import { account, instructionDiscriminator } from '../utils';

export class Staking {
  /**
   * Create start farming instruction
   * @param params
   * @returns
   */
  static stakingInstruction(params: StakingInstructionParams): TransactionInstruction {
    const data = Buffer.alloc(STAKING_INSTRUCTION_LAYOUT.span)
    const {
      poolPublicKey,
      farmingState,
      stakingVault,
      userStakingTokenAccount,
      userKey,
      tokenAmount,
      stakingTicket,
      programId,
    } = params

    STAKING_INSTRUCTION_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('start_farming'),
        tokenAmount,
      },
      data,
    );

    const keys = [
      account(poolPublicKey),
      account(farmingState),
      account(stakingTicket, true),
      account(stakingVault, true),
      account(userStakingTokenAccount, true),
      account(userKey, false, true),
      account(userKey, false, true),
      account(TOKEN_PROGRAM_ID),
      account(SYSVAR_CLOCK_PUBKEY),
      account(SYSVAR_RENT_PUBKEY),
    ]

    return new TransactionInstruction({
      programId,
      keys,
      data,
    });
  }

  static unstakingInstruction(params: UnstakingInstructionParams): TransactionInstruction {
    const data = Buffer.alloc(UNSTAKING_INSTRUCTION_LAYOUT.span)
    const {
      poolPublicKey,
      poolSigner,
      farmingState,
      stakingSnapshots,
      stakingTicket,
      lpTokenFreezeVault,
      userStakingTokenAccount,
      userKey,
      programId,
    } = params

    UNSTAKING_INSTRUCTION_LAYOUT.encode(
        {
          instruction: instructionDiscriminator('end_farming'),
        },
        data,
    );

    const keys = [
      account(poolPublicKey),
      account(farmingState),
      account(stakingSnapshots),
      account(stakingTicket, true),
      account(lpTokenFreezeVault, true),
      account(poolSigner),
      account(userStakingTokenAccount, true),
      account(userKey, false, true),
      account(TOKEN_PROGRAM_ID),
      account(SYSVAR_CLOCK_PUBKEY),
      account(SYSVAR_RENT_PUBKEY),
    ]

    return new TransactionInstruction({
      programId,
      keys,
      data,
    });
  }
}
