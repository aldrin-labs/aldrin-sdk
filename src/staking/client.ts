import {Connection, GetProgramAccountsFilter, Keypair, PublicKey, Transaction} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  STAKING_TICKET_LAYOUT,
  UNSTAKING_TICKET_LAYOUT,
} from '.';
import {
  FARMING_TICKET_LAYOUT,
  StakingTicket,
  GetStakingTicketsParams,
  PoolClient,
  SOLANA_RPC_ENDPOINT,
  STAKING_PROGRAM_ADDRESS, Farming,
} from '..';
import { createAccountInstruction, sendTransaction } from '../transactions';
import { Staking } from './staking';
import { DoStakingParams, DoUnstakingParams } from './types';
import {PoolFarmingResponse} from '../api/types';
import {farmingClient, stakingClient, wallet} from '../../examples/common';

/**
 * Aldrin Staking client
 */
export class StakingClient {
  constructor(private connection: Connection = new Connection(SOLANA_RPC_ENDPOINT)) {}

  async doStake(params: DoStakingParams): Promise<string> {
    const { wallet, stakingPool, tokenAmount } = params

    const programId = STAKING_PROGRAM_ADDRESS

    const stakingTicket = Keypair.generate()

    const stakingTicketInstruction = await createAccountInstruction({
      size: STAKING_TICKET_LAYOUT.span,
      connection: this.connection,
      wallet,
      programId,
      newAccountPubkey: stakingTicket.publicKey,
    })

    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    })

    const tokenAccount = tokenAccounts.value
      .find((item) => item.account.data.parsed.info.mint === stakingPool.poolTokenMint)

    if (!tokenAccount) {
      throw new Error('No account - cannot stake!')
    }

    if (!stakingPool.farming) {
      throw new Error('Dont have any farming tickets - cannot stake!')
    }

    const farmingStateItem = stakingPool.farming.find((item: PoolFarmingResponse) => item.tokensTotal !== item.tokensUnlocked)

    if (!farmingStateItem) {
      throw new Error('Dont have farming item - cannot stake!')
    }

    const stakingTransaction = Staking.stakingInstruction({
      poolPublicKey: new PublicKey(stakingPool.swapToken),
      farmingState: new PublicKey(farmingStateItem.farmingState),
      stakingVault: new PublicKey(stakingPool.stakingVault),
      userStakingTokenAccount: new PublicKey(tokenAccount.pubkey),
      userKey: wallet.publicKey,
      tokenAmount,
      stakingTicket: stakingTicket.publicKey,
      programId,
    })

    const transaction = new Transaction()

    transaction.add(stakingTicketInstruction)
    transaction.add(stakingTransaction)

    return sendTransaction({
      transaction,
      wallet,
      connection: this.connection,
      partialSigners: [stakingTicket],
    })
  }

  async doUnstake(params: DoUnstakingParams): Promise<string> {
    const { wallet, stakingPool, stakingTicket } = params

    const programId = STAKING_PROGRAM_ADDRESS

    const [poolSigner] = await PublicKey.findProgramAddress(
[new PublicKey(stakingPool.swapToken).toBuffer()],
      programId
    )

    if (!stakingPool.farming) {
      throw new Error('Dont have any farming tickets - cannot stake!')
    }

    const farmingStateItem = stakingPool.farming.find((item: PoolFarmingResponse) => item.tokensTotal !== item.tokensUnlocked)

    if (!farmingStateItem) {
      throw new Error('Dont have farming item - cannot stake!')
    }

    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    })

    const tokenAccount = tokenAccounts.value
        .find((item) => item.account.data.parsed.info.mint === stakingPool.poolTokenMint)

    if (!tokenAccount) {
      throw new Error('No account - cannot stake!')
    }

    const transaction = new Transaction()

    transaction.add(
      Staking.unstakingInstruction({
        poolPublicKey: new PublicKey(stakingPool.swapToken),
        farmingState: new PublicKey(farmingStateItem.farmingState),
        stakingSnapshots: new PublicKey(farmingStateItem.farmingSnapshots),
        stakingVault: new PublicKey(stakingPool.stakingVault),
        lpTokenFreezeVault: new PublicKey(stakingPool.stakingVault),
        userStakingTokenAccount: new PublicKey(tokenAccount.pubkey),
        poolSigner,
        userKey: wallet.publicKey,
        programId,
        stakingTicket,
      })
    )

    return sendTransaction({
      wallet: wallet,
      connection: this.connection,
      transaction,
    })
  }

  async getStakingTickets(params: GetStakingTicketsParams = {}): Promise<StakingTicket[]> {
    const programId = STAKING_PROGRAM_ADDRESS

    const filters: GetProgramAccountsFilter[] = [
      { dataSize: STAKING_TICKET_LAYOUT.span },
    ]

    if (params.userKey) {
      filters.push({ memcmp: { offset: STAKING_TICKET_LAYOUT.offsetOf('userKey') || 0, bytes: params.userKey.toBase58() } })
    }

    const tickets = await this.connection.getProgramAccounts(programId, {
      filters,
    })

    return tickets.map((t) => {
      const data = STAKING_TICKET_LAYOUT.decode(t.account.data) as StakingTicket
      return {
        ...data,
        stakingTicketPublicKey: t.pubkey,
      }
    })
  }
}
