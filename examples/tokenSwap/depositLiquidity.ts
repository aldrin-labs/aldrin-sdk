import BN from 'bn.js';
import { AUTHORIZED_POOLS, TokenSwap } from '../../src'; // or "@aldrin-exchange/sdk"
import { wallet } from '../common';

export async function depositLiquidity() {
  const tokenSwap = await TokenSwap.initialize()

  const transactionId = await tokenSwap.depositLiquidity({
    wallet: wallet,
    poolMint: AUTHORIZED_POOLS.RIN_USDC.poolMint,
    // maxBase: new BN(1_000_000_000), // 1 RIN
    maxQuote: new BN(5_000_000), // 5 USDC
  })

  console.log('Liquidity added: ', transactionId)
}

depositLiquidity()
