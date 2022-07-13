import { blob, struct, Structure, u8, LayoutObject } from '@solana/buffer-layout';
import { publicKey, rustEnum, uint64 } from '../layout/common';


const FEES_LAYOUT = struct<LayoutObject>([
  uint64('tradeFeeNumerator'),
  uint64('tradeFeeDenominator'),
  uint64('ownerTradeFeeNumerator'),
  uint64('ownerTradeFeeDenominator'),
  uint64('ownerWithdrawFeeNumerator'),
  uint64('ownerWithdrawFeeDenominator'),
], 'fees')

const POOL_FIELDS_COMMON = [
  blob(8, 'padding'),
  publicKey('lpTokenFreezeVault'),
  publicKey('poolMint'),
  publicKey('baseTokenVault'),
  publicKey('baseTokenMint'),
  publicKey('quoteTokenVault'),
  publicKey('quoteTokenMint'),
  publicKey('poolSigner'),
  u8('poolSignerNonce'),
  publicKey('authority'),
  publicKey('initializerAccount'),
  publicKey('feeBaseAccount'),
  publicKey('feeQuoteAccount'),
  publicKey('feePoolTokenAccount'),
  FEES_LAYOUT,
]

export const POOL_LAYOUT = struct<LayoutObject>(POOL_FIELDS_COMMON)

export const POOL_V2_LAYOUT = struct<LayoutObject>([
  ...POOL_FIELDS_COMMON,
  u8('curveType'),
  publicKey('curve'),
])

export const DEPOSIT_LIQUIDITY_INSTRUCTION_LAYOUT = struct<LayoutObject>([
  blob(8, 'instruction'),
  uint64('creationSize'),
  uint64('maxBaseTokenAmount'),
  uint64('maxQuoteTokenAmount'),
])

export const WITHDRAW_LIQUIDITY_INSTRUCTION_LAYOUT = struct<LayoutObject>([
  blob(8, 'instruction'),
  uint64('redemptionSize'),
  uint64('baseTokenReturnedMin'),
  uint64('quoteTokenReturnedMin'),
])


export const SWAP_INSTRUCTION_LAYOUT = struct<LayoutObject>([
  blob(8, 'instruction'),
  uint64('tokens'),
  uint64('minTokens'),
  rustEnum([
    new Structure([], 'bid'),
    new Structure([], 'ask'),
  ], 'side'),
])
