import { wallet } from '../common'
import { StakingClient } from '../../src'
import { log } from '../../src/utils';

async function unstaking(): Promise<string[]> {
  const stakingClient = new StakingClient()

  const result = await stakingClient.endStaking({
    wallet,
  })

  log('LOG: Executed successfully.')

  return result
}

unstaking()
