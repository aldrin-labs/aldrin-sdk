import BN from 'bn.js';

interface SnapshotRpcResponse {
  isInitialized: boolean
  tokensFrozen: BN
  farmingTokens: BN
  time: BN
}

export interface SnapshotQueueRpcResponse {
  nextIndex: BN
  snapshots: SnapshotRpcResponse[]
}

export interface Snapshot {
  isInitialized: boolean
  tokensFrozen: BN
  farmingTokens: BN
  time: number
}

export interface SnapshotQueue {
  nextIndex: number
  snapshots: Snapshot[]
}

