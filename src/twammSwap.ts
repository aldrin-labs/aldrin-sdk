import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PRECISION_NOMINATOR, SOLANA_RPC_ENDPOINT, TokenClient, TokenSwapGetPriceParams, TokenSwapLoadParams, TwAmmClient, TwAmmPair } from '.';
import { SwapBase } from './swapBase';
import { SIDE, Wallet } from './types';

export class TwAmmSwap extends SwapBase {

  constructor(
    private pairs: TwAmmPair[],
    private twammClient: TwAmmClient,
    protected tokenClient: TokenClient,
    protected connection = new Connection(SOLANA_RPC_ENDPOINT),
    private wallet: Wallet | null = null
  ) {
    super(tokenClient, connection,)
  }

  async getPrices(params: TokenSwapGetPriceParams) {
    if (!this.wallet) {
      throw new Error('Please provide wallet')
    }
    const wallet = this.wallet

    const p = this.findPair(params.mintFrom, params.mintTo)
    if (!p) {
      throw new Error('Pool not found')
    }
    const { pair, isInverted } = p
    const orders = await this.twammClient.getOrders({
      pairSettings: pair.pairSettings,
    })


    const { baseMintDecimals, quoteMintDecimals } = pair

    const side = isInverted ? SIDE.BID : SIDE.ASK
    const decimalsFrom = new BN(10).pow(new BN(isInverted ? quoteMintDecimals : baseMintDecimals))
    const decimalsTo = new BN(10).pow(new BN(isInverted ? baseMintDecimals : quoteMintDecimals))

    const ordersForSide = orders.filter((o) => o.side === side)

    const allAmounts = await Promise.all(
      ordersForSide.map(async (order) => {
        return {
          order,
          available: await this.twammClient.getAvailableTokens({
            pairSettings: pair.pairSettings,
            pyth: pair.pyth,
            orderArray: order.orderArray,
            wallet,
          }),
        }

      })
    )

    const pricesWithAmount = allAmounts
      .filter((orderWithAvailable) => orderWithAvailable.available.amountFrom.gtn(0))
      .map((orderWithAvailable) => {
        const price = orderWithAvailable.available.amountFrom
          .mul(PRECISION_NOMINATOR)
          .mul(decimalsFrom)
          .div(orderWithAvailable.available.amountTo)
          .div(decimalsTo)

        return {
          ...orderWithAvailable,
          price: price.toNumber() / PRECISION_NOMINATOR.toNumber(),
        }
      })
      .sort((a, b) => a.price - b.price)


    return pricesWithAmount
  }

  async getPrice(params: TokenSwapGetPriceParams) {

    const prices = await this.getPrices(params)
    return prices[0] ? prices[0].price : 0
  }

  findPair(mintFrom: PublicKey, mintTo: PublicKey) {
    const pair = this.pairs.find((p) =>
      (p.baseTokenMint.equals(mintFrom) && p.quoteTokenMint.equals(mintTo)) ||
      (p.baseTokenMint.equals(mintTo) && p.quoteTokenMint.equals(mintFrom))
    )

    if (!pair) {
      return null
    }
    const isInverted = pair.quoteTokenMint.equals(mintTo)

    return { pair, isInverted }

  }

  static async initialize(params: TokenSwapLoadParams = {}) {
    const { connection = new Connection(SOLANA_RPC_ENDPOINT), wallet } = params

    const twammClient = new TwAmmClient(connection)
    const tokenClient = new TokenClient(connection)

    const pairs = await twammClient.getPairs()

    return new TwAmmSwap(
      pairs,
      twammClient,
      tokenClient,
      connection,
      wallet
    )
  }
}
