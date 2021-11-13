import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { FarmingStateInfo, PoolFarmingResponse, PoolInfo, PoolInfoResponse } from '../types';


const toFarmingStateInfo = (response: PoolFarmingResponse, pool: PublicKey): FarmingStateInfo => ({
  tokensPerPeriod: new BN(`${response.tokensPerPeriod}`),
  tokensUnlocked: new BN(`${response.tokensUnlocked}`),
  tokensTotal: new BN(`${response.tokensTotal}`),
  periodLength: response.periodLength,
  vestingPeriod: response.vestingPeriod,
  currentTime: response.currentTime,
  pool,
  farmingTokenVault: new PublicKey(response.farmingTokenVault),
  farmingSnapshots: new PublicKey(response.farmingSnapshots),
  farmingStatePublicKey: new PublicKey(response.farmingState),
  farmingTokenMint: new PublicKey(response.farmingTokenMint),
  farmingTokenMintDecimals: response.farmingTokenMintDecimals,
})

export const poolResponseToModel = (
  response: PoolInfoResponse,
  prices: Map<string, number>
): PoolInfo => {
  const [base, quote] = response.parsedName.split('_')
  const poolPublicKey = new PublicKey(response.swapToken)
  const baseTvl = new BN(response.tvl.tokenA)
  const quoteTvl = new BN(response.tvl.tokenB)
  const baseTvlUsd = baseTvl.muln(prices.get(base) || 0)
  const quoteTvlUsd = quoteTvl.muln(prices.get(quote) || 0)
  const totalTvlUsd = baseTvl.add(quoteTvl)

  const lpPrice = new BN(response.lpTokenFreezeVaultBalance).div(totalTvlUsd)
  console.log('lpPrice: ', response.parsedName, response.tvl.tokenA, response.tvl.tokenB, lpPrice.toString(), totalTvlUsd.toString(), response.lpTokenFreezeVaultBalance)
  return {
    poolPublicKey,
    poolMint: new PublicKey(response.poolTokenMint),
    baseTokenVault: new PublicKey(response.poolTokenAccountA),
    baseTokenMint: new PublicKey(response.tokenA),
    quoteTokenVault: new PublicKey(response.poolTokenAccountB),
    quoteTokenMint: new PublicKey(response.tokenA),
    name: response.parsedName,
    lpApr24h: response.apy24h,
    supply: new BN(response.supply),
    farmingStates: response.farming.map((f) => toFarmingStateInfo(f, poolPublicKey)),
    tvl: {
      base: baseTvl,
      quote: quoteTvl,
      baseUsd: baseTvlUsd,
      quoteUsd: quoteTvlUsd,
      totalUsd: totalTvlUsd,
    },
  }
}
