import * as BufferLayout from '@solana/buffer-layout';
import { publicKey, uint64 } from '../layout/common';

export const SPL_TOKEN_LAYOUT = BufferLayout.struct([
  BufferLayout.u32('mintAuthorityOption'),
  publicKey('mintAuthority'),
  uint64('supply'),
  BufferLayout.u8('decimals'),
  BufferLayout.u8('isInitialized'),
  BufferLayout.u32('freezeAuthorityOption'),
  publicKey('freezeAuthority'),
]);


export const SPL_ACCOUNT_LAYOUT = BufferLayout.struct(
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
