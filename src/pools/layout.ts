
import { blob, struct, Structure, u8 } from '@solana/buffer-layout';
import { publicKey, rustEnum, uint64 } from '../layout/common';


export const POOL_LAYOUT = struct([
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
  struct([
    uint64('tradeFeeNumerator', true),
    uint64('tradeFeeDenominator', true),
    uint64('ownerTradeFeeNumerator', true),
    uint64('ownerTradeFeeDenominator', true),
    uint64('ownerWithdrawFeeNumerator', true),
    uint64('ownerWithdrawFeeDenominator', true),
  ], 'fees'),
])


export const DEPOSIT_LIQUIDITY_INSTRUCTION_LAYOUT = struct([
  blob(8, 'instruction'),
  uint64('creationSize'),
  uint64('maxBaseTokenAmount'),
  uint64('maxQuoteTokenAmount'),
])

export const WITHDRAW_LIQUIDITY_INSTRUCTION_LAYOUT = struct([
  blob(8, 'instruction'),
  uint64('redemptionSize'),
  uint64('baseTokenReturnedMin'),
  uint64('quoteTokenReturnedMin'),
])


export const SWAP_INSTRUCTION_LAYOUT = struct([
  blob(8, 'instruction'),
  uint64('tokens'),
  uint64('minTokens'),
  rustEnum([
    new Structure([], 'bid'),
    new Structure([], 'ask'),
  ], 'side'),
])
