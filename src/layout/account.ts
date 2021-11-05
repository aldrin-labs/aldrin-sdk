import * as BufferLayout from '@solana/buffer-layout';
import { uint64, publicKey } from './common'


export const AccountLayout = BufferLayout.struct(
  [
    publicKey('mint'),
    publicKey('owner'),
    uint64('amount'),
    BufferLayout.u32('delegateOption'),
    publicKey('delegate'),
    BufferLayout.u8('state'),
    BufferLayout.u32('isNativeOption'),
    uint64('isNative'),
    uint64('delegatedAmount'),
    BufferLayout.u32('closeAuthorityOption'),
    publicKey('closeAuthority'),
  ],
);
