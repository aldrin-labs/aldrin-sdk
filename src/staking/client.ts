import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  STAKING_TICKET_LAYOUT,
} from '.';
import { SOLANA_RPC_ENDPOINT, STAKING_PROGRAM_ADDRESS} from '..';
import { createAccountInstruction, sendTransaction } from '../transactions';
import { Staking } from './staking';
import { MakeStakingParams } from './types';
import { FarmingState } from '../types'

/**
 * Aldrin Staking client
 */
export class StakingClient {
  constructor(private connection: Connection = new Connection(SOLANA_RPC_ENDPOINT)) {}

  async doStake(params: MakeStakingParams): Promise<string> {
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

    const farmingStateItem = stakingPool.farming.find((item: FarmingState) => item.tokensTotal !== item.tokensUnlocked)

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
}
