import { Connection, GetProgramAccountsFilter, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import {
  ClaimFarmedParams,
  EndFarmingsParams,
  FarmingCalc,
  FARMING_CALC_LAYOUT,
  FARMING_STATE_LAYOUT,
  FARMING_TICKET_LAYOUT, GetFarmingCalcParams, GetFarmingSnapshotParams, SNAPSHOT_QUEUE_LAYOUT,
} from '.';
import { PoolClient, SOLANA_RPC_ENDPOINT } from '..';
import { createAccountInstruction, sendTransaction } from '../transactions';
import { Farming } from './farming';
import {
  EndFarmingParams,
  FarmingSnapshotQueue,
  FarmingState,
  FarmingTicket,
  GetFarmingStateParams,
  GetFarmingTicketsParams,
  StartFarmingParams,
} from './types';


/**
 * Aldrin AMM Pools farming(staking) client
 */
export class FarmingClient {


  constructor(private connection: Connection = new Connection(SOLANA_RPC_ENDPOINT)) {
  }


  /**
   * Get farming state for pool
   * @param params 
   * @returns 
   */

  async getFarmingState(
    params: GetFarmingStateParams
  ): Promise<FarmingState[]> {
    const programId = PoolClient.getPoolAddress(params.poolVersion || 1)
    const states = await this.connection.getProgramAccounts(programId, {
      commitment: 'finalized',
      filters: [
        { dataSize: FARMING_STATE_LAYOUT.span },
        { memcmp: { offset: FARMING_STATE_LAYOUT.offsetOf('pool') || 0, bytes: params.poolPublicKey.toBase58() } },
      ],
    })

    return states.map((s) => {
      const snapshot = FARMING_STATE_LAYOUT.decode(s.account.data) as FarmingState

      return {
        ...snapshot,
        farmingStatePublicKey: s.pubkey,
      }
    })
  }


  /**
   * Get farming tickets for pool/user
   * @param params 
   * @returns 
   */

  async getFarmingTickets(params: GetFarmingTicketsParams = {}): Promise<FarmingTicket[]> {
    const programId = PoolClient.getPoolAddress(params.poolVersion || 1)


    const filters: GetProgramAccountsFilter[] = [
      { dataSize: FARMING_TICKET_LAYOUT.span },
    ]

    if (params.pool) {
      filters.push({ memcmp: { offset: FARMING_TICKET_LAYOUT.offsetOf('pool') || 0, bytes: params.pool.toBase58() } })
    }

    if (params.userKey) {
      filters.push({ memcmp: { offset: FARMING_TICKET_LAYOUT.offsetOf('userKey') || 0, bytes: params.userKey.toBase58() } })
    }

    const tickets = await this.connection.getProgramAccounts(programId, {
      filters,
    })

    return tickets.map((t) => {
      const data = FARMING_TICKET_LAYOUT.decode(t.account.data) as FarmingTicket
      return {
        ...data,
        farmingTicketPublicKey: t.pubkey,
      }
    })
  }


  /**
   * Get farming calc accounts for farming and/or user
   * @param params Search params (farming state, user)
   * @returns 
   */

  async getFarmingCalcAccounts(params: GetFarmingCalcParams = {}): Promise<FarmingCalc[]> {
    const programId = PoolClient.getPoolAddress(params.poolVersion || 1)

    const filters: GetProgramAccountsFilter[] = [
      { dataSize: FARMING_CALC_LAYOUT.span },
    ]

    if (params.farmingState) {
      filters.push({ memcmp: { offset: FARMING_CALC_LAYOUT.offsetOf('farmingState') || 0, bytes: params.farmingState.toBase58() } })
    }

    if (params.userKey) {
      filters.push({ memcmp: { offset: FARMING_CALC_LAYOUT.offsetOf('userKey') || 0, bytes: params.userKey.toBase58() } })
    }

    const farmingCalcs = await this.connection.getProgramAccounts(programId, {
      filters,
    })

    return farmingCalcs.map((ca) => {
      const data = FARMING_CALC_LAYOUT.decode(ca.account.data) as FarmingCalc
      return {
        ...data,
        farmingCalcPublicKey: ca.pubkey,
      }
    })
  }

  /**
   * Start farming, creates Farming Ticket
   * @param params 
   * @returns Transaction Id
   */

  async startFarming(params: StartFarmingParams): Promise<string> {
    const programId = PoolClient.getPoolAddress(params.poolVersion || 1)

    const { wallet } = params
    const farmingTicket = Keypair.generate()

    const partialSigners = [farmingTicket]
    const farmingTicketInstruction = await createAccountInstruction({
      size: FARMING_TICKET_LAYOUT.span,
      connection: this.connection,
      wallet,
      programId,
      newAccountPubkey: farmingTicket.publicKey,
    })

    const startFarmingTransaction = Farming.startFarmingInstruction({
      ...params,
      userKey: wallet.publicKey,
      farmingTicket: farmingTicket.publicKey,
      programId,
    })


    const transaction = new Transaction()

    transaction.add(farmingTicketInstruction)
    transaction.add(startFarmingTransaction)

    const states = await this.getFarmingState({
      poolVersion: params.poolVersion,
      poolPublicKey: params.poolPublicKey,
    })

    const calcForUser = (await this.getFarmingCalcAccounts({
      userKey: wallet.publicKey,
      poolVersion: params.poolVersion,
    })).map((ca) => ca.farmingState.toBase58())

    const statesWithoutCalc = states
      .filter((state) => !state.tokensUnlocked.eq(state.tokensTotal)) // Has locked tokens -> state not finished yet    
      .filter((state) => !calcForUser.includes(state.farmingStatePublicKey.toString()))

    const createCalcInstructions = await Promise.all(statesWithoutCalc.map(async (fs) => {
      const farmingCalc = Keypair.generate()
      partialSigners.push(farmingCalc)
      const farmingCalcInstruction = await createAccountInstruction({
        size: FARMING_CALC_LAYOUT.span,
        connection: this.connection,
        wallet,
        programId,
        newAccountPubkey: farmingCalc.publicKey,
      })

      const calcInstruction = Farming.createCalcAccountInstruction({
        farmingCalc: farmingCalc.publicKey,
        farmingTicket: farmingTicket.publicKey,
        userKey: wallet.publicKey,
        farmingState: fs.farmingStatePublicKey,
        initializer: wallet.publicKey,
        programId,
      })

      return [farmingCalcInstruction, calcInstruction]
    }))

    if (createCalcInstructions.length) {
      transaction.add(...createCalcInstructions.flat())
    }

    return sendTransaction({
      transaction,
      wallet,
      connection: this.connection,
      partialSigners,
    })


  }


  /**
   * End farming
   */

  async endFarming(params: EndFarmingParams) {

    const { wallet } = params
    const transaction = new Transaction()

    transaction.add(
      await this.endFarmingInstruction(params)
    )

    return sendTransaction({
      wallet: wallet,
      connection: this.connection,
      transaction,
    })
  }

  /**
   * End multiple farmings for 1 pool
   */

  async endFarmings(params: EndFarmingsParams) {

    const { wallet, farmingTickets } = params


    if (farmingTickets.length === 0) {
      throw new Error('No tickets provided')
    }

    const instructions = await Promise.all(
      farmingTickets.map((t) => this.endFarmingInstruction({
        ...params,
        farmingTicket: t,
      })
      )
    )

    const transaction = new Transaction()
    // TODO: split into multiple transactions, by 20 tickets per transaction

    transaction.add(...instructions)

    return sendTransaction({
      wallet: wallet,
      connection: this.connection,
      transaction,
    })
  }

  async endFarmingInstruction(params: EndFarmingParams) {
    const programId = PoolClient.getPoolAddress(params.poolVersion || 1)

    const { poolPublicKey, wallet } = params
    const [poolSigner] = await PublicKey.findProgramAddress(
      [poolPublicKey.toBuffer()],
      programId,
    )


    return Farming.endFarmingInstruction({
      ...params,
      poolSigner,
      userKey: wallet.publicKey,
      programId,
    })


  }

  /**
   * Claim staking rewards
   * @param params 
   * @returns Transaction Id
   */
  async claimFarmed(params: ClaimFarmedParams): Promise<string> {
    const programId = PoolClient.getPoolAddress(params.poolVersion || 1)

    const { poolPublicKey, wallet } = params
    const [poolSigner] = await PublicKey.findProgramAddress(
      [poolPublicKey.toBuffer()],
      programId,
    )

    const transaction = new Transaction()

    transaction.add(
      Farming.withdrawFarmedInstruction({
        ...params,
        poolSigner,
        userKey: wallet.publicKey,
        programId,
      })
    )

    return sendTransaction({
      wallet: wallet,
      connection: this.connection,
      transaction,
    })
  }

  /**
   * Get farming snapshots. Useful for reward calculations.
   * // TODO: add caching
   * 
   */
  async getFarmingSnapshotsQueue(params: GetFarmingSnapshotParams): Promise<FarmingSnapshotQueue[]> {
    const programId = PoolClient.getPoolAddress(params.poolVersion || 1)
    const snapshots = await this.connection.getProgramAccounts(programId, {
      filters: [
        { dataSize: SNAPSHOT_QUEUE_LAYOUT.span },
      ],
    })

    return snapshots.map((s) => {
      const bucket = SNAPSHOT_QUEUE_LAYOUT.decode(s.account.data) as FarmingSnapshotQueue
      return {
        ...bucket,
        queuePublicKey: s.pubkey,
      }
    })
  }
}
