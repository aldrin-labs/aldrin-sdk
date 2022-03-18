import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { TokenSwap, AUTHORIZED_POOLS } from '../../src'; // or "@aldrin-exchange/sdk"
import { wallet } from '../common';


export async function useTokenSwapWithreferral() {
  const tokenSwap = await TokenSwap.initialize({
    referralParams: {
      referralAccount: new PublicKey('GKP7eGo1WXYMRXQCyxo8fGLK8xhMx3yk89GVFsJRau9X'),
      referralPercent: 1, // not more than 1%, might be less bcz of the curve
      createTokenAccounts: true,
    },
  })

  const tokenA = AUTHORIZED_POOLS.RIN_SOL.baseTokenMint
  const tokenB = AUTHORIZED_POOLS.RIN_SOL.quoteTokenMint

  const rinPrice = await tokenSwap.getPrice({ mintFrom: tokenA, mintTo: tokenB })
  const usdRinPrice = await tokenSwap.getPrice({ mintFrom: tokenB, mintTo: tokenA })
  console.log('RIN/USDC price:  ', rinPrice)
  console.log('USDC/RIN price:  ', usdRinPrice)

  const swapImpact = await tokenSwap.getSwapImpact({
    wallet,
    minIncomeAmount: new BN(1_000_000_000), // 1 RIN
    mintFrom: tokenA,
    mintTo: tokenB,
  })

  console.log('swapImpact: ', swapImpact)

  const txId = await tokenSwap.swap({
    wallet: wallet,
    outcomeAmount: new BN(1_000_000_000), // RIN, this is what would be send from the wallet
    // minIncomeAmount: new BN(500_000), // USDC, this is what would we be recieved to the wallet
    mintFrom: tokenA,
    mintTo: tokenB,
    slippage: 0.1,
  })

  console.log('Buy 1 tokenA for tokenB success, txId: ', txId)
  

}

useTokenSwapWithreferral()
