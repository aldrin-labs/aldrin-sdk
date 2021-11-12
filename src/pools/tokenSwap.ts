import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { AccountInfo, Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PoolClient, PoolRpcResponse, SIDE, SOLANA_RPC_ENDPOINT, TokenSwapGetPriceParams, TokenSwapLoadParams, TokenSwapSwapParams } from '.';
import { TokenClient, TokenMintInfo } from '..';
import { Wallet } from '../types';


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

  async swap(params: TokenSwapSwapParams) {
    const resolvedInputs = await this.resolveSwapInputs(params)

    console.log('Resolved inputs: ', resolvedInputs, resolvedInputs.minIncomeAmount.toString(), resolvedInputs.outcomeAmount.toString())

    return this.poolClient.swap(resolvedInputs)

  }

  /**
   * Make tokens swap
   * @returns Transaction Id
   */

  private async resolveSwapInputs(params: TokenSwapSwapParams) {
    const { wallet = this.wallet, mintFrom, mintTo, outcomeAmount } = params
    let { minIncomeAmount } = params
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
    * A - Token amount to buy (unknown)
    * B - Quote token amount (params) 
    * 
    * X * Y = (X - A) * (Y + B)
    * 
    * X - A = (X * Y) / (Y + B)
    * 
    * A = X - (X * Y) / (Y + B)
    * 
    * */

    if (!minIncomeAmount) {
      const X = isInverted ? quoteVaultAccount.amount : baseVaultAccount.amount
      const Y = isInverted ? baseVaultAccount.amount : quoteVaultAccount.amount

      const B = outcomeAmount
      minIncomeAmount = X.sub(X.mul(Y).div(Y.add(B)))
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

    const pools = await poolClient.getPools()

    return new TokenSwap(
      pools,
      poolClient,
      tokenClient,
      connection,
      wallet
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
