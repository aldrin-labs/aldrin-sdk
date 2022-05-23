import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import {
  CalculateFarmedInstruction,
  CALCULATE_FARMED_INSTRUCTION,
  CreateCalcInstructionParams,
  CREATE_CALC_INSTRUCTION_LAYOUT,
  END_FARMING_INSTRUCTION_LAYOUT,
  START_FARMING_INSTRUCTION_LAYOUT,
} from '.';
import { account, instructionDiscriminator } from '../utils';
import { EndFarmingInstructionParams, GetFarmingRewardParams, StartFarmingInstructionParams } from './types';
import { getFarmingRewardsFromSnapshots } from './utils';


/**
 * Farming pool transactions and utilites
 */
export class Farming {

  /**
   * Create start farming instruction
   * @param params 
   * @returns 
   */

  static startFarmingInstruction(params: StartFarmingInstructionParams): TransactionInstruction {
    const data = Buffer.alloc(START_FARMING_INSTRUCTION_LAYOUT.span)
    const {
      poolPublicKey,
      farmingState,
      lpTokenFreezeVault,
      userKey,
      tokenAmount,
      lpTokenAccount,
      farmingTicket,
      programId,
    } = params

    START_FARMING_INSTRUCTION_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('start_farming'),
        tokenAmount,
      },
      data,
    );

    const keys = [
      account(poolPublicKey),
      account(farmingState),
      account(farmingTicket, true),
      account(lpTokenFreezeVault, true),
      account(lpTokenAccount, true),
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


  /**
   * Create end farming instruction
   * @param params 
   * @returns 
   */

  static endFarmingInstruction(params: EndFarmingInstructionParams): TransactionInstruction {
    const data = Buffer.alloc(END_FARMING_INSTRUCTION_LAYOUT.span)
    const {
      poolPublicKey,
      poolSigner,
      farmingState,
      farmingSnapshots,
      farmingTicket,
      lpTokenFreezeVault,
      userPoolTokenAccount,
      userKey,
      programId,
    } = params

    END_FARMING_INSTRUCTION_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('end_farming'),
      },
      data,
    );

    const keys = [
      account(poolPublicKey),
      account(farmingState),
      account(farmingSnapshots),
      account(farmingTicket, true),
      account(lpTokenFreezeVault, true),
      account(poolSigner),
      account(userPoolTokenAccount, true),
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


  /**
   * Create calc account instruction
   * @param params 
   * @returns 
   */

  static createCalcAccountInstruction(params: CreateCalcInstructionParams): TransactionInstruction {
    const data = Buffer.alloc(CREATE_CALC_INSTRUCTION_LAYOUT.span)
    CREATE_CALC_INSTRUCTION_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('initialize_farming_calc'),
      },
      data,
    );
    const {
      farmingCalc,
      farmingTicket,
      userKey,
      farmingState,
      initializer,
      programId,
    } = params

    const keys = [
      account(farmingCalc, true),
      account(farmingTicket),
      account(userKey),
      account(farmingState),
      account(initializer, false, true),
      account(SYSVAR_RENT_PUBKEY),
    ]

    return new TransactionInstruction({
      programId,
      keys,
      data,
    });

  }

  /**
   * Create calculateFarmed instruction
   */

  static calculateFarmedInstruction(params: CalculateFarmedInstruction): TransactionInstruction {
    const data = Buffer.alloc(CALCULATE_FARMED_INSTRUCTION.span)
    const {
      poolPublicKey,
      farmingState,
      farmingSnapshots,
      farmingTicket,
      farmingCalc,
      programId,
    } = params

    CALCULATE_FARMED_INSTRUCTION.encode(
      {
        instruction: instructionDiscriminator('calculate_farmed'),
        maxSnapshots: params.maxSnapshots,
      },
      data,
    );

    const keys = [
      account(poolPublicKey),
      account(farmingState),
      account(farmingSnapshots),
      account(farmingCalc, true),
      account(farmingTicket, true),
      account(SYSVAR_CLOCK_PUBKEY),
    ]

    return new TransactionInstruction({
      programId,
      keys,
      data,
    });
  }

  /**
   * Calculate Farming Ticket rewards based on farming state & snapshots 
   * @param params 
   * @returns 
   */
  static calculateFarmingRewards(params: GetFarmingRewardParams): { unclaimedTokens: BN, unclaimedSnapshots: number } {
    const { queue, ticket, state } = params

    const ZERO = { unclaimedTokens: new BN(0), unclaimedSnapshots: 0 }


    const snapshotQueue = queue.find(
      (snapshotQueue) => snapshotQueue.queuePublicKey.equals(state.farmingSnapshots)
    )


    // Snapshot not found
    if (!snapshotQueue) {
      return ZERO
    }

    const stateAttached = ticket.statesAttached.find(
      (el) => state.farmingStatePublicKey.equals(el.farmingState)
    )

    // if state attached and last withdraw time more than last farming state snapshot -
    // farming ended
    if (
      (stateAttached?.lastVestedWithdrawTime || 0) >= state.currentTime
    ) {
      return ZERO
    }

    return getFarmingRewardsFromSnapshots({
      ticket,
      state,
      stateAttached,
      snapshots: snapshotQueue.snapshots,
    })
  }

}
