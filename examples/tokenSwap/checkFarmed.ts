import { AUTHORIZED_POOLS, TokenSwap } from '../../src';
import { wallet } from '../common';


/** Check farming state */
export async function checkFarmed() {
  const tokenSwap = await TokenSwap.initialize()

  const farmed = await tokenSwap.getFarmed({
    wallet,
    poolMint: AUTHORIZED_POOLS.mSOL_USDC.poolMint,
  })


  farmed.forEach((f) => {
    console.log(`Reward for farming: mint ${f.tokenInfo.mint.toBase58()}, amount: ${f.rewardsAmount.toNumber()}`)
  })
  // console.log('farmed: ', farmed)
}

checkFarmed()
