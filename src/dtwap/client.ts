import { Connection, PublicKey, Transaction, GetProgramAccountsConfig, AccountInfo } from '@solana/web3.js';
import { GetProgramAccountsFilter } from '../types/web3';
import { DTwapPair } from './types';
import { SOLANA_RPC_ENDPOINT, DTWAP_PROGRAM_ADDRESS } from '..';
import { DTWAP_PAIR_SETTINGS, DTWAP_ORDER_ARRAY } from './layout';
import {
  GetDTwapAvailableTokensParams,
  GetDTwapOrders,
  GetDTwapResponse,
  TwAmm,
  DTwapExecuteSwapParams,
  DTwapOrderArayParsed,
  DTwapOrderArayResponse,
  DTWAP_AVAILABLE_TOKENS,
} from '.';
import { sendTransaction, simulateTransaction, wrapWallet } from '../transactions';
import BN from 'bn.js';
import { SIDE } from '../types';
import base58 from 'bs58';

export class DTwapClient {
  constructor(private connection: Connection = new Connection(SOLANA_RPC_ENDPOINT)) {
  }

  async getPairs(): Promise<DTwapPair[]> {
    const searchFilters: GetProgramAccountsFilter[] = [
      {
        memcmp: {
          offset: 0,
          bytes: base58.encode(Buffer.from([])),
        },
      },
      { dataSize: DTWAP_PAIR_SETTINGS.span },
    ]

    const config: GetProgramAccountsConfig = {
      commitment: 'confirmed',
      encoding: 'base64',
      filters: searchFilters,
    };

    const accounts = await this.connection.getProgramAccounts(
      DTWAP_PROGRAM_ADDRESS,
      config
    );

    return accounts.map((p) => {
      const { account: { data }, pubkey } = p;
      const account = DTWAP_PAIR_SETTINGS.decode(data) as DTwapPair;
      return {
        ...account,
        pairSettings: pubkey,
      };
    });
  }

  async getOrders(params: GetDTwapOrders = {}): Promise<DTwapOrderArayResponse[]> {
    const { userKey, pairSettings } = params;
    const searchFilters: GetProgramAccountsFilter[] = [
      {
        memcmp: {
          offset: 0,
          bytes: base58.encode(Buffer.from([])),
        },
      },
      { dataSize: DTWAP_ORDER_ARRAY.span },
    ];

    if (pairSettings) {
      const offset = DTWAP_ORDER_ARRAY.offsetOf('pairSettings');
      if (offset === undefined) {
        throw new Error('No offset for pairSettings');
      }
      searchFilters.push({
        memcmp: {
          offset,
          bytes: pairSettings.toBase58(),
        },
      });
    }

    const config: GetProgramAccountsConfig = {
      commitment: 'confirmed',
      encoding: 'base64',
      filters: searchFilters,
    };

    const accounts = await this.connection.getProgramAccounts(
      DTWAP_PROGRAM_ADDRESS,
      config
    );

    return accounts.map((p) => {
      const { account: { data }, pubkey } = p;
      const account = DTWAP_ORDER_ARRAY.decode(data) as DTwapOrderArayParsed;
      return {
        ...account,
        side: account.side.ask ? SIDE.ASK : SIDE.BID,
        orders: account.orders
          .filter((o) => o.isInitialized)
          .filter((o) => userKey ? o.authority.equals(userKey) : true),
        orderArray: pubkey,
      };
    });
  }

  async getAvailableTokens(params: GetDTwapAvailableTokensParams): Promise<GetDTwapResponse> {
    const transaction = new Transaction().add(TwAmm.getAvailableTokensInstruction(params));

    const simulation = await simulateTransaction({
      transaction,
      wallet: wrapWallet(params.wallet),
      connection: this.connection,
    });

    if (simulation.value.logs?.length) {
      const prefix = 'Program log: ';
      const programLogs = simulation.value.logs.filter((v) => v.startsWith(prefix));

      const lastRow = programLogs[programLogs.length - 1];
      const b64 = lastRow.replace(prefix, '');
      const data = Buffer.from(
        b64,
        'base64',
      );

      return DTWAP_AVAILABLE_TOKENS.decode(data) as GetDTwapResponse;
    }
    return { amountFrom: new BN(0), amountTo: new BN(0)  };
  }

  /**
   *
   * @param params
   * @returns Transaction Id
   */
  async executeSwap(params: DTwapExecuteSwapParams): Promise<string> {
    const transaction = new Transaction().add(TwAmm.executeSwapInstruction(params));
    return sendTransaction({ transaction, wallet: wrapWallet(params.wallet), connection: this.connection });
  }
}
