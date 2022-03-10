import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { SOL_MINT, TokenSwap } from '../../src'; // or "@aldrin-exchange/sdk"
import { wallet } from '../common';


export async function useTokenSwap() {
  const tokenSwap = await TokenSwap.initialize()

  const tokenA = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  const tokenB = SOL_MINT
  // const rin = new PublicKey('E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp')
  // const usdc = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  // const srm = new PublicKey('SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt')

  const rinPrice = await tokenSwap.getPrice({ mintFrom: tokenA, mintTo: tokenB })

  console.log('RIN/SRM price:  ', rinPrice)

  const usdRinPrice = await tokenSwap.getPrice({ mintFrom: tokenB, mintTo: tokenA })

  console.log('SRM/RIN price:  ', usdRinPrice)

  // const buyTxId = await tokenSwap.swap({
  //   wallet: wallet,
  //   outcomeAmount: new BN(10_000_000), // 10 USDC
  //   mintFrom: usdc,
  //   mintTo: rin,
  // })

  // console.log('Buy RIN on 10 USDC success, txId: ', buyTxId)

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
    mintFrom: tokenB,
    mintTo: tokenA,
    slippage: 0.1,
  })

  console.log('Buy 1 tokenA for tokenB success, txId: ', txId)
  

}

useTokenSwap()
