import BN from 'bn.js';
import { AUTHORIZED_POOLS, TokenSwap } from '../../src';
import { wallet } from '../common';

export async function withdrawLiquidity() {
  const tokenSwap = await TokenSwap.initialize()

  const transactionId = await tokenSwap.withdrawLiquidity({
    wallet: wallet,
    poolMint: AUTHORIZED_POOLS.RIN_USDC.poolMint,
    poolTokenAmount: new BN(100_000), // LP tokens
    // minBase: new BN(1_000_000), // 1 RIN
    // minQuote: new BN(5_000_000), // 1 RIN
  })

  console.log('Liquidity withdrawed: ', transactionId)
}

withdrawLiquidity()
