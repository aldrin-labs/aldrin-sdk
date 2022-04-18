import { wallet, connection } from '../common'
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js'
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { sendTransaction } from '../../src/transactions'
import { getBumpAccount, PLUTONIANS_REWARD_TOKEN_MINT, PLUTONIANS_STAKE_TOKEN_MINT, program } from './common'


export const createPool = async () => {
  const stakeTokensVault = Keypair.generate() // Pool base tokens vault
  const rewardsTokenVault = Keypair.generate() // Pool quote tokens vault

  console.log('stakeTokensVault:', stakeTokensVault.publicKey.toString())
  console.log('rewardsTokenVault:', rewardsTokenVault.publicKey.toString())

 
  const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(
    connection
  )
  const [poolAccount, bumpPoolAccount] = await getBumpAccount()

  const transaction = new Transaction()
    .add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: stakeTokensVault.publicKey,
        lamports: balanceNeeded,
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
      })
    )
    .add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: rewardsTokenVault.publicKey,
        lamports: balanceNeeded,
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
      })
    )
    .add(
      Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, PLUTONIANS_STAKE_TOKEN_MINT, stakeTokensVault.publicKey, wallet.publicKey)
    )
    .add(
      Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, PLUTONIANS_REWARD_TOKEN_MINT, rewardsTokenVault.publicKey, wallet.publicKey)
    ).add(
      program.instruction.initPool(bumpPoolAccount, {
        accounts: {
          owner: wallet.publicKey,
          stakingPool: poolAccount,
          stakeTokenMint: PLUTONIANS_STAKE_TOKEN_MINT,
          rewardTokenMint: PLUTONIANS_REWARD_TOKEN_MINT,
          stakeTokenaccount: stakeTokensVault.publicKey,
          rewardTokenaccount: rewardsTokenVault.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
      })
    );

  const txId = await sendTransaction({ wallet, transaction, connection, partialSigners: [rewardsTokenVault, stakeTokensVault] })
  console.log('Create pool txId: ', txId)
}


createPool()
