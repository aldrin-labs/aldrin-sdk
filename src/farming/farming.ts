// import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
// import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
// import BN from 'bn.js';
// import {
//   CalculateFarmedInstruction,
//   CALCULATE_FARMED_INSTRUCTION,
//   CreateCalcInstructionParams,
//   CREATE_CALC_INSTRUCTION_LAYOUT,
//   END_FARMING_INSTRUCTION_LAYOUT,
//   START_FARMING_INSTRUCTION_LAYOUT,
// } from '.';
// import { account, instructionDiscriminator } from '../utils';
// import { EndFarmingInstructionParams, GetFarmingRewardParams, StartFarmingInstructionParams } from './types';
// import { getFarmingRewardsFromSnapshots } from './utils';

import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { FARMING_PROGRAM_ADDRESS } from '../constants';
import { account, instructionDiscriminator } from '../utils';
import { INSTRUCTION_LAYOUT, START_FARMING_INSTRUCTION_LAYOUT, STOP_FARMING_INSTRUCTION_LAYOUT } from './layout';
import { ClaimEligibleHarvestInstructionParams, StartFarmingInstructionParams, StopFarmingInstructionParams, TakeSnapshotInstructionParams } from './types';
import { getFarmer, getFarmSignerPda, getStakeVault } from './utils';


// /**
//  * Farming pool transactions and utilites
//  */
export class Farming {


  static async createFarmerInstruction(farm: PublicKey, authority: PublicKey) {
    const data = Buffer.alloc(INSTRUCTION_LAYOUT.span)


    INSTRUCTION_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('create_farmer'),
      },
      data,
    );
    const farmer = await getFarmer(farm, authority)


    const keys = [
      account(authority, true, true),
      account(farmer, true),
      account(farm),
      account(SystemProgram.programId),
    ]

    return new TransactionInstruction({
      programId: FARMING_PROGRAM_ADDRESS,
      keys,
      data,
    });
  }

  static async startFarmingInstruction(params: StartFarmingInstructionParams) {
    const data = Buffer.alloc(START_FARMING_INSTRUCTION_LAYOUT.span)

    const { farm, walletAuthority, stakeWallet, stakeVault, tokenAmount } = params
    START_FARMING_INSTRUCTION_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('start_farming'),
        stake: tokenAmount,
      },
      data,
    );

    const farmer = await getFarmer(farm, walletAuthority)

    const keys = [
      account(walletAuthority, false, true),
      account(farmer, true),
      account(stakeWallet, true),
      account(farm),
      account(stakeVault, true),
      account(TOKEN_PROGRAM_ID),
    ]

    return new TransactionInstruction({
      programId: FARMING_PROGRAM_ADDRESS,
      keys,
      data,
    });
  }

  static async stopFarmingInstruction(params: StopFarmingInstructionParams) {
    const data = Buffer.alloc(STOP_FARMING_INSTRUCTION_LAYOUT.span)

    const { farm, authority, stakeWallet, unstakeMax } = params
    STOP_FARMING_INSTRUCTION_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('stop_farming'),
        unstakeMax,
      },
      data,
    );

    const farmer = await getFarmer(farm, authority)
    const farmSignerPda = await getFarmSignerPda(farm)
    const stakeVault = await getStakeVault(farm)

    const keys = [
      account(authority, false, true),
      account(farmer, true),
      account(stakeWallet, true),
      account(farm),
      account(farmSignerPda),
      account(stakeVault, true),
      account(TOKEN_PROGRAM_ID),
    ]

    return new TransactionInstruction({
      programId: FARMING_PROGRAM_ADDRESS,
      keys,
      data,
    });
  }

  static async takeSnapshotInstruction(params: TakeSnapshotInstructionParams) {
    const data = Buffer.alloc(INSTRUCTION_LAYOUT.span)

    const { farm, stakeVault } = params
    START_FARMING_INSTRUCTION_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('take_snapshot'),
      },
      data,
    );

    const keys = [
      account(farm, true),
      account(stakeVault),
    ]

    return new TransactionInstruction({
      programId: FARMING_PROGRAM_ADDRESS,
      keys,
      data,
    });
  }

  static async claimEligibleHarvest(params: ClaimEligibleHarvestInstructionParams) {
    const { farm, authority, restAccounts } = params
    const farmer = await getFarmer(farm, authority)
    const farmSignerPda = await getFarmSignerPda(farm)


    const data = Buffer.alloc(INSTRUCTION_LAYOUT.span)
    INSTRUCTION_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('claim_eligible_harvest'),
      },
      data,
    );

    const keys = [
      account(authority, false, true),
      account(farmer, true),
      account(farmSignerPda),
      account(TOKEN_PROGRAM_ID),
      ...restAccounts
        .map((_) => [
          account(_.harvestVaultAccount, true),
          account(_.userRewardAccount, true),
        ])
        .flat(),
    ]

    return new TransactionInstruction({
      programId: FARMING_PROGRAM_ADDRESS,
      keys,
      data,
    });
  }


}
