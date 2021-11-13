import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { FarmingState, PoolCommon, WithPoolPK } from '..';

export interface WithPoolFilter {
  poolMint?: PublicKey
}


interface PoolTvl {
  tokenA: string
  tokenB: string
}

export interface PoolFarmingResponse {
  farmingState: string
  farmingTokenVault: string
  farmingTokenMint: string
  farmingTokenMintDecimals: number
  farmingSnapshots: string
  tokensUnlocked: number
  tokensTotal: number
  tokensPerPeriod: number
  periodLength: number
  vestingPeriod: number
  currentTime: number
}

export interface PoolInfoResponse {
  name: string
  parsedName: string
  swapToken: string
  poolTokenMint: string
  tokenA: string
  tokenB: string
  poolTokenAccountA: string
  poolTokenAccountB: string
  lpTokenFreezeVaultBalance: number
  tvl: PoolTvl
  apy24h: number // percent
  supply: number // TODO: rewrite with BN
  farming: PoolFarmingResponse[]
}

export interface GetPoolsInfoResponse {
  getPoolsInfo: PoolInfoResponse[]
}


export interface FarmingStateInfo extends Omit<FarmingState, 'noWithdrawalTime' | 'vestingType' | 'noWithdrawalTime' | 'startTime' > {
  farmingTokenMint: PublicKey
  farmingTokenMintDecimals: number
}

export interface TvlInfo {
  base: BN
  quote: BN
  baseUsd: BN
  quoteUsd: BN
  totalUsd: BN
}

export interface PoolInfo extends PoolCommon, WithPoolPK {
  name: string
  lpApr24h: number // percent
  supply: BN
  farmingStates: FarmingStateInfo[]
  tvl: TvlInfo
}

export interface Price {
  symbol: string
  price: number
}

export interface GetPriceResponse {
  getDexTokensPrices: Price[]
}
