import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { TokenSwap } from '../../src';
import { wallet } from '../common';


export async function useTokenSwap() {
  const tokenSwap = await TokenSwap.initialize()

  const tokenA = new PublicKey('A1BsqP5rH3HXhoFK6xLK6EFv9KsUzgR1UwBQhzMW9D2m')
  const tokenB = new PublicKey('8wxoc2AnVsT6aLXDyA2G9PKfpx8mVT1Q5pPgvQLpCEVM')
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
    minIncomeAmount: new BN(1_000_000_000), // 1 RIN
    // outcomeAmount: new BN(5_000_000) // 5 USDC
    mintFrom: tokenA,
    mintTo: tokenB,
  })

  console.log('Buy 1 tokenA for tokenB success, txId: ', txId)
  

}

useTokenSwap()
