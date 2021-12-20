import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { WithAuhority, WithWallet } from '.';
import { PoolVersion, Wallet } from '../../types';
import { LiquidityPool } from './pools';

export enum SIDE {
  BID = 1,
  ASK = -1
}

type SwapPool = LiquidityPool & {
  feePoolTokenAccount: PublicKey
  poolVersion?: PoolVersion
  curve?: PublicKey
}

export interface SwapParams extends WithWallet {
  outcomeAmount: BN // Outcome for client - income for program 
  minIncomeAmount: BN // Income for client - outcome for program
  userBaseTokenAccount: PublicKey | undefined
  userQuoteTokenAccount: PublicKey | undefined
  side: SIDE
  pool: SwapPool
  slippage?: number // Optional, 0.01 (1%) by default
}

export interface SwapInstructionParams extends SwapParams, WithAuhority {
  userBaseTokenAccount: PublicKey
  userQuoteTokenAccount: PublicKey
  poolVersion: PoolVersion
}

export interface TokenSwapMints {
  mintFrom: PublicKey
  mintTo: PublicKey
}

export type TokenSwapGetPriceParams = TokenSwapMints

export type OptionalAmounts = { outcomeAmount: BN, minIncomeAmount?: BN } | { outcomeAmount?: BN, minIncomeAmount: BN } // including token decimals

export interface TokenSwapSwapParamsInner extends TokenSwapMints {
  wallet?: Wallet
  slippage?: number
}

export type TokenSwapParams = TokenSwapSwapParamsInner & OptionalAmounts


export interface TokenSwapLoadParams {
  connection?: Connection
  wallet?: Wallet
}

export type OptionalDepositAmounts = {
  maxBase: BN
  maxQuote?: BN
} | {
  maxQuote: BN
  maxBase?: BN
} | {
  maxBase: BN
  maxQuote: BN
}

export interface TokenSwapAddLiquidityParamsBase {
  poolMint: PublicKey
  wallet?: Wallet
}


export type TokenSwapAddlLiquidityParams = OptionalDepositAmounts & TokenSwapAddLiquidityParamsBase


export type TokenSwapWithdrawLiquidityParams = TokenSwapAddLiquidityParamsBase & {
  poolTokenAmount: BN
  slippage?: number // Optional, 0.01 (1%) by default
  minBase?: BN
  minQuote?: BN
}


export interface TokenSwapGetFarmedParams {
  wallet?: Wallet
  poolMint: PublicKey
}
