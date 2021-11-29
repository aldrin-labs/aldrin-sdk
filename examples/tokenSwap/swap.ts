import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { TokenSwap } from '../../src';
import { wallet } from '../common';


export async function useTokenSwap() {
  const tokenSwap = await TokenSwap.initialize()

  const rin = new PublicKey('E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp')
  const usdc = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

  const rinPrice = await tokenSwap.getPrice({ mintFrom: rin, mintTo: usdc })

  console.log('RIN/USDC price:  ', rinPrice)

  const usdRinPrice = await tokenSwap.getPrice({ mintFrom: usdc, mintTo: rin })

  console.log('USDC/RIN price:  ', usdRinPrice)

  // const buyTxId = await tokenSwap.swap({
  //   wallet: wallet,
  //   outcomeAmount: new BN(10_000_000), // 10 USDC
  //   mintFrom: usdc,
  //   mintTo: rin,
  // })

  // console.log('Buy RIN on 10 USDC success, txId: ', buyTxId)

  const swapImpact = await tokenSwap.getSwapImpact({
    wallet,
    minIncomeAmount: new BN(100_000_000_000), // 1 RIN
    // outcomeAmount: new BN(5_000_000), // 5 USDC
    mintFrom: usdc,
    mintTo: rin,
  })

  console.log('swapImpact: ', swapImpact)

  const txId = await tokenSwap.swap({
    wallet: wallet,
    minIncomeAmount: new BN(1_000_000_000), // 1 RIN
    // outcomeAmount: new BN(5_000_000) // 5 USDC
    mintFrom: usdc,
    mintTo: rin,
  })

  console.log('Buy 1 RIN for USDC success, txId: ', txId)
  

}

useTokenSwap()
