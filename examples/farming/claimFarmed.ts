import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { AUTHORIZED_POOLS } from '../../src'
import { connection, farmingClient, poolClient, tokenClient, wallet } from '../common'


/**
 * Claim staking rewards
 */

async function claimFarmed() {
  const mSolPool = await poolClient.getPools({ mint: AUTHORIZED_POOLS.mSOL_USDC.poolMint })

  console.log('getPools:', mSolPool)

  const myPool = mSolPool[0]

  console.log('myPool: ', myPool)

  if (!myPool) {
    throw new Error('Pool not found!')
  }
  const states = await farmingClient.getFarmingState({ poolPublicKey: myPool?.poolPublicKey })

  const activeStates = states.filter((s) => !s.tokensTotal.eq(s.tokensUnlocked)) // Skip finished staking states


  const walletTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
    programId: TOKEN_PROGRAM_ID,
  })

  const tickets = await farmingClient.getFarmingTickets({ userKey: wallet.publicKey, pool: myPool.poolPublicKey })

  if (tickets.length === 0) {
    throw new Error('No tickets, nothing to check')
  }

  activeStates.forEach(async (as) => {
    const farmingToken = await tokenClient.getTokenAccount(as.farmingTokenVault)

    const userFarmingTokenAccount = walletTokens.value
      .find((wt) => wt.account.data.parsed.info.mint === farmingToken.mint.toBase58())

    if (userFarmingTokenAccount) {
      tickets.forEach(async (t) => {
        const txId = await farmingClient.claimFarmed({
          wallet,
          poolPublicKey: myPool.poolPublicKey,
          farmingState: as.farmingStatePublicKey,
          farmingSnapshots: as.farmingSnapshots,
          farmingTicket: t.farmingTicketPublicKey,
          farmingTokenVault: as.farmingTokenVault,
          userFarmingTokenAccount: userFarmingTokenAccount.pubkey,
        })

        console.log('Unstake LP tokens: Transaction sent', txId)
      })
    } else {
      console.warn(`Cannot claim reward: User wallet for token ${farmingToken.mint.toBase58()} does not exists`)
    }
  })
}


claimFarmed()
