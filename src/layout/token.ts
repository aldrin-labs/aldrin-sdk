import * as BufferLayout from '@solana/buffer-layout';
import { uint64, publicKey } from './common'

export const TokenLayout = BufferLayout.struct([
  BufferLayout.u32('mintAuthorityOption'),
  publicKey('mintAuthority'),
  uint64('supply'),
  BufferLayout.u8('decimals'),
  BufferLayout.u8('isInitialized'),
  BufferLayout.u32('freezeAuthorityOption'),
  publicKey('freezeAuthority'),
]);
