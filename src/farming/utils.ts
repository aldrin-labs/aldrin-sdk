import BN from 'bn.js'
import { PRE_VESTING_DENOMINATOR } from '../pools'
import { AttachedFarmingState, FarmingSnapshot, FarmingState, FarmingTicket } from './types'

export const getFarmingRewardsFromSnapshots = ({
  ticket,
  state,
  stateAttached,
  snapshots,
}: {
  ticket: FarmingTicket
  state: FarmingState
  stateAttached?: AttachedFarmingState
  snapshots: FarmingSnapshot[]
}): BN => {
  const initialState = {
    prevSnapshot: {
      tokensFrozen: new BN(0),
      farmingTokens: new BN(0),
    },
    amount: new BN(0),
  }

  const rewardsState = snapshots
    .reduce(
      (acc, snapshot) => {
        const { prevSnapshot, amount } = acc

        // Skip snapshots on other than ticket time
        if (ticket.startTime.gte(new BN(snapshot.time)) || ticket.endTime.lte(new BN(snapshot.time)) || (
          stateAttached && stateAttached.lastVestedWithdrawTime > snapshot.time
        )) {
          return {...acc, prevSnapshot: snapshot}
        }

        const totalUserSnapshotReward = snapshot.farmingTokens
          .sub(prevSnapshot.farmingTokens)
          .mul(ticket.tokensFrozen)
          .div(snapshot.tokensFrozen)

        const currentTime = Date.now() / 1000


        // Decrease reward on vesting period
        const vestingDivider = currentTime >= snapshot.time + state.vestingPeriod ? new BN(1) : PRE_VESTING_DENOMINATOR

        const snapshotReward = totalUserSnapshotReward
          .div(vestingDivider)

        return {
          prevSnapshot: snapshot,
          amount: amount.add(snapshotReward),
        }
      }, initialState
    )

  return rewardsState.amount
}
