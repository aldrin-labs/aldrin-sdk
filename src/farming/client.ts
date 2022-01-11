import { Connection, GetProgramAccountsFilter, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import {
  ClaimFarmedParams,
  FARMING_STATE_LAYOUT,
  FARMING_TICKET_LAYOUT, GetFarmingSnapshotParams, SNAPSHOT_QUEUE_LAYOUT,
} from '.';
import { PoolClient, POOLS_PROGRAM_ADDRESS, POOLS_V2_PROGRAM_ADDRESS, SOLANA_RPC_ENDPOINT, TokenClient } from '..';
import { createInstruction, sendTransaction } from '../transactions';
import { Farming } from './farming';
import { EndFarmingParams, FarmingSnapshotQueue, FarmingState, FarmingTicket, GetFarmingStateParams, GetFarmingTicketsParams, StartFarmingParams } from './types';


/**
 * Aldrin AMM Pools farming(staking) client
 */
export class FarmingClient {


  private tokenClient = new TokenClient(this.connection)
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
    const programIds = params.poolVersion ?
      [PoolClient.getPoolAddress(params.poolVersion)] :
      [POOLS_PROGRAM_ADDRESS, POOLS_V2_PROGRAM_ADDRESS]


    const states = (await Promise.all(
      programIds.map((programId) => this.connection.getProgramAccounts(programId, {
        commitment: 'finalized',
        filters: [
          { dataSize: FARMING_STATE_LAYOUT.span },
          { memcmp: { offset: FARMING_STATE_LAYOUT.offsetOf('pool') || 0, bytes: params.poolPublicKey.toBase58() } },
        ],
      }))
    )).flat()

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
    const programIds = params.poolVersion ?
      [PoolClient.getPoolAddress(params.poolVersion)] :
      [POOLS_PROGRAM_ADDRESS, POOLS_V2_PROGRAM_ADDRESS]

    const filters: GetProgramAccountsFilter[] = [
      { dataSize: FARMING_TICKET_LAYOUT.span },
    ]

    if (params.pool) {
      filters.push({ memcmp: { offset: FARMING_TICKET_LAYOUT.offsetOf('pool') || 0, bytes: params.pool.toBase58() } })
    }

    if (params.userKey) {
      filters.push({ memcmp: { offset: FARMING_TICKET_LAYOUT.offsetOf('userKey') || 0, bytes: params.userKey.toBase58() } })
    }

    const tickets = (await Promise.all(
      programIds.map((programId) => this.connection.getProgramAccounts(programId, {
        filters,
      })
      )
    )).flat()

    return tickets.map((t) => {
      const data = FARMING_TICKET_LAYOUT.decode(t.account.data) as FarmingTicket
      return {
        ...data,
        farmingTicketPublicKey: t.pubkey,
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

    const farmingTicketInstruction = await createInstruction({
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

    return sendTransaction({
      transaction,
      wallet,
      connection: this.connection,
      partialSigners: [farmingTicket],
    })


  }


  /**
   * End farming
   */

  async endFarming(params: EndFarmingParams) {
    const programId = PoolClient.getPoolAddress(params.poolVersion || 1)

    const { poolPublicKey, wallet } = params
    const [poolSigner] = await PublicKey.findProgramAddress(
      [poolPublicKey.toBuffer()],
      programId,
    )

    const transaction = new Transaction()

    transaction.add(
      Farming.endFarmingInstruction({
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
      Farming.claimFarmedInstruction({
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
