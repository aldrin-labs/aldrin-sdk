import BN from 'bn.js'
import { wallet } from '../common'
import { StakingClient } from '../../src'
import { log } from '../../src/utils';

async function stake(): Promise<string> {
  const stakingClient = new StakingClient()
  const tokenAmount = new BN(1_100_000)

  const transactionId = await stakingClient.startStaking({
    wallet,
    tokenAmount,
  })

  log(`LOG: Executed successfully.\nTransaction hash: ${transactionId}`)

  return transactionId
}

stake()
