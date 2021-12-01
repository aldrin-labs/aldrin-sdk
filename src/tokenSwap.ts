import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { AccountInfo, Connection, ParsedAccountData, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { Farming, FarmingClient, TokenClient, TokenMintInfo } from '.';
import {
  PoolClient,
  PoolRpcResponse,
  SIDE,
  SOLANA_RPC_ENDPOINT,
  SWAP_FEE_NUMERATOR,
  SWAP_FEE_DENUMERATOR,
  TokenSwapAddlLiquidityParams, TokenSwapGetFarmedParams, TokenSwapGetPriceParams,
  TokenSwapLoadParams,
  TokenSwapParams,
  TokenSwapWithdrawLiquidityParams,
} from './pools';
import { sendTransaction } from './transactions';
import { Wallet } from './types';


const PRECISION_NOMINATOR = new BN(1_000_000) // BN precision
/**
 * High-level API for Aldrin AMM Pools 
 */
export class TokenSwap {
  private mintInfos = new Map<string, TokenMintInfo>()
  private walletTokens = new Map<
    string,
    Array<{
      pubkey: PublicKey;
      account: AccountInfo<ParsedAccountData>;
    }>
  >();

  constructor(
    private pools: PoolRpcResponse[],
    private poolClient: PoolClient,
    private tokenClient: TokenClient,
    private farmingClient: FarmingClient,
    private connection = new Connection(SOLANA_RPC_ENDPOINT),
    private wallet: Wallet | null = null
  ) {

  }

  findPool(mintFrom: PublicKey, mintTo: PublicKey) {
    const pool = this.pools.find((p) =>
      (p.baseTokenMint.equals(mintFrom) && p.quoteTokenMint.equals(mintTo)) ||
      (p.baseTokenMint.equals(mintTo) && p.quoteTokenMint.equals(mintFrom))
    )

    if (!pool) {
      return null
    }
    const isInverted = pool.quoteTokenMint.equals(mintTo)

    return { pool, isInverted }

  }

  async swap(params: TokenSwapParams) {
    const resolvedInputs = await this.resolveSwapInputs(params)
    return this.poolClient.swap(resolvedInputs)
  }

  /**
   * Make tokens swap
   * @returns Transaction Id
   */

  private async resolveSwapInputs(params: TokenSwapParams) {
    const { wallet = this.wallet, mintFrom, mintTo } = params
    let { minIncomeAmount, outcomeAmount } = params

    if (!wallet) {
      throw new Error('Wallet not provided')
    }

    const poolSearch = this.findPool(mintFrom, mintTo)

    if (!poolSearch) {
      throw new Error('Pool for mints not found') // TODO: pools routing
    }

    const { pool, isInverted } = poolSearch

    const { baseTokenVault, quoteTokenVault } = pool


    const [
      baseVaultAccount,
      quoteVaultAccount,
    ] = await Promise.all([
      this.tokenClient.getTokenAccount(baseTokenVault),
      this.tokenClient.getTokenAccount(quoteTokenVault),
    ])


    /**
    * 
    * Buy BASE on B QUOTE
    * 
    * Calculate exact buy price & amount
    * Calculation does not consider any fees, please check {PoolRpcResponse#fees}
    * 
    * X - Base token amount in pool
    * Y - Quote token amount in pool
    * A - Token amount to buy 
    * B - Quote token amount  
    * 
    * X * Y = (X - A) * (Y + B)
    * 
    * X - A = (X * Y) / (Y + B)
    * 
    * A = X - (X * Y) / (Y + B)
    * 
    * 
    * 
    * Y + B = (X * Y)  / (X - A)
    * 
    * B = (X * Y)  / (X - A) - Y
    * 
    * */

    const X = isInverted ? quoteVaultAccount.amount : baseVaultAccount.amount
    const Y = isInverted ? baseVaultAccount.amount : quoteVaultAccount.amount


    if (!minIncomeAmount) {
      if (!outcomeAmount) {
        throw new Error('No amounts defined') // Type-check hack
      }

      const B = outcomeAmount
      minIncomeAmount = X
        .sub(
          X.mul(Y)
            .div(
              Y.add(B)
            )
        )
    }

    if (!outcomeAmount) {
      const A = minIncomeAmount
      outcomeAmount = X
        .mul(Y)
        .div(
          X.sub(A)
        )
        .sub(Y)
    }


    const walletTokens = await this.getWalletTokens(wallet)

    const baseMint = baseVaultAccount.mint.toBase58()
    const quoteMint = quoteVaultAccount.mint.toBase58()


    const userBaseTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === baseMint)
    const userQuoteTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === quoteMint)

    return {
      pool,
      minIncomeAmount,
      outcomeAmount,
      userBaseTokenAccount: userBaseTokenAccount?.pubkey,
      userQuoteTokenAccount: userQuoteTokenAccount?.pubkey,
      side: isInverted ? SIDE.ASK : SIDE.BID,
      isInverted,
      wallet,
    }


  }

  public async getSwapImpact(params: TokenSwapParams) {
    const {
      pool,
      minIncomeAmount,
      outcomeAmount,
      isInverted,
    } = await this.resolveSwapInputs(params)

    const { baseTokenVault } = pool

    const baseVaultAccount = await this.tokenClient.getTokenAccount(baseTokenVault);

    // isInverted probably is not correct, remove ! later
    const poolsAmountDiff = !isInverted
      ? baseVaultAccount.amount.div(minIncomeAmount)
      : baseVaultAccount.amount.div(outcomeAmount)

    const priceImpact = 100 / (poolsAmountDiff.toNumber() + 1)

    const fee = outcomeAmount.mul(SWAP_FEE_NUMERATOR).div(SWAP_FEE_DENUMERATOR)

    return {
      minIncomeAmount,
      outcomeAmount,
      priceImpact,
      isInverted,
      fee,
    }
  }

  /**
   * Add liquidity to Aldrin's AMM pool
   * @param params 
   * @returns Transaction Id
   */

  async depositLiquidity(params: TokenSwapAddlLiquidityParams): Promise<string> {
    const { poolMint, wallet = this.wallet } = params
    let { maxBase, maxQuote } = params


    if (!wallet) {
      throw new Error('Wallet not provided')
    }

    const pool = this.pools.find((p) => p.poolMint.equals(poolMint))

    if (!pool) {
      throw new Error(`Pool with mint ${poolMint.toBase58()} not found`)
    }

    const { baseTokenVault, quoteTokenVault, baseTokenMint, quoteTokenMint } = pool


    const [
      baseVaultAccount,
      quoteVaultAccount,
    ] = await Promise.all([
      this.tokenClient.getTokenAccount(baseTokenVault),
      this.tokenClient.getTokenAccount(quoteTokenVault),
    ])


    const price = quoteVaultAccount.amount.mul(PRECISION_NOMINATOR).div(baseVaultAccount.amount)

    const walletTokens = await this.getWalletTokens(wallet)

    const baseMint = baseTokenMint.toBase58()
    const quoteMint = quoteTokenMint.toBase58()


    const userBaseTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === baseMint)
    const userQuoteTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === quoteMint)


    if (!userBaseTokenAccount) {
      throw new Error('Unable to add liquidity: base token account not found')
    }

    if (!userQuoteTokenAccount) {
      throw new Error('Unable to add liquidity: quote token account not found')
    }

    if (!maxBase) {
      if (!maxQuote) {
        throw new Error('Neither base nor quote amounts does not provided!') // TODO: max?
      }

      maxBase = maxQuote.mul(PRECISION_NOMINATOR).div(price)
    }

    if (!maxQuote) {
      maxQuote = maxBase.mul(price).div(PRECISION_NOMINATOR)
    }

    const poolTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === pool.poolMint.toBase58())

    return this.poolClient.depositLiquidity({
      pool,
      userPoolTokenAccount: poolTokenAccount ? poolTokenAccount.pubkey : null,
      maxBaseTokenAmount: maxBase,
      maxQuoteTokenAmount: maxQuote,
      userBaseTokenAccount: userBaseTokenAccount.pubkey,
      userQuoteTokenAccount: userQuoteTokenAccount.pubkey,
      wallet,
    })

  }

  /**
   * Withdraw liquidity from Aldrin's AMM pool
   * @param params 
   * @returns Transaction Id
   */

  async withdrawLiquidity(params: TokenSwapWithdrawLiquidityParams): Promise<string> {
    const { poolMint, wallet = this.wallet, poolTokenAmount } = params

    if (!wallet) {
      throw new Error('Wallet not provided')
    }

    const pool = this.pools.find((p) => p.poolMint.equals(poolMint))

    if (!pool) {
      throw new Error(`Pool with mint ${poolMint.toBase58()} not found`)
    }

    const { baseTokenMint, quoteTokenMint } = pool


    const walletTokens = await this.getWalletTokens(wallet)

    const baseMint = baseTokenMint.toBase58()
    const quoteMint = quoteTokenMint.toBase58()


    const userBaseTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === baseMint)
    const userQuoteTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === quoteMint)

    const poolTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === pool.poolMint.toBase58())

    if (!poolTokenAccount) {
      throw new Error('Unable to withdraw liquidity: pool token account not found')
    }

    return this.poolClient.withdrawLiquidity({
      pool,
      userPoolTokenAccount: poolTokenAccount.pubkey,
      userBaseTokenAccount: userBaseTokenAccount?.pubkey,
      userQuoteTokenAccount: userQuoteTokenAccount?.pubkey,
      poolTokenAmount,
      slippage: params.slippage,
      wallet,
      baseTokenReturnedMin: params.minBase,
      quoteTokenReturnedMin: params.minQuote,
    })

  }

  /**
   * Calculate price of mintForm/mintTo tokens
   * @param params 
   * @returns 
   */

  async getPrice(params: TokenSwapGetPriceParams) {
    const { mintFrom, mintTo } = params

    const poolSearch = this.findPool(mintFrom, mintTo)

    if (!poolSearch) {
      throw new Error('Pool for mints not found') // TODO: pools routing
    }

    const { pool, isInverted } = poolSearch


    const { baseTokenMint, baseTokenVault, quoteTokenMint, quoteTokenVault } = pool


    const [
      baseMintInfo,
      quoteMintInfo,
      baseVaultAccount,
      quoteVaultAccount,
    ] = await Promise.all([
      this.getMintInfo(baseTokenMint),
      this.getMintInfo(quoteTokenMint),
      this.tokenClient.getTokenAccount(baseTokenVault),
      this.tokenClient.getTokenAccount(quoteTokenVault),
    ])


    const price = quoteVaultAccount.amount
      .mul(PRECISION_NOMINATOR)
      .mul(baseMintInfo.decimalDenominator)
      .div(quoteMintInfo.decimalDenominator)
      .div(baseVaultAccount.amount)

    if (isInverted) {
      return PRECISION_NOMINATOR.toNumber() / price.toNumber()
    }

    return price.toNumber() / PRECISION_NOMINATOR.toNumber()

  }

  /**
   * Auto-initialize Tokenswap
   */
  static async initialize(params: TokenSwapLoadParams = {}): Promise<TokenSwap> {

    const { connection = new Connection(SOLANA_RPC_ENDPOINT), wallet } = params
    const poolClient = new PoolClient(connection)
    const tokenClient = new TokenClient(connection)
    const farmingClient = new FarmingClient(connection)

    const [pools, v2Pools] = await Promise.all([
      poolClient.getPools(),
      poolClient.getV2Pools(),
    ])

    return new TokenSwap(
      [...pools, ...v2Pools],
      poolClient,
      tokenClient,
      farmingClient,
      connection,
      wallet,
    )
  }

  private async getMintInfo(mint: PublicKey): Promise<TokenMintInfo> {
    const existing = this.mintInfos.get(mint.toBase58())
    if (existing) {
      return existing
    }

    const info = await this.tokenClient.getMintInfo(mint)
    this.mintInfos.set(mint.toBase58(), info)

    return info
  }

  async getFarmed(params: TokenSwapGetFarmedParams) {
    const { poolMint, wallet = this.wallet } = params

    if (!wallet) {
      throw new Error('Wallet not provided')
    }

    const pool = this.pools.find((p) => p.poolMint.equals(poolMint))

    if (!pool) {
      throw new Error('Pool not found!')
    }
    const states = await this.farmingClient.getFarmingState({ poolPublicKey: pool.poolPublicKey })

    const activeStates = states.filter((s) => !s.tokensTotal.eq(s.tokensUnlocked)) // Skip finished staking states


    // Resolve rewards
    const stateVaults = await Promise.all(
      activeStates.map(async (state) => {

        const tokenInfo = await this.tokenClient.getTokenAccount(state.farmingTokenVault)

        return {
          tokenInfo,
          state,
        }
      })
    )


    const tickets = await this.farmingClient.getFarmingTickets({ userKey: wallet.publicKey, pool: pool.poolPublicKey })

    if (tickets.length === 0) {
      throw new Error('No tickets, nothing to check')
    }

    const queue = await this.farmingClient.getFarmingSnapshotsQueue({})

    return stateVaults.map((sv) => {
      const rewardsPerTicket = tickets.map((ticket) => {

        const rewards = Farming.calculateFarmingRewards({
          ticket,
          queue,
          state: sv.state, // Calculate for each state separately, sometimes there are few reward pools
        })

        return { ...rewards, ticket }
      })

      const rewardsAmount = rewardsPerTicket.reduce((acc, _) => acc.add(_.unclaimedTokens), new BN(0))

      return { ...sv, rewardsPerTicket, rewardsAmount }
    })

  }

  async claimFarmed(params: TokenSwapGetFarmedParams): Promise<string[]> {
    const { wallet = this.wallet, poolMint } = params

    if (!wallet) {
      throw new Error('Wallet not provided')
    }

    const farmed = await this.getFarmed(params)

    const pool = this.pools.find((p) => p.poolMint.equals(poolMint))

    if (!pool) {
      throw new Error('Pool not found!')
    }

    const programId = PoolClient.getPoolAddress(pool.poolVersion)

    const [poolSigner] = await PublicKey.findProgramAddress(
      [pool?.poolPublicKey.toBuffer()],
      programId,
    )


    const walletTokens = await this.getWalletTokens(wallet)

    const transactions = await Promise.all(farmed
      .flatMap(async (state) => {

        const farmingToken = await this.tokenClient.getTokenAccount(state.state.farmingTokenVault)


        const instructions: TransactionInstruction[] = []
        let userFarmingTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === farmingToken.mint.toBase58())?.pubkey


        if (!userFarmingTokenAccount) {
          const {
            transaction: createAccountTransaction,
            newAccountPubkey,
          } = await TokenClient.createTokenAccountTransaction({
            owner: wallet.publicKey,
            mint: farmingToken.mint,
          })

          userFarmingTokenAccount = newAccountPubkey
          instructions.push(...createAccountTransaction.instructions)
        }


        const ticketInstructions = state.rewardsPerTicket.flatMap((rpt) => {
          const result: TransactionInstruction[] = []
          let unclaimed = rpt.unclaimedSnapshots

          while (unclaimed > 0) {
            const maxSnapshots = Math.min(unclaimed, 22) // TODO: 25
            unclaimed -= 22
            result.push(
              Farming.claimFarmedInstruction({
                maxSnapshots: new BN(maxSnapshots),
                userKey: wallet.publicKey,
                userFarmingTokenAccount: userFarmingTokenAccount as PublicKey, // TODO:?
                poolSigner,
                farmingState: state.state.farmingStatePublicKey,
                farmingSnapshots: state.state.farmingSnapshots,
                farmingTicket: rpt.ticket.farmingTicketPublicKey,
                poolPublicKey: pool.poolPublicKey,
                farmingTokenVault: state.state.farmingTokenVault,
                programId,
              })
            )
          }

          return result
        })

        instructions.push(...ticketInstructions)

        return instructions
      })
    )

    console.log('Transactions: ', transactions)

    return Promise.all(transactions
      .flatMap((_) => _)
      .map((_) => new Transaction().add(_))
      .map(async (transaction) => sendTransaction({
        transaction,
        wallet,
        connection: this.connection,
      }))
    )
  }

  private async getWalletTokens(wallet: Wallet) {
    const cache = this.walletTokens.get(wallet.publicKey.toBase58())

    if (cache) {
      return cache
    }

    const walletTokensResponse = await this.connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    })

    const walletTokens = walletTokensResponse.value
    this.walletTokens.set(wallet.publicKey.toBase58(), walletTokens)

    return walletTokens

  }
}
