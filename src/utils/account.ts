import { PublicKey } from '@solana/web3.js';

export function account(pubkey: PublicKey, isWritable = false, isSigner = false) {
  return {
    pubkey,
    isWritable,
    isSigner,
  };
}
