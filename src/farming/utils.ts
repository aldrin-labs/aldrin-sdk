import BN from 'bn.js'
import { PRE_VESTING_DENOMINATOR, PRE_VESTING_NUMERATOR, VESTING_DENOMINATOR, VESTING_NUMERATOR } from '../pools'
import { AttachedFarmingState, FarmingSnapshot, FarmingTicket } from './types'
import { FarmingState } from '../types'

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
}): { unclaimedTokens: BN, unclaimedSnapshots: number } => {
  const initialState = {
    tokensUnlocked: new BN(0),
    amount: new BN(0),
    unclaimedSnapshots: 0,
  }

  const lastClaimTime = stateAttached?.lastWithdrawTime || ticket.startTime.toNumber()
  const lastVestedClaimTime = stateAttached?.lastVestedWithdrawTime || ticket.startTime.toNumber()

  const rewardsState = snapshots
    .reduce(
      (acc, snapshot) => {
        const { tokensUnlocked, amount, unclaimedSnapshots } = acc

        const snapshotTime = new BN(snapshot.time)

        if (ticket.startTime.gte(snapshotTime) || ticket.endTime.lte(snapshotTime)) { // Filter by date
          return { ...acc, tokensUnlocked: snapshot.farmingTokens }
        }

        const poolReward = snapshot.farmingTokens.sub(tokensUnlocked)

        const ticketMaxReward = poolReward
          .mul(ticket.tokensFrozen)
          .div(snapshot.tokensFrozen)


        const currentTime = Date.now() / 1000


        // Decrease reward on vesting period
        const preVestingReward = lastClaimTime < snapshot.time
          ? ticketMaxReward.mul(PRE_VESTING_NUMERATOR).div(PRE_VESTING_DENOMINATOR)
          : new BN(0)

        const vestingReward = lastVestedClaimTime < snapshot.time && snapshot.time + state.vestingPeriod > currentTime
          ? ticketMaxReward.mul(VESTING_NUMERATOR).div(VESTING_DENOMINATOR)
          : new BN(0)


        const finalReward = preVestingReward.add(vestingReward)

        return {
          tokensUnlocked: snapshot.farmingTokens,
          amount: amount.add(finalReward),
          unclaimedSnapshots: finalReward.gtn(0) ? unclaimedSnapshots + 1 : 0,
        }
      }, initialState
    )

  return { unclaimedTokens: rewardsState.amount, unclaimedSnapshots: rewardsState.unclaimedSnapshots }
}
