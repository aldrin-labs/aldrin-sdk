import {
  Connection, PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { computeOutputAmount } from '@orca-so/stablecurve'
import { DEFAULT_FARMING_TICKET_END_TIME, Farming, FarmingClient, PRECISION_NOMINATOR, TokenClient } from '.';
import {
  CURVE, PoolClient,
  PoolRpcResponse,
  PoolRpcV2Response,
  SIDE,
  SOLANA_RPC_ENDPOINT,
  SWAP_FEE_DENOMINATOR,
  SWAP_FEE_NUMERATOR,
  TokenSwapAddlLiquidityParams,
  TokenSwapGetFarmedParams,
  TokenSwapGetPriceParams,
  TokenSwapLoadParams,
  TokenSwapParams,
  TokenSwapStartFamingParams,
  TokenSwapWithdrawLiquidityParams,
} from './pools';
import { SwapBase } from './swapBase';
import { sendTransaction, createAccountInstruction } from './transactions';
import BN from 'bn.js';
import { Wallet, WithReferral } from './types';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';


/**
 * High-level API for Aldrin AMM Pools 
 */
export class TokenSwap extends SwapBase {

  constructor(
    private pools: PoolRpcResponse[],
    private poolClient: PoolClient,
    protected tokenClient: TokenClient,
    private farmingClient: FarmingClient,
    protected connection = new Connection(SOLANA_RPC_ENDPOINT),
    private wallet: Wallet | null = null,
    private referralParams: WithReferral | undefined = undefined
  ) {

    super(tokenClient, connection)

  }

  findPool(mintFrom: PublicKey, mintTo: PublicKey): { pool: PoolRpcResponse, isInverted: boolean } | null {
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
    return this.poolClient.swap({ ...resolvedInputs, slippage: params.slippage, referralParams: this.referralParams })
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

    const { baseTokenVault, quoteTokenVault, curveType } = pool


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
      minIncomeAmount = curveType === CURVE.STABLE
        ? outcomeAmount
        : X
          .sub(
            X.mul(Y)
              .div(
                Y.add(B)
              )
          )
    }

    if (!outcomeAmount) {
      const A = minIncomeAmount
      outcomeAmount = curveType === CURVE.STABLE
        ? minIncomeAmount
        : X
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

    const fee = outcomeAmount.mul(SWAP_FEE_NUMERATOR).div(SWAP_FEE_DENOMINATOR)

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


    const { baseTokenMint, baseTokenVault, quoteTokenMint, quoteTokenVault, poolVersion } = pool


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

    if (poolVersion === 2) {
      const { curveType } = pool as PoolRpcV2Response

      if (curveType === 1) {
        const amountToSwap = isInverted ? baseVaultAccount.amount.divn(2) : quoteVaultAccount.amount.divn(2)
        const poolInputAmount = isInverted ? quoteVaultAccount.amount : baseVaultAccount.amount
        const poolOutputAmount = isInverted ? baseVaultAccount.amount : quoteVaultAccount.amount


        const outputAmount = computeOutputAmount(
          amountToSwap,
          poolInputAmount,
          poolOutputAmount,
          new BN(170), // Fixed
        )


        return parseFloat(outputAmount
          .mul(PRECISION_NOMINATOR)
          .mul(baseMintInfo.decimalDenominator)
          .div(quoteMintInfo.decimalDenominator)
          .toString()) / parseFloat(amountToSwap.toString()) / PRECISION_NOMINATOR.toNumber()

      }
    }


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
      params.referralParams,
    )
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

    console.log('pool found:', wallet.publicKey.toString(), pool.poolPublicKey.toString(), pool.poolVersion)

    const tickets = await this.farmingClient.getFarmingTickets({ userKey: wallet.publicKey, pool: pool.poolPublicKey, poolVersion: pool.poolVersion })

    if (tickets.length === 0) {
      throw new Error('No tickets, nothing to check')
    }


    const states = await this.farmingClient.getFarmingState({ poolPublicKey: pool.poolPublicKey, poolVersion: pool.poolVersion })

    const stateKeys = states.map((state) => state.farmingStatePublicKey.toBase58())


    // Resolve rewards
    const stateVaults = await Promise.all(
      states.map(async (state) => {

        const tokenInfo = await this.tokenClient.getTokenAccount(state.farmingTokenVault)

        return {
          tokenInfo,
          state,
        }
      })
    )

    const calcAccounts = await this.farmingClient.getFarmingCalcAccounts({
      poolVersion: pool.poolVersion,
      userKey: wallet.publicKey,
    })

    const calcAccountsForStates = calcAccounts.filter((ca) => stateKeys.includes(ca.farmingState.toBase58()))

    return stateVaults.map((sv) => {
      const calcAccount = calcAccountsForStates.find((ca) => ca.farmingState.equals(sv.state.farmingStatePublicKey))
      return { ...sv, calcAccount }
    }).filter((sv) => sv.calcAccount?.tokenAmount.gtn(0))

  }

  async startFarming(params: TokenSwapStartFamingParams): Promise<string> {
    const { wallet = this.wallet, poolMint, amount } = params

    if (!wallet) {
      throw new Error('Wallet not provided')
    }

    const pool = this.pools.find((p) => p.poolMint.equals(poolMint))

    if (!pool) {
      throw new Error('Pool not found!')
    }


    const walletTokens = await this.getWalletTokens(wallet)


    const poolTokenAccount = walletTokens
      .find((wt) => wt.account.data.parsed.info.mint === pool.poolMint.toBase58())


    if (!poolTokenAccount) {
      throw new Error('No LP account - nothing to stake!')
    }

    const lpTokenAmount = new BN(poolTokenAccount.account.data.parsed.info.tokenAmount.amount)

    if (lpTokenAmount.eqn(0)) {
      throw new Error('LP account is empty - nothing to stake!')
    }

    const states = await this.farmingClient.getFarmingState({ poolPublicKey: pool.poolPublicKey, poolVersion: pool.poolVersion })
    const activeStates = states.filter((s) => !s.tokensTotal.eq(s.tokensUnlocked)) // Skip finished staking states


    const fs = activeStates[0] // Start farming on any of active states, all other states (if available) will apply automaticaly

    return this.farmingClient.startFarming({
      poolPublicKey: pool.poolPublicKey,
      poolVersion: pool.poolVersion,
      farmingState: fs.farmingStatePublicKey,
      lpTokenFreezeVault: pool.lpTokenFreezeVault,
      lpTokenAccount: poolTokenAccount.pubkey,
      tokenAmount: amount,
      wallet,
    })
  }

  async endFarming(params: TokenSwapGetFarmedParams): Promise<string> {
    const { wallet = this.wallet, poolMint } = params

    if (!wallet) {
      throw new Error('Wallet not provided')
    }

    const pool = this.pools.find((p) => p.poolMint.equals(poolMint))

    if (!pool) {
      throw new Error('Pool not found!')
    }


    const walletTokens = await this.getWalletTokens(wallet)


    let poolTokenAccount = walletTokens
      .find((wt) => wt.account.data.parsed.info.mint === pool.poolMint.toBase58())?.pubkey


    const additionalInstructions: TransactionInstruction[] = []
    if (!poolTokenAccount) {

      poolTokenAccount = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        pool.poolMint,
        wallet.publicKey,
      )

      // createAccountInstruction()
      const instruction = Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        pool.poolMint,
        poolTokenAccount,
        wallet.publicKey,
        wallet.publicKey
      )

      additionalInstructions.push(instruction)

    }

    if (!poolTokenAccount) {
      throw new Error('No LP account - cannot end farming!')
    }

    const userPoolTokenAccount = poolTokenAccount

    const tickets = await this.farmingClient.getFarmingTickets({ userKey: wallet.publicKey, pool: pool.poolPublicKey, poolVersion: pool.poolVersion })

    const activeTickets = tickets.filter((t) => t.endTime.eq(DEFAULT_FARMING_TICKET_END_TIME))

    const states = await this.farmingClient.getFarmingState({ poolPublicKey: pool.poolPublicKey, poolVersion: pool.poolVersion })
    const activeStates = states.filter((s) => !s.tokensTotal.eq(s.tokensUnlocked)) // Skip finished staking states


    const fs = activeStates[0] // Start farming on any of active states, all other states (if available) will apply automaticaly

    return this.farmingClient.endFarmings({
      poolPublicKey: pool.poolPublicKey,
      poolVersion: pool.poolVersion,
      farmingState: fs.farmingStatePublicKey,
      lpTokenFreezeVault: pool.lpTokenFreezeVault,
      userPoolTokenAccount,
      farmingSnapshots: fs.farmingSnapshots,
      farmingTickets: activeTickets.map((at) => at.farmingTicketPublicKey),
      wallet,
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

        if (state.calcAccount) {
          const withdrawInstruction = Farming.withdrawFarmedInstruction({
            farmingState: state.state.farmingStatePublicKey,
            farmingCalc: state.calcAccount.farmingCalcPublicKey,
            farmingTokenVault: state.state.farmingTokenVault,
            userFarmingTokenAccount: userFarmingTokenAccount as PublicKey,
            userKey: wallet.publicKey,
            poolPublicKey: pool.poolPublicKey,
            poolSigner,
            programId,
          })

          instructions.push(withdrawInstruction)
        }


        return instructions
      })
    )

    return Promise.all(
      transactions
        .flat()
        .map((_) => new Transaction().add(_))
        .map(async (transaction) => sendTransaction({
          transaction,
          wallet,
          connection: this.connection,
        }))
    )
  }

}
