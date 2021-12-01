
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import {
  ClaimFarmedInstructionParams,
  CLAIM_FARMED_INSTRUCTION_LAYOUT,
  END_FARMING_INSTRUCTION_LAYOUT,
  START_FARMING_INSTRUCTION_LAYOUT,
} from '.';
import { account, sighash } from '../utils';
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
        instruction: sighash('start_farming'),
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
        instruction: sighash('end_farming'),
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
   * Create claimFarmed instruction
   */

  static claimFarmedInstruction(params: ClaimFarmedInstructionParams): TransactionInstruction {
    const data = Buffer.alloc(CLAIM_FARMED_INSTRUCTION_LAYOUT.span)
    const {
      poolPublicKey,
      poolSigner,
      farmingState,
      farmingSnapshots,
      farmingTicket,
      userKey,
      farmingTokenVault,
      userFarmingTokenAccount,
      programId,
    } = params

    CLAIM_FARMED_INSTRUCTION_LAYOUT.encode(
      {
        instruction: sighash('withdraw_farmed'),
        maxSnapshots: params.maxSnapshots,
      },
      data,
    );

    const keys = [
      account(poolPublicKey),
      account(farmingState),
      account(farmingSnapshots),
      account(farmingTicket, true),
      account(farmingTokenVault, true),
      account(poolSigner),
      account(userFarmingTokenAccount, true),
      account(userKey, false, true),
      account(userKey, true),
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
