import { Program, Idl, Provider } from '@project-serum/anchor';
import IDL from '../src/idl/poolsV2.json'
import { DEFAULT_FARMING_TICKET_END_TIME, POOLS_V2_PROGRAM_ADDRESS } from '../src'
import { connection, wallet } from './common'
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';

const program = new Program(IDL as Idl, POOLS_V2_PROGRAM_ADDRESS, new Provider(connection, wallet, Provider.defaultOptions()))

// console.log('IDL:', IDL)

const load = async () => {
  const tickets = await program.account.farmingTicket.all()

  const COBAN_PK = new PublicKey('AyPRyLBnwYnsLU9c51JJgk9Vvpgj2hcxWD7Yp9S5SWcB')
  const ticketsForPool = tickets
    .filter((t) => t.account.pool.equals(COBAN_PK))

  const activeTickets = ticketsForPool
    .filter(t => t.account.endTime.eq(DEFAULT_FARMING_TICKET_END_TIME))
  const nowBN = new BN(Date.now() / 1000)
  // console.log(activeTickets.map((t) => t.account))
  const totalStaked = activeTickets.reduce((acc, t) => acc.add(t.account.tokensFrozen), new BN(0))
  console.log(`totalStaked;${totalStaked.toString()}`)
  // 144847048565645

  const processing = ticketsForPool.map((ticket) => {
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
    return {
      user: ticket.account.userKey.toString(),
      ticket: ticket.publicKey.toString(),
      stakedTokens: ticket.account.tokensFrozen.toString(),
      startTime: startTime.toString(),
      endTime: endStakeTime.toString(),
    }
  })

  console.log('Wallet;Ticket;Staked;Start;End;')
  processing.forEach((t) => console.log(`${t.user};${t.ticket};${t.stakedTokens};${t.startTime};${t.endTime};`))
}

load()
