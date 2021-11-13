import { AUTHORIZED_POOLS, Farming } from '../../src'
import { farmingClient, poolClient, tokenClient, wallet } from '../common'

/**
 * Get information about farmings (farming state) and rewards - per pool and personal
 */
async function getFarmingState() {
  const allPools = await poolClient.getPools({ mint: AUTHORIZED_POOLS.mSOL_USDC.poolMint })

  console.log('getPools:', allPools)

  const myPool = allPools[0]

  console.log('myPool: ', myPool)

  if (!myPool) {
    throw new Error('Pool not found!')
  }
  const states = await farmingClient.getFarmingState({ poolPublicKey: myPool.poolPublicKey })

  const activeStates = states.filter((s) => !s.tokensTotal.eq(s.tokensUnlocked)) // Skip finished staking states


  // Resolve rewards
  const stateVaults = await Promise.all(
    activeStates.map(async (state) => {
      const tokenInfo = await tokenClient.getTokenAccount(state.farmingTokenVault)
      const mintInfo = await tokenClient.getMintInfo(tokenInfo.mint)
      return {
        tokenInfo,
        state,
        mintInfo,
      }
    })
  )

  stateVaults.forEach((sv) => {
    const tokensFormatted = sv.state.tokensPerPeriod.muln(1000).div(sv.mintInfo.decimalDenominator).toNumber() / 1000
    console.log(`Staking rewards: Token ${sv.tokenInfo.mint}, reward: ${tokensFormatted} per ${sv.state.periodLength} seconds for pool`)
  })


  const tickets = await farmingClient.getFarmingTickets({ userKey: wallet.publicKey, pool: myPool.poolPublicKey })

  if (tickets.length === 0) {
    throw new Error('No tickets, nothing to check')
  }


  const queue = await farmingClient.getFarmingSnapshotsQueue()
  stateVaults.forEach((sv) => {
    tickets.forEach(async (t) => {

      const rewards = Farming.calculateFarmingRewards({
        ticket: t,
        queue,
        state: sv.state, // Calculate for each state separately, sometimes there are few reward pools
      })

      console.log(`Ticket rewards: ticket ${t.farmingTicketPublicKey.toBase58()},  mint ${sv.tokenInfo.mint.toBase58()}, rewards: ${rewards.toNumber() / sv.mintInfo.decimalDenominator.toNumber()} tokens`)
    })
  })

}

getFarmingState()
