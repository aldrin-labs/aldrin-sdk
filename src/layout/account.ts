import * as BufferLayout from '@solana/buffer-layout';
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js';

import { uint64, publicKey } from './common'

type TYPE_ACCOUNT_LAYOUT = {
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

export const AccountLayout = BufferLayout.struct<TYPE_ACCOUNT_LAYOUT>(
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
