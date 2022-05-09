import BN from 'bn.js'
import { wallet } from '../common'
import { AldrinApiPoolsClient, StakingClient } from '../../src'
import { log } from '../../src/utils';

async function stake(): Promise<string> {
  const aldrinPoolsClient = new AldrinApiPoolsClient()
  const stakingClient = new StakingClient()

  const stakingPool = await aldrinPoolsClient.getStakingPoolInfo()
  const tokenAmount = new BN(100_000)

  const transactionHash = await stakingClient.doStake({
    wallet,
    stakingPool,
    tokenAmount,
  })

  log(`LOG: Executed successfully.\nTransaction hash: ${transactionHash}`)

  return transactionHash
}

stake()
