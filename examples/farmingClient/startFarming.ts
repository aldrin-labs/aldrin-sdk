import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import BN from 'bn.js'
import { AUTHORIZED_POOLS } from '../../src' // or "@aldrin-exchange/sdk"
import { connection, farmingClient, poolClient, wallet } from '../common'

export async function startFarming() {
  const allPools = await poolClient.getPools({ mint: AUTHORIZED_POOLS.mSOL_USDC.poolMint })

  const myPool = allPools[0]

  console.log('myPool: ', myPool)

  if (!myPool) {
    throw new Error('Pool not found!')
  }


  const walletTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
    programId: TOKEN_PROGRAM_ID,
  })

  const poolTokenAccount = walletTokens.value
    .find((wt) => wt.account.data.parsed.info.mint === myPool.poolMint.toBase58())


  if (!poolTokenAccount) {
    throw new Error('No LP account - nothing to stake!')
  }

  const lpTokenAmount = new BN(poolTokenAccount.account.data.parsed.info.tokenAmount.amount)

  if (lpTokenAmount.eqn(0)) {
    throw new Error('LP account is empty - nothing to stake!')
  }

  const states = await farmingClient.getFarmingState({ poolPublicKey: myPool.poolPublicKey })
  const activeStates = states.filter((s) => !s.tokensTotal.eq(s.tokensUnlocked)) // Skip finished staking states


  console.log('Available to stake (LP tokens): ', lpTokenAmount.toString())

  // Stake 10% of all tokens
  const stakeAmount = lpTokenAmount.muln(0.1)

  const fs = activeStates[0] // Start farming on any of active states, all other states (if available) will apply automaticaly
  const txId = await farmingClient.startFarming({
    poolPublicKey: myPool.poolPublicKey,
    farmingState: fs.farmingStatePublicKey,
    lpTokenFreezeVault: myPool.lpTokenFreezeVault,
    lpTokenAccount: poolTokenAccount.pubkey,
    tokenAmount: stakeAmount,
    wallet,
  })
  // // myPool?.poolPublicKey
  console.log('Start farming: transaction sent, ', txId)

  // Add some logic to check transaction

}
