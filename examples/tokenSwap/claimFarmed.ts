import { AUTHORIZED_POOLS, TokenSwap } from '../../src'; // or "@aldrin-exchange/sdk"
import { wallet } from '../common';


/** Claim all available to claim tickets */

export async function getFarmed() {
  const tokenSwap = await TokenSwap.initialize()

  const claimTxId = await tokenSwap.claimFarmed({
    wallet,
    poolMint: AUTHORIZED_POOLS.mSOL_USDC.poolMint,
  })

  console.log(`Reward for farming claimed: ${claimTxId}`)


}

getFarmed()
