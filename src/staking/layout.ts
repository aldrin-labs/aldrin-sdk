import { blob, seq, struct, LayoutObject } from '@solana/buffer-layout';
import { publicKey, uint64 } from '../layout/common';

export const STAKING_TICKET_LAYOUT = struct<LayoutObject>([
  blob(8, 'padding'),
  uint64('tokensFrozen'),
  uint64('startTime'),
  uint64('endTime'),
  publicKey('userKey'),
  publicKey('pool'),
  uint64('nextAttached'),
  seq(
    struct<LayoutObject>([
      publicKey('farmingState'),
      uint64('lastWithdrawTime'),
      uint64('lastVestedWithdrawTime'),
    ]),
    10, 'statesAttached'),
])

export const STAKING_INSTRUCTION_LAYOUT = struct<LayoutObject>([
  blob(8, 'instruction'),
  uint64('tokenAmount'),
])

export const UNSTAKING_INSTRUCTION_LAYOUT = struct<LayoutObject>([
    blob(8, 'instruction'),
])
