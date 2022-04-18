import BN from 'bn.js'
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js'

import { getBumpAccount, PLUTONIANS_STAKE_TOKEN_MINT, PLUTONIANS_REWARD_TOKEN_MINT, program } from './common'
import { wallet, connection } from '../common'
import { sendTransaction } from '../../src/transactions';


export const DAYS_TO_SECONDS = 86400;

// 1
export const APR = 120000; // Denominator = 1_000_000, 120000 / 1_000_000 = 0.12, which means 12% APR
export const LOCK_DURATION = 60 * DAYS_TO_SECONDS;
// 2
// export const APR = 150000; 
// export const LOCK_DURATION = 90 * DAYS_TO_SECONDS;
// 3
// export const APR = 180000; 
// export const LOCK_DURATION = 120 * DAYS_TO_SECONDS;
// 3
// export const APR = 200000; 
// export const LOCK_DURATION = 150 * DAYS_TO_SECONDS;


export const createPlutoniansTier = async () => {
  const tierAccount = Keypair.generate();
  const [poolAccount, bumpPoolAccount] = await getBumpAccount()
  const reqArgs = { apr: new BN(APR), lockDuration: new BN(LOCK_DURATION), bumpStakingPool: bumpPoolAccount };
  const reqAccounts = {
    caller: wallet.publicKey,
    stakingPool: poolAccount,
    stakingTier: tierAccount.publicKey,
    stakeTokenMint: PLUTONIANS_STAKE_TOKEN_MINT,
    rewardTokenMint: PLUTONIANS_REWARD_TOKEN_MINT,
    systemProgram: SystemProgram.programId,
  };

  const transaction = new Transaction().add(
    program.instruction.addStakingTier(reqArgs.apr, reqArgs.lockDuration, reqArgs.bumpStakingPool, {
      accounts: reqAccounts,
    })
  )

  const txId = await sendTransaction({ wallet, transaction, connection, partialSigners: [tierAccount] })
  console.log('Create tier txId: ', txId, 'APR: ', APR, 'Lock duration: ', LOCK_DURATION)

}


createPlutoniansTier()
