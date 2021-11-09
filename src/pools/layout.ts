
import { struct, u8 } from '@solana/buffer-layout';

import { publicKey, uint64 } from '../layout/common';


export const POOL_LAYOUT = struct([
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
    uint64('tradeFeeNumerator'),
    uint64('tradeFeeDenominator'),
    uint64('ownerTradeFeeNumerator'),
    uint64('ownerTradeFeeDenominator'),
    uint64('ownerWithdrawFeeNumerator'),
    uint64('ownerWithdrawFeeDenominator'),
  ], 'fees'),
])
