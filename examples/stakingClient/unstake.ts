import { wallet } from '../common'
import { AldrinApiPoolsClient, DEFAULT_FARMING_TICKET_END_TIME, StakingClient } from '../../src'
import { log } from '../../src/utils';

async function unstaking(): Promise<string[]> {
  const aldrinPoolsClient = new AldrinApiPoolsClient()
  const stakingClient = new StakingClient()

  const stakingPool = await aldrinPoolsClient.getStakingPoolInfo()

  const tickets = await stakingClient.getStakingTickets({ userKey: wallet.publicKey })
  const ticketsToClose = tickets.filter((ticket) => {
    return ticket.endTime.eq(DEFAULT_FARMING_TICKET_END_TIME)
  })

  if (!tickets.length) {
    throw new Error('No tickets, nothing to check')
  }

  const promises = ticketsToClose.map((ticket) => {
    return stakingClient.doUnstake({
      wallet,
      stakingPool,
      stakingTicket: ticket.stakingTicketPublicKey,
    })
  })

  const result = await Promise.all(promises)

  log('LOG: Executed successfully.')

  return result
}

unstaking()
