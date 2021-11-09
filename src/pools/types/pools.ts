import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

interface FeesResponse<N> {
  tradeFeeNumerator: N
  tradeFeeDenominator: N
  ownerTradeFeeNumerator: N
  ownerTradeFeeDenominator: N
  ownerWithdrawFeeNumerator: N
  ownerWithdrawFeeDenominator: N
}

interface PoolCommon {
  poolMint: PublicKey
  baseTokenVault: PublicKey
  baseTokenMint: PublicKey
  quoteTokenVault: PublicKey
  quoteTokenMint: PublicKey
}

interface WithFeesAccount {
  feeBaseAccount: PublicKey
  feeQuoteAccount: PublicKey
  feePoolTokenAccount: PublicKey
}

interface PoolBase<F> extends PoolCommon, WithFeesAccount {
  lpTokenFreezeVault: PublicKey
  poolSigner: PublicKey
  poolSignerNonce: number
  authority: PublicKey
  initializerAccount: PublicKey
  fees: F
}

export interface WithPoolPK {
  poolPublicKey: PublicKey
}

export type PoolRpcResponse = PoolBase<FeesResponse<BN>>
export type Pool = PoolBase<FeesResponse<number>> & WithPoolPK

export type CreateBasketPool = PoolCommon & WithPoolPK

interface BasketParams {
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
