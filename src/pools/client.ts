import { Connection, GetProgramAccountsFilter, PublicKey, Transaction } from '@solana/web3.js';
import {
  DepositLiquidityParams, GetPoolsParams, PoolResponse, PoolRpcResponse,
  PoolV2Response,
  POOL_LAYOUT, POOL_V2_LAYOUT, SOLANA_RPC_ENDPOINT, WithdrawLiquidityParams,
} from '.';
import { POOLS_PROGRAM_ADDRESS, POOLS_V2_PROGRAM_ADDRESS, TokenClient } from '..';
import { sendTransaction } from '../transactions';
import { PoolVersion } from '../types';
import { Pool } from './pool';
import { SwapParams } from './types/swap';


/**
 * Aldrin AMM Pool client
 */

export class PoolClient {

  private tokenClient = new TokenClient(this.connection)
  constructor(private connection: Connection = new Connection(SOLANA_RPC_ENDPOINT)) {
  }

  static getPoolAddress(poolVersion: PoolVersion) {
    return poolVersion === 1 ? POOLS_PROGRAM_ADDRESS : POOLS_V2_PROGRAM_ADDRESS
  }


  /**
   * Get list of all pools for v1 pools program
   * @param filters
   * @returns List of all pools for program
   */

  async getPools(filters: GetPoolsParams = {}): Promise<PoolRpcResponse[]> {

    const searchFilters: GetProgramAccountsFilter[] = [
      { dataSize: POOL_LAYOUT.span },
    ]

    if (filters.mint) {
      searchFilters.push(
        { memcmp: { offset: POOL_LAYOUT.offsetOf('poolMint') || 0, bytes: filters.mint.toBase58() } }
      )
    }

    const accounts = await this.connection.getProgramAccounts(
      POOLS_PROGRAM_ADDRESS,
      {
        filters: searchFilters,
      }
    )

    return accounts.map((p) => {
      const { account: { data }, pubkey } = p
      const account = POOL_LAYOUT.decode(data) as PoolResponse
      return {
        ...account,
        poolPublicKey: pubkey,
        poolVersion: 1,
      }
    })
  }

  /**
   * Get list of all pools for v2 pools program
   * @param filters
   * @returns List of all pools for program
   */

  async getV2Pools(filters: GetPoolsParams = {}): Promise<PoolRpcResponse[]> {

    const searchFilters: GetProgramAccountsFilter[] = [
      { dataSize: POOL_V2_LAYOUT.span },
    ]

    if (filters.mint) {
      searchFilters.push(
        { memcmp: { offset: POOL_V2_LAYOUT.offsetOf('poolMint') || 0, bytes: filters.mint.toBase58() } }
      )
    }

    const accounts = await this.connection.getProgramAccounts(
      POOLS_V2_PROGRAM_ADDRESS,
      {
        filters: searchFilters,
      }
    )

    return accounts.map((p) => {
      const { account: { data }, pubkey } = p
      const account = POOL_V2_LAYOUT.decode(data) as PoolV2Response
      return {
        ...account,
        poolPublicKey: pubkey,
        poolVersion: 2,
      }
    })
  }

  /**
   * Add liquidity to AMM pool
   * @param params
   * @returns transaction Id 
   */
  async depositLiquidity(params: DepositLiquidityParams): Promise<string> {
    const { pool, maxBaseTokenAmount, wallet, slippage = 0.01 } = params
    let { userPoolTokenAccount } = params

    const {
      poolPublicKey,
      poolMint,
      baseTokenVault,
      poolVersion = 1,
    } = pool


    const transaction = new Transaction()

    const programId = PoolClient.getPoolAddress(poolVersion)

    const [poolSigner] = await PublicKey.findProgramAddress(
      [poolPublicKey.toBuffer()],
      programId
    )

    const poolMintInfo = await this.tokenClient.getMintInfo(poolMint)
    const baseVaultTokenAmount = await this.tokenClient.getTokenAccount(baseTokenVault)

    const creationSize = poolMintInfo.supply
      .mul(maxBaseTokenAmount)
      .div(baseVaultTokenAmount.amount)
      .muln(1 - slippage)


    if (!userPoolTokenAccount) {
      const {
        transaction: createAccountTransaction,
        newAccountPubkey,
      } = await TokenClient.createTokenAccountTransaction({
        owner: wallet.publicKey,
        mint: poolMint,
      })

      userPoolTokenAccount = newAccountPubkey
      transaction.add(createAccountTransaction)
    }

    const instruction = Pool.depositLiquididtyInstruction({
      ...params,
      walletAuthority: wallet.publicKey,
      poolSigner,
      userPoolTokenAccount,
      creationSize,
      programId,
    })

    transaction.add(instruction)

    return sendTransaction({
      wallet,
      connection: this.connection,
      transaction,
    })
  }


  /**
   * Helper method for calculation max wihdrwawable based on LP tokens amount
   * @param params
   * @returns 
   */

  async getMaxWithdrawable(params: WithdrawLiquidityParams) {
    const { pool: { poolMint, baseTokenVault, quoteTokenVault }, poolTokenAmount } = params

    const [
      poolMintInfo,
      baseTokenInfo,
      quoteTokenInfo,
    ] = await Promise.all([
      this.tokenClient.getMintInfo(poolMint),
      this.tokenClient.getTokenAccount(baseTokenVault),
      this.tokenClient.getTokenAccount(quoteTokenVault),
    ])

    const supply = poolMintInfo.supply
    const baseTokenAmount = baseTokenInfo.amount
    const quoteTokenAmount = quoteTokenInfo.amount


    const withdrawAmountBase = baseTokenAmount.mul(poolTokenAmount).div(supply)
    const withdrawAmountQuote = quoteTokenAmount.mul(poolTokenAmount).div(supply)

    return {
      withdrawAmountBase,
      withdrawAmountQuote,
    }

  }


  /**
   * Withdraw liquidity from AMM pool
   * @param params 
   * @returns {Promise<stirng>} - Transaction Id
   */

  async withdrawLiquidity(params: WithdrawLiquidityParams): Promise<string> {

    const { pool, slippage = 0.001, wallet } = params
    let { baseTokenReturnedMin, quoteTokenReturnedMin, userBaseTokenAccount, userQuoteTokenAccount } = params
    const {
      poolPublicKey,
      baseTokenMint,
      quoteTokenMint,
      poolVersion = 1,
    } = pool

    const programId = PoolClient.getPoolAddress(poolVersion)

    const [poolSigner] = await PublicKey.findProgramAddress(
      [poolPublicKey.toBuffer()],
      programId
    )

    const transaction = new Transaction()

    if (!userBaseTokenAccount) {
      const {
        transaction: createAccountTransaction,
        newAccountPubkey,
      } = await TokenClient.createTokenAccountTransaction({
        owner: wallet.publicKey,
        mint: baseTokenMint,
      })

      userBaseTokenAccount = newAccountPubkey
      transaction.add(createAccountTransaction)
    }


    if (!userQuoteTokenAccount) {
      const {
        transaction: createAccountTransaction,
        newAccountPubkey,
      } = await TokenClient.createTokenAccountTransaction({
        owner: wallet.publicKey,
        mint: quoteTokenMint,
      })

      userQuoteTokenAccount = newAccountPubkey
      transaction.add(createAccountTransaction)
    }


    if (!baseTokenReturnedMin || !quoteTokenReturnedMin) {
      const maxWithdraw = await this.getMaxWithdrawable(params)
      baseTokenReturnedMin = baseTokenReturnedMin || maxWithdraw.withdrawAmountBase
      quoteTokenReturnedMin = quoteTokenReturnedMin || maxWithdraw.withdrawAmountQuote
    }

    baseTokenReturnedMin = baseTokenReturnedMin.muln(1 - slippage)
    quoteTokenReturnedMin = quoteTokenReturnedMin.muln(1 - slippage)

    const instruction = Pool.withdrawLiquidityInstruction({
      ...params,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      baseTokenReturnedMin,
      quoteTokenReturnedMin,
      poolSigner,
      walletAuthority: wallet.publicKey,
      programId,
    })


    transaction.add(instruction)


    return sendTransaction({
      wallet,
      connection: this.connection,
      transaction,
    })
  }


  /**
   * Swap tokens
   * @param params 
   * @returns {Promise<string>} - Transaction Id
   */


  async swap(params: SwapParams): Promise<string> {
    const {
      pool: {
        baseTokenMint,
        quoteTokenMint,
        poolPublicKey,
        poolVersion = 1,
      },
      slippage = 0.001,
      wallet,
    } = params

    let {
      userBaseTokenAccount,
      userQuoteTokenAccount,
    } = params

    const transaction = new Transaction()
    // create pool token account for user if not exist
    if (!userBaseTokenAccount) {
      const {
        transaction: createAccountTransaction,
        newAccountPubkey,
      } = await TokenClient.createTokenAccountTransaction({
        owner: wallet.publicKey,
        mint: baseTokenMint,
      })

      userBaseTokenAccount = newAccountPubkey
      transaction.add(createAccountTransaction)
    }


    if (!userQuoteTokenAccount) {
      const {
        transaction: createAccountTransaction,
        newAccountPubkey,
      } = await TokenClient.createTokenAccountTransaction({
        owner: wallet.publicKey,
        mint: quoteTokenMint,
      })

      userQuoteTokenAccount = newAccountPubkey
      transaction.add(createAccountTransaction)
    }

    const programId = PoolClient.getPoolAddress(poolVersion)

    const [poolSigner] = await PublicKey.findProgramAddress(
      [poolPublicKey.toBuffer()],
      programId
    )


    transaction.add(
      Pool.swapInstruction({
        ...params,
        minIncomeAmount: params.minIncomeAmount.muln(1 - slippage),
        poolSigner,
        walletAuthority: wallet.publicKey,
        userBaseTokenAccount,
        userQuoteTokenAccount,
        poolVersion,
      })
    )

    return sendTransaction({
      wallet: wallet,
      connection: this.connection,
      transaction,
    })
  }

}
