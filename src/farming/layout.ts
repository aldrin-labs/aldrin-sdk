import { blob, LayoutObject, seq, struct } from '@solana/buffer-layout';
import { publicKey, uint64 } from '../layout/common';
import { AvailableHarvest, Farm, Farmer, Harvest, HarvestPeriod, Snapshot, Snapshots } from './types';

const HARVEST_PERIOD = struct<HarvestPeriod>([
  uint64('tps'),
  uint64('startsAt'),
  uint64('endsAt'),
])

const HARVEST_LAYOUT = struct<Harvest>([
  publicKey('mint'),
  publicKey('vault'),
  seq(HARVEST_PERIOD, 10, 'periods'),
])

const SNAPSHOTS_LAYOUT = struct<Snapshots>([
  uint64('ringBufferTip'),
  seq(
    struct<Snapshot>([
      uint64('staked'),
      uint64('startedAt'),
    ]), 1000,
    'ringBuffer'),
], 'snapshots')

export const FARM_LAYOUT = struct<Farm>([
  blob(8, 'padding'),
  publicKey('admin'),
  publicKey('stakeMint'),
  publicKey('stakeVault'),
  seq(HARVEST_LAYOUT, 10, 'harvests'),
  SNAPSHOTS_LAYOUT,
  uint64('minSnapshotWindowSlots'),
])

export const AVAILABLE_HARVEST_LAYOUT = struct<AvailableHarvest>([
  publicKey('mint'),
  uint64('tokens'),
])

export const FARMER_LAYOUT = struct<Farmer>([
  blob(8, 'padding'),
  publicKey('authority'),
  publicKey('farm'),
  uint64('staked'),
  uint64('vested'),
  uint64('vestedAt'),
  uint64('calculateNextHarvestFrom'),
  seq(AVAILABLE_HARVEST_LAYOUT, 10, 'harvests'),
])

export const INSTRUCTION_LAYOUT = struct<LayoutObject>([
  blob(8, 'instruction'),
])

export const START_FARMING_INSTRUCTION_LAYOUT = struct<LayoutObject>([
  blob(8, 'instruction'),
  uint64('stake'),
])

export const STOP_FARMING_INSTRUCTION_LAYOUT = struct<LayoutObject>([
  blob(8, 'instruction'),
  uint64('unstakeMax'),
])
