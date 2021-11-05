import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";


// Snapshots

interface SnapshotRpcResponse {
  isInitialized: boolean
  tokensFrozen: BN
  farmingTokens: BN
  time: BN
}

export interface SnapshotQueueRpcResponse {
  nextIndex: BN
  snapshots: SnapshotRpcResponse[]
}

export interface Snapshot {
  isInitialized: boolean
  tokensFrozen: BN
  farmingTokens: BN
  time: number
}

export interface SnapshotQueue {
  nextIndex: number
  snapshots: Snapshot[]
}


// Pools 

interface FeesResponse<N> {
  tradeFeeNumerator: N
  tradeFeeDenominator: N
  ownerTradeFeeNumerator: N
  ownerTradeFeeDenominator: N
  ownerWithdrawFeeNumerator: N
  ownerWithdrawFeeDenominator: N
}

export interface PoolCommon {
  poolMint: PublicKey
  baseTokenVault: PublicKey
  baseTokenMint: PublicKey
  quoteTokenVault: PublicKey
  quoteTokenMint: PublicKey
}

export interface WithFeesAccount {
  feeBaseAccount: PublicKey
  feeQuoteAccount: PublicKey
  feePoolTokenAccount: PublicKey
}

export interface PoolBase<F> extends PoolCommon, WithFeesAccount {
  lpTokenFreezeVault: PublicKey
  poolSigner: PublicKey
  poolSignerNonce: number
  authority: PublicKey
  initializerAccount: PublicKey
  fees: F
}

interface WithPoolPK {
  poolPublicKey: PublicKey
}

export type PoolRpcResponse = PoolBase<FeesResponse<BN>>
export type Pool = PoolBase<FeesResponse<number>> & WithPoolPK

type CreateBasketPool = PoolCommon & WithPoolPK

export interface BasketParams {
  pool: CreateBasketPool
  poolTokenAccount: PublicKey | null
  baseTokenAccount: PublicKey
  quoteTokenAccount: PublicKey
}

export type CreateBasketParams = BasketParams & {
  baseTokenAmount: BN
  quoteTokenAmount: BN
}

export type RedeemBasketParams = BasketParams & {
  pool: CreateBasketPool & WithFeesAccount
  poolTokenAmount: BN
  poolTokenAccount: PublicKey
}

export enum SIDE {
  BID = 1,
  ASK = -1
}

type SwapPool = CreateBasketPool & { feePoolTokenAccount: PublicKey }

export interface SwapParams {
  outcomeAmount: BN // Outcome for client - income for program 
  minIncomeAmount: BN // Income for client - outcome for program
  baseTokenAccount: PublicKey | undefined
  quoteTokenAccount: PublicKey | undefined
  side: SIDE
  pool: SwapPool
}

export const Side = {
  Bid: { bid: {} },
  Ask: { ask: {} },
}
