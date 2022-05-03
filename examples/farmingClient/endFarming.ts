import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { AUTHORIZED_POOLS } from '../../src' // or "@aldrin-exchange/sdk"
import { connection, farmingClient, poolClient, wallet } from '../common'

async function endFarming() {
  const mSolPool = await poolClient.getPools({ mint: AUTHORIZED_POOLS.mSOL_USDC.poolMint })

  console.log('getPools:', mSolPool)

  const myPool = mSolPool[0]

  console.log('myPool: ', myPool)

  if (!myPool) {
    throw new Error('Pool not found!')
  }
  const states = await farmingClient.getFarmingState({ poolPublicKey: myPool?.poolPublicKey, poolVersion: myPool?.poolVersion })

  const activeStates = states.filter((s) => !s.tokensTotal.eq(s.tokensUnlocked)) // Skip finished staking states


  const walletTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
    programId: TOKEN_PROGRAM_ID,
  })

  const poolTokenAccount = walletTokens.value
    .find((wt) => wt.account.data.parsed.info.mint === myPool.poolMint.toBase58())


  // TODO: improve API client
  if (!poolTokenAccount) {
    throw new Error('No LP account - cannot unstake!')
  }

  const tickets = await farmingClient.getFarmingTickets({ userKey: wallet.publicKey, pool: myPool.poolPublicKey })

  if (tickets.length === 0) {
    throw new Error('No tickets, nothing to check')
  }

  const fs = activeStates[0] // End farming on any of active states, all other states (if available) will apply automaticaly
  // TODO: split into multiple transactions, by 20 tickets per transaction
  const txId = farmingClient.endFarmings({
    wallet,
    poolPublicKey: myPool.poolPublicKey,
    farmingState: fs.farmingStatePublicKey,
    farmingSnapshots: fs.farmingSnapshots,
    farmingTickets: tickets.map((t) => t.farmingTicketPublicKey),
    lpTokenFreezeVault: myPool.lpTokenFreezeVault,
    userPoolTokenAccount: poolTokenAccount.pubkey,
  })

  console.log('Farming finished:', txId)

}


endFarming()
