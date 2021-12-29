import { Connection, GetProgramAccountsFilter, Transaction } from '@solana/web3.js';
import { TwAmmPair } from './types';
import { SOLANA_RPC_ENDPOINT, TWAMM_PROGRAM_ADDRESS } from '..';
import { TWAMM_PAIR_SETTINGS, TWAMM_ORDER_ARRAY } from './layout'
import {
  GetTwammAvailableTokensParams,
  GetTwAmmOrders,
  GetTwammResponse,
  TwAmm,
  TwammExecuteSwapParams,
  TwAmmOrderArayParsed,
  TwAmmOrderArayResponse,
  TWAMM_AVAILABLE_TOKENS,
} from '.';
import { sendTransaction, simulateTransaction } from '../transactions';
import BN from 'bn.js';
import { SIDE } from '../types';


export class TwAmmClient {
  constructor(private connection: Connection = new Connection(SOLANA_RPC_ENDPOINT)) {
  }

  async getPairs(): Promise<TwAmmPair[]> {
    const searchFilters: GetProgramAccountsFilter[] = [
      { dataSize: TWAMM_PAIR_SETTINGS.span },
    ]

    const accounts = await this.connection.getProgramAccounts(
      TWAMM_PROGRAM_ADDRESS,
      {
        filters: searchFilters,
      }
    )


    return accounts.map((p) => {
      const { account: { data }, pubkey } = p
      const account = TWAMM_PAIR_SETTINGS.decode(data) as TwAmmPair
      return {
        ...account,
        pairSettings: pubkey,
      }
    })
  }

  async getOrders(params: GetTwAmmOrders = {}): Promise<TwAmmOrderArayResponse[]> {
    const { userKey, pairSettings } = params
    const searchFilters: GetProgramAccountsFilter[] = [
      { dataSize: TWAMM_ORDER_ARRAY.span },
    ]

    if (pairSettings) {
      const offset = TWAMM_ORDER_ARRAY.offsetOf('pairSettings')
      if (offset === undefined) {
        throw new Error('No offset for pairSettings')
      }
      searchFilters.push({
        memcmp: {
          offset,
          bytes: pairSettings.toBase58(),
        },
      })
    }

    const accounts = await this.connection.getProgramAccounts(
      TWAMM_PROGRAM_ADDRESS,
      {
        filters: searchFilters,
      }
    )

    return accounts.map((p) => {
      const { account: { data }, pubkey } = p
      const account = TWAMM_ORDER_ARRAY.decode(data) as TwAmmOrderArayParsed
      return {
        ...account,
        side: account.side.ask ? SIDE.ASK : SIDE.BID,
        orders: account.orders
          .filter((o) => o.isInitialized)
          .filter((o) => userKey ? o.authority.equals(userKey) : true),
        orderArray: pubkey,
      }
    })
  }

  async getAvailableTokens(params: GetTwammAvailableTokensParams): Promise<GetTwammResponse> {
    const transaction = new Transaction().add(TwAmm.getAvailableTokensInstruction(params))
    const simulation = await simulateTransaction({
      transaction,
      wallet: params.wallet,
      connection: this.connection,
    })
    if (simulation.value.logs) {
      const prefix = 'Program log: '
      const programLogs = simulation.value.logs.filter((v) => v.startsWith(prefix))

      const lastRow = programLogs[programLogs.length - 1]
      const b64 = lastRow.replace(prefix, '')
      const data = Buffer.from(
        b64,
        'base64',
      );

      return TWAMM_AVAILABLE_TOKENS.decode(data) as GetTwammResponse
    }
    return { amountFrom: new BN(0), amountTo: new BN(0)  }
  }

  /**
   * 
   * @param params 
   * @returns Transaction Id
   */
  async executeSwap(params: TwammExecuteSwapParams): Promise<string> {
    const transaction = new Transaction().add(TwAmm.executeSwapInstruction(params))
    return sendTransaction({ transaction, wallet: params.wallet, connection: this.connection })
  }
}
