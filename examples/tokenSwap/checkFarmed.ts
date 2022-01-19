import { AUTHORIZED_POOLS, TokenSwap } from '../../src';
import { wallet } from '../common';


/** Check farming state */
export async function checkFarmed() {
  const tokenSwap = await TokenSwap.initialize()

  const farmed = await tokenSwap.getFarmed({
    wallet,
    poolMint: AUTHORIZED_POOLS.SOL_USDC.poolMint,
  })


  farmed.forEach((f) => {
    console.log(`Reward for farming: mint ${f.tokenInfo.mint.toBase58()}, amount: ${f.calcAccount?.tokenAmount.toString()}`)
  })
}

checkFarmed()
