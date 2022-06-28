import { Program, Idl, Provider } from '@project-serum/anchor';
import IDL from '../src/idl/poolsV2.json'
import { POOLS_V2_PROGRAM_ADDRESS } from '../src'
import { connection, wallet } from './common'
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { BROKEN_FARMINGS } from './get-broken-farmings';
const program = new Program(IDL as Idl, POOLS_V2_PROGRAM_ADDRESS, new Provider(connection, wallet, Provider.defaultOptions()))

const load = async () => {
  const tickets = await program.account.farmingTicket.all()

  BROKEN_FARMINGS.forEach((farming) => {
    const lastSnapshotTime = new BN(farming.lastSnapshotTime)
    const poolPk = new PublicKey(farming.pool)
    const nowBN = new BN(farming.currentTime)
    const ticketsForPool = tickets
      .filter((t) => t.account.pool.equals(poolPk) && t.account.tokensFrozen.gtn(0))
    const brokenTickets = ticketsForPool
      .filter(t => t.account.endTime.gt(lastSnapshotTime))
      .map((ticket) => {
        const { startTime, statesAttached, endTime } = ticket.account
        const lastWithdraw = (statesAttached as any[]).reduce((acc: BN, s) => {
          if (acc.gt(s.lastWithdrawTime)) {
            return acc as BN
          }
          return s.lastWithdrawTime as BN
        }, new BN(0))

        const lastWithdrawTime = BN.max(startTime, lastWithdraw)
        const endStakeTime = BN.min(nowBN, endTime)
        const stakedTime = endStakeTime.sub(lastWithdrawTime)
        const stakedTokens = parseFloat( ticket.account.tokensFrozen.toString())
        const  periodsMissed =  Math.round(stakedTime.toNumber() / 3600)
        return {
          user: ticket.account.userKey.toString(),
          ticket: ticket.publicKey.toString(),
          stakedTokens,
          startTime: startTime.toString(),
          endtTimeRaw: endTime.toString(),
          endTime: endStakeTime.toString(),
          lastWithdrawTime: lastWithdrawTime.toString(),
          stakedTime: stakedTime.toString(),
          periodsMissed,
          rewardsMissed: Math.round(stakedTokens / farming.totalStaked * periodsMissed * farming.tokensPerPeriod),
        }
      })

    if (brokenTickets.length > 0) {
      console.log(`${farming.parsedName} - Wallet;Ticket;Staked;Start time;End time raw; End time calculated;Last withdraw;Staked time;Periods missed; Rewards missed;`)
      brokenTickets.forEach((t) => console.log(`${t.user};${t.ticket};${t.stakedTokens};${t.startTime};${t.endtTimeRaw};${t.endTime};${t.lastWithdrawTime};${t.stakedTime};${t.periodsMissed};${t.rewardsMissed}`))
    }
  })
}

load()
