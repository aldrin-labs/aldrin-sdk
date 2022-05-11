import { wallet } from '../common'
import { AldrinApiPoolsClient, StakingClient } from '../../src'
import { log } from '../../src/utils';

async function claim(): Promise<string> {
  const aldrinPoolsClient = new AldrinApiPoolsClient()
  const stakingClient = new StakingClient()

  const stakingPool = await aldrinPoolsClient.getStakingPoolInfo()

  const transactionId = await stakingClient.claim({
    wallet,
    stakingPool,
  })

  log(`LOG: Executed successfully.\nTransaction hash: ${transactionId}`)

  return transactionId
}

claim()
