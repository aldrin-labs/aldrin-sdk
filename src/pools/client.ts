import { Connection } from '@solana/web3.js';
import { Pool, POOLS_PROGRAM_ADDRESS, POOL_LAYOUT } from '.';
import { Wallet } from '../types';

export class PoolClient {

  constructor(private connection: Connection, private wallet: Wallet) {
  }


  async getPools(): Promise<Pool[]> {
    const accounts = this.connection.getProgramAccounts(
      POOLS_PROGRAM_ADDRESS,
      {
        filters: [
          { dataSize: POOL_LAYOUT.span },
        ],
      }
    )

    console.log('accounts: ',accounts)
    return []
    // const pools = await this.program.account.pool.all()

    // return pools.map((p: { account: PoolRpcResponse, publicKey: PublicKey }) => {
    //   const { account, publicKey } = p
    //   const { fees } = account

    //   return {
    //     ...account,
    //     fees: {
    //       tradeFeeNumerator: fees.tradeFeeNumerator.toNumber(),
    //       tradeFeeDenominator: fees.tradeFeeDenominator.toNumber(),
    //       ownerTradeFeeNumerator: fees.ownerTradeFeeNumerator.toNumber(),
    //       ownerTradeFeeDenominator: fees.ownerTradeFeeDenominator.toNumber(),
    //       ownerWithdrawFeeNumerator: fees.ownerWithdrawFeeNumerator.toNumber(),
    //       ownerWithdrawFeeDenominator: fees.ownerWithdrawFeeDenominator.toNumber(),
    //     },
    //     poolPublicKey: publicKey,
    //   }
    // })
  }
}
