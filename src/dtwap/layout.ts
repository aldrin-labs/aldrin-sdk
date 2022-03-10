
import { blob, seq, struct, Structure, u32, u8 } from '@solana/buffer-layout';
import { bool, int64, publicKey, rustEnum, uint64 } from '../layout/common';

export const DTWAP_ORDER = struct([
  bool('isInitialized'),
  uint64('amount'),
  uint64('startTime', true),
  uint64('endTime', true),
  uint64('timeHorizon', true),
  uint64('averageTransaction'),
  uint64('amountFilled'),
  uint64('amountToFill'),
  uint64('stepsFilled'),
  uint64('stepsToFill'),
  uint64('tokensSwapped'),
  publicKey('authority'),
])

const SIDE = rustEnum([
  new Structure([], 'bid'),
  new Structure([], 'ask'),
], 'side')

export const DTWAP_ORDER_ARRAY = struct([
  blob(8, 'padding'),
  publicKey('twammFromTokenVault'),
  publicKey('twammToTokenVault'),
  publicKey('signer'),
  u8('signerNonce'),
  publicKey('feeAccount'),
  publicKey('pairSettings'),
  SIDE,
  seq(DTWAP_ORDER, 30, 'orders'),
])

const DTWAP_FEE = struct([
  uint64('placingFeeNumerator'),
  uint64('placingFeeDenominator'),
  uint64('cancellingFeeNumerator'),
  uint64('cancellingFeeDenominator'),
], 'fees')

export const DTWAP_PAIR_SETTINGS = struct([
  blob(8, 'padding'),
  publicKey('baseTokenMint'),
  publicKey('quoteTokenMint'),
  publicKey('authority'),
  publicKey('baseTokenFeeAccount'),
  publicKey('quoteTokenFeeAccount'),
  publicKey('initializerAccount'),
  publicKey('pyth'),
  uint64('discountNumerator'),
  uint64('discountDenominator'),
  DTWAP_FEE,
  uint64('minimumTokens'),
  u8('baseMintDecimals'),
  u8('quoteMintDecimals'),
])

export const GET_AVAILABLE_TOKENS_LAYOUT = struct([
  blob(8, 'instruction'),
])

export const DTWAP_AVAILABLE_TOKENS = struct([
  u32('length'),
  int64('amountTo'),
  int64('amountFrom'),
])
