import { AUTHORIZED_POOLS, TokenSwap } from '../../src';
import { wallet } from '../common';


/** Check farming state */
export async function getPrice() {
  const tokenSwap = await TokenSwap.initialize()

  const price = await tokenSwap.getPrice({
    mintTo: AUTHORIZED_POOLS.USDC_USDT.baseTokenMint,
    mintFrom: AUTHORIZED_POOLS.USDC_USDT.quoteTokenMint,
  })

  console.log('price: ', price)
}

getPrice()
