import { PublicKey } from '@solana/web3.js'
import * as BufferLayout from '@solana/buffer-layout';
import BN from 'bn.js';

import { publicKey, uint64 } from '../layout/common';

type TYPE_SPL_TOKEN_LAYOUT = {
  mintAuthorityOption: number
  mintAuthority: PublicKey
  supply: BN
  decimals: number
  isInitialized: number
  freezeAuthorityOption: number
  freezeAuthority: PublicKey
}

type SPL_ACCOUNT_LAYOUT = {
  mint: PublicKey
  owner: PublicKey
  amount: BN
  delegateOption: number
  delegate: PublicKey
  state: number
  isNativeOption: number
  isNative: number
  delegatedAmount: BN
  closeAuthorityOption: number
  closeAuthority: PublicKey
}

export const SPL_TOKEN_LAYOUT = BufferLayout.struct<TYPE_SPL_TOKEN_LAYOUT>([
  BufferLayout.u32('mintAuthorityOption'),
  publicKey('mintAuthority'),
  uint64('supply'),
  BufferLayout.u8('decimals'),
  BufferLayout.u8('isInitialized'),
  BufferLayout.u32('freezeAuthorityOption'),
  publicKey('freezeAuthority'),
]);

export const SPL_ACCOUNT_LAYOUT = BufferLayout.struct<SPL_ACCOUNT_LAYOUT>(
  [
    publicKey('mint'),
    publicKey('owner'),
    uint64('amount'),
    BufferLayout.u32('delegateOption'),
    publicKey('delegate'),
    BufferLayout.u8('state'),
    BufferLayout.u32('isNativeOption'),
    uint64('isNative', true),
    uint64('delegatedAmount'),
    BufferLayout.u32('closeAuthorityOption'),
    publicKey('closeAuthority'),
  ],
);
