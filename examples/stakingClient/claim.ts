import { wallet } from '../common'
import { AldrinApiPoolsClient, StakingClient } from '../../src'
import { log } from '../../src/utils';

async function claim(): Promise<string> {
  const stakingClient = new StakingClient()

  const transactionId = await stakingClient.claim({
    wallet,
  })

  log(`LOG: Executed successfully.\nTransaction hash: ${transactionId}`)

  return transactionId
}

claim()
