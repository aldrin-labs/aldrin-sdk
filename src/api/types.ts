import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PoolCommon, WithPoolPK } from '..';
import { FarmingState } from '../types'

export interface WithPoolFilter {
  poolMint?: PublicKey
}

interface PoolTvl {
  tokenA: number
  tokenB: number
}

export interface PoolFarmingBase<P, N> {
  farmingState: P
  farmingTokenVault: P
  farmingTokenMint: P
  farmingTokenMintDecimals: number
  farmingSnapshots: P
  tokensUnlocked: N
  tokensTotal: N
  tokensPerPeriod: N
  periodLength: number
  vestingPeriod: number
  currentTime: number
}

export type PoolFarmingResponse = PoolFarmingBase<string, number>

export type PoolFarming = PoolFarmingBase<PublicKey, BN>


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
  farming: PoolFarmingResponse[] | null
}

export interface StakingPoolInfoResponse {
  swapToken: string
  poolSigner: string
  poolTokenMint: string
  stakingVault: string
  farming: PoolFarmingResponse[] | null
}

export interface GetPoolsInfoResponse {
  getPoolsInfo: PoolInfoResponse[]
}

export interface GetStakingPoolInfoResponse {
  getStakingPoolInfo: StakingPoolInfoResponse
}

export interface FarmingStateInfo extends Omit<FarmingState, 'noWithdrawalTime' | 'vestingType' | 'startTime'> {
  farmingTokenMint: PublicKey
  farmingTokenMintDecimals: number
}

export interface TvlInfo {
  base: number
  quote: number
  baseUsd: number
  quoteUsd: number
  totalUsd: number
}


export interface PoolInfo extends PoolCommon, WithPoolPK {
  name: string
  lpApr24h: number // percent
  lpTokenFreezeVaultBalance: BN
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
