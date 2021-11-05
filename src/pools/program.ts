import { Idl, Program, Provider, Wallet } from '@project-serum/anchor'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Connection, PublicKey, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js'
import BN from 'bn.js'
import { TokenProgram } from '../token'
import { createTokenAccountTransaction, sendTransaction } from '../transactions'
import idl from './idl.json'
import { CreateBasketParams, Pool, PoolRpcResponse, RedeemBasketParams, Side, SIDE, SnapshotQueue, SnapshotQueueRpcResponse, SwapParams } from './types'


export class PoolProgram {
  readonly program: Program
  private programId = new PublicKey(idl.metadata.address)

  constructor(private connection: Connection, private wallet: Wallet) {
    this.program = new Program(
      idl as Idl,
      this.programId,
      new Provider(connection, wallet, {
        preflightCommitment: 'recent',
        commitment: 'recent',
      })
    )
  }


  async getSnapshots(): Promise<SnapshotQueue[]> {
    const response = await this.program.account.snapshotQueue.all()

    return response.map(({ account }: { account: SnapshotQueueRpcResponse }) => {
      return {
        nextIndex: account.nextIndex.toNumber(),
        snapshots: account.snapshots.map((s) => ({
          time: s.time.toNumber(),
          isInitialized: s.isInitialized,
          tokensFrozen: s.tokensFrozen,
          farmingTokens: s.farmingTokens,
        })),
      }
    })


  }

  async getPools(): Promise<Pool[]> {
    const pools = await this.program.account.pool.all()

    return pools.map((p: { account: PoolRpcResponse, publicKey: PublicKey }) => {
      const { account, publicKey } = p
      const { fees } = account

      return {
        ...account,
        fees: {
          tradeFeeNumerator: fees.tradeFeeNumerator.toNumber(),
          tradeFeeDenominator: fees.tradeFeeDenominator.toNumber(),
          ownerTradeFeeNumerator: fees.ownerTradeFeeNumerator.toNumber(),
          ownerTradeFeeDenominator: fees.ownerTradeFeeDenominator.toNumber(),
          ownerWithdrawFeeNumerator: fees.ownerWithdrawFeeNumerator.toNumber(),
          ownerWithdrawFeeDenominator: fees.ownerWithdrawFeeDenominator.toNumber(),
        },
        poolPublicKey: publicKey,
      }
    })
  }

  async depositLiquidity(params: CreateBasketParams): Promise<string> {
    const { pool, baseTokenAmount, quoteTokenAmount, baseTokenAccount, quoteTokenAccount } = params
    let { poolTokenAccount } = params
    const {
      poolPublicKey,
      poolMint,
      baseTokenMint,
      baseTokenVault,
      quoteTokenVault,
    } = pool

    const [vaultSigner] = await PublicKey.findProgramAddress(
      [poolPublicKey.toBuffer()],
      this.program.programId
    )

    const poolToken = new TokenProgram(this.connection, poolMint)

    const poolMintInfo = await poolToken.getTokenInfo()
    const supply = poolMintInfo.supply


    const baseToken = new TokenProgram(this.connection, baseTokenMint, baseTokenVault)

    const baseVaultTokenAmount = await baseToken.getVaultTokenAmount()

    const poolTokenAmount = supply
      .mul(baseTokenAmount)
      .div(baseVaultTokenAmount.amount)
      .muln(0.99)

    const transactionBeforeDeposit = new Transaction()

    if (!poolTokenAccount) {
      const {
        transaction: createAccountTransaction,
        newAccountPubkey,
      } = await createTokenAccountTransaction({
        wallet: this.wallet,
        mint: poolMint,
      })

      poolTokenAccount = newAccountPubkey
      transactionBeforeDeposit.add(createAccountTransaction)
    }

    const commonTransaction = new Transaction()

    const createBasketTransaction = await this.program.instruction.createBasket(
      new BN(poolTokenAmount),
      baseTokenAmount,
      quoteTokenAmount,
      {
        accounts: {
          pool: poolPublicKey,
          poolMint,
          poolSigner: vaultSigner,
          userBaseTokenAccount: baseTokenAccount,
          userQuoteTokenAccount: quoteTokenAccount,
          baseTokenVault: baseTokenVault,
          quoteTokenVault: quoteTokenVault,
          userPoolTokenAccount: poolTokenAccount,
          walletAuthority: this.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: SYSVAR_CLOCK_PUBKEY,
          rent: SYSVAR_RENT_PUBKEY,
        },
      }
    )

    commonTransaction.add(transactionBeforeDeposit)
    commonTransaction.add(createBasketTransaction)

    return sendTransaction({
      wallet: this.wallet,
      connection: this.connection,
      transaction: commonTransaction,
    })
  }

  async withdrawLiquidity(params: RedeemBasketParams) {

    const { pool, poolTokenAccount, baseTokenAccount, quoteTokenAccount, poolTokenAmount } = params
    const {
      poolPublicKey,
      poolMint,
      baseTokenVault,
      quoteTokenVault,
      feeBaseAccount,
      feeQuoteAccount,
    } = pool

    const [vaultSigner] = await PublicKey.findProgramAddress(
      [poolPublicKey.toBuffer()],
      this.program.programId
    )

    const maxWithdraw = await this.getMaxWithdrawable(params)

    const commonTransaction = new Transaction()

    const withdrawTransaction = await this.program.instruction.redeemBasket(
      new BN(poolTokenAmount),
      new BN(maxWithdraw.withdrawAmountBase),
      new BN(maxWithdraw.withdrawAmountQuote),
      {
        accounts: {
          pool: poolPublicKey,
          poolMint: poolMint,
          baseTokenVault,
          quoteTokenVault,
          poolSigner: vaultSigner,
          userPoolTokenAccount: poolTokenAccount,
          userBaseTokenAccount: baseTokenAccount,
          userQuoteTokenAccount: quoteTokenAccount,
          walletAuthority: this.wallet.publicKey,
          userSolAccount: this.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          feeBaseAccount,
          feeQuoteAccount,
          clock: SYSVAR_CLOCK_PUBKEY,
        },
      }
    )

    commonTransaction.add(withdrawTransaction)

    return sendTransaction({
      wallet: this.wallet,
      connection: this.connection,
      transaction: commonTransaction,
    })
  }


  async swap(params: SwapParams) {
    const {
      pool: {
        baseTokenMint,
        baseTokenVault,
        quoteTokenMint,
        quoteTokenVault,
        poolMint,
        feePoolTokenAccount,
        poolPublicKey,
      },
      side,
      outcomeAmount,
      minIncomeAmount,
    } = params

    let {
      baseTokenAccount,
      quoteTokenAccount,
    } = params

    const transactionBeforeSwap = new Transaction()
    const commonTransaction = new Transaction()
    // create pool token account for user if not exist
    if (!baseTokenAccount) {
      const {
        transaction: createAccountTransaction,
        newAccountPubkey,
      } = await createTokenAccountTransaction({
        wallet: this.wallet,
        mint: baseTokenMint,
      })

      baseTokenAccount = newAccountPubkey
      transactionBeforeSwap.add(createAccountTransaction)
    }

    if (!quoteTokenAccount) {
      const {
        transaction: createAccountTransaction,
        newAccountPubkey,
      } = await createTokenAccountTransaction({
        wallet: this.wallet,
        mint: quoteTokenMint,
      })

      quoteTokenAccount = newAccountPubkey
      transactionBeforeSwap.add(createAccountTransaction)
    }


    const [vaultSigner] = await PublicKey.findProgramAddress(
      [poolPublicKey.toBuffer()],
      this.program.programId
    )

    const swapTransaction = await this.program.instruction.swap(
      outcomeAmount,
      minIncomeAmount,
      side === SIDE.ASK ? Side.Ask : Side.Bid,
      {
        accounts: {
          pool: poolPublicKey,
          poolSigner: vaultSigner,
          poolMint,
          baseTokenVault,
          quoteTokenVault,
          feePoolTokenAccount: feePoolTokenAccount,
          walletAuthority: this.wallet.publicKey,
          userBaseTokenAccount: baseTokenAccount,
          userQuoteTokenAccount: quoteTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )

    commonTransaction.add(transactionBeforeSwap)
    commonTransaction.add(swapTransaction)

    return sendTransaction({
      wallet: this.wallet,
      connection: this.connection,
      transaction: commonTransaction,
    })
  }




  async getMaxWithdrawable(params: RedeemBasketParams) {
    const { pool: { poolMint, baseTokenMint, quoteTokenMint, baseTokenVault, quoteTokenVault }, poolTokenAmount } = params

    const poolToken = new TokenProgram(
      this.connection,
      poolMint,
    )

    const baseToken = new TokenProgram(
      this.connection,
      baseTokenMint,
      baseTokenVault,
    )

    const quoteToken = new TokenProgram(
      this.connection,
      quoteTokenMint,
      quoteTokenVault,
    )


    const [
      poolMintInfo,
      baseTokenInfo,
      quoteTokenInfo,
    ] = await Promise.all([
      poolToken.getTokenInfo(),
      baseToken.getVaultTokenAmount(),
      quoteToken.getVaultTokenAmount(),
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
}