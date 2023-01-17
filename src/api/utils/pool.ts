import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PoolInfo, PoolInfoResponse } from '../types';

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
    tvl: {
      base: baseTvl,
      quote: quoteTvl,
      baseUsd: baseTvlUsd,
      quoteUsd: quoteTvlUsd,
      totalUsd: totalTvlUsd,
    },
  }
}
