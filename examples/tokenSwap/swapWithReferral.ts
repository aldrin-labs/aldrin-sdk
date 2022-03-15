import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { TokenSwap, AUTHORIZED_POOLS } from '../../src'; // or "@aldrin-exchange/sdk"
import { wallet } from '../common';


export async function useTokenSwapWithreferral() {
  const tokenSwap = await TokenSwap.initialize({
    referralParams: {
      referralAccount: new PublicKey('5tmZPaJueZjSnAjXcgQN5bWL3HPvDctw9a7Pn41oHUqA'),
      referralPercent: 1,
      createTokenAccounts: true,
    },
  })

  const tokenA = AUTHORIZED_POOLS.RIN_USDC.baseTokenMint
  const tokenB = AUTHORIZED_POOLS.RIN_USDC.quoteTokenMint

  const rinPrice = await tokenSwap.getPrice({ mintFrom: tokenA, mintTo: tokenB })

  console.log('RIN/SOL price:  ', rinPrice)

  const usdRinPrice = await tokenSwap.getPrice({ mintFrom: tokenB, mintTo: tokenA })

  console.log('SOL/RIN price:  ', usdRinPrice)

  const swapImpact = await tokenSwap.getSwapImpact({
    wallet,
    minIncomeAmount: new BN(1_000_000_000), // 1 RIN
    mintFrom: tokenA,
    mintTo: tokenB,
  })

  console.log('swapImpact: ', swapImpact)

  const txId = await tokenSwap.swap({
    wallet: wallet,
    // minIncomeAmount: new BN(1_000_000), // 1 RIN
    outcomeAmount: new BN(50_000_000), // 5 USDC
    mintFrom: tokenA,
    mintTo: tokenB,
    slippage: 0.1,
  })

  console.log('Buy 1 tokenA for tokenB success, txId: ', txId)
  

}

useTokenSwapWithreferral()
