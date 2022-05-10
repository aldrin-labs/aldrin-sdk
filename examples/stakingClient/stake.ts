import BN from 'bn.js'
import { wallet } from '../common'
import { AldrinApiPoolsClient, StakingClient } from '../../src'
import { log } from '../../src/utils';

async function stake(): Promise<string> {
  const aldrinPoolsClient = new AldrinApiPoolsClient()
  const stakingClient = new StakingClient()

  const stakingPool = await aldrinPoolsClient.getStakingPoolInfo()
  const tokenAmount = new BN(1_100_000)

  const transactionId = await stakingClient.doStake({
    wallet,
    stakingPool,
    tokenAmount,
  })

  log(`LOG: Executed successfully.\nTransaction hash: ${transactionId}`)

  return transactionId
}

stake()
