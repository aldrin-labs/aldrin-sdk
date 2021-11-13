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
    tokensUnlocked: new BN(0),
    amount: new BN(0),
  }

  const lastClaimTime = stateAttached?.lastVestedWithdrawTime || 0
  const dateFrom = BN.max(ticket.startTime, new BN(lastClaimTime)) // Select last claim or ticket start

  const rewardsState = snapshots
    .reduce(
      (acc, snapshot) => {
        const { tokensUnlocked, amount } = acc

        const st = new BN(snapshot.time)

        if (dateFrom.gte(st) || ticket.endTime.lte(st)) { // Filter by date
          return { ...acc, tokensUnlocked: snapshot.farmingTokens }
        }

        const poolReward = snapshot.farmingTokens.sub(tokensUnlocked)

        const ticketReward = poolReward
          .mul(ticket.tokensFrozen)
          .div(snapshot.tokensFrozen)

        const currentTime = Date.now() / 1000


        // Decrease reward on vesting period
        const vestingDenominator = currentTime >= (snapshot.time + state.vestingPeriod) ? new BN(1) : PRE_VESTING_DENOMINATOR

        const finalReward = ticketReward.div(vestingDenominator)

        return {
          tokensUnlocked: snapshot.farmingTokens,
          amount: amount.add(finalReward),
        }
      }, initialState
    )

  return rewardsState.amount
}
