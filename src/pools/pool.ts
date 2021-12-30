
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import {
  DepositLiquididtyInstructionParams,
  DEPOSIT_LIQUIDITY_INSTRUCTION_LAYOUT,
  Side,
  SWAP_INSTRUCTION_LAYOUT,
  WithdrawLiquidityInstructionParams,
  WITHDRAW_LIQUIDITY_INSTRUCTION_LAYOUT,
} from '.';
import { POOLS_PROGRAM_ADDRESS, POOLS_V2_PROGRAM_ADDRESS } from '..';
import { account, instructionDiscriminator } from '../utils';
import { SIDE, SwapInstructionParams } from './types/swap';


/**
 * Pool instructions & help utils
 */

export class Pool {

  /**
     * Create deposit liquidity instruction
     * @param params 
     * @returns 
     */
  static depositLiquididtyInstruction(params: DepositLiquididtyInstructionParams) {

    const data = Buffer.alloc(DEPOSIT_LIQUIDITY_INSTRUCTION_LAYOUT.span)
    const { creationSize, maxBaseTokenAmount, maxQuoteTokenAmount, programId } = params

    DEPOSIT_LIQUIDITY_INSTRUCTION_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('create_basket'),
        creationSize,
        maxBaseTokenAmount,
        maxQuoteTokenAmount,
      },
      data,
    );

    const keys = [
      account(params.pool.poolPublicKey),
      account(params.pool.poolMint, true),
      account(params.poolSigner),
      account(params.userBaseTokenAccount, true),
      account(params.userQuoteTokenAccount, true),
      account(params.pool.baseTokenVault, true),
      account(params.pool.quoteTokenVault, true),
      account(params.userPoolTokenAccount, true),
      account(params.walletAuthority, false, true),
      account(TOKEN_PROGRAM_ID),
      account(SYSVAR_CLOCK_PUBKEY),
      account(SYSVAR_RENT_PUBKEY),
    ]

    return new TransactionInstruction({
      programId: programId,
      keys,
      data,
    });
  }


  /**
   * Create widthradw liquidity instruction
   * @param params 
   * @returns 
   */

  static withdrawLiquidityInstruction(params: WithdrawLiquidityInstructionParams): TransactionInstruction {

    const data = Buffer.alloc(WITHDRAW_LIQUIDITY_INSTRUCTION_LAYOUT.span)
    const {
      poolTokenAmount,
      baseTokenReturnedMin,
      quoteTokenReturnedMin,
      poolSigner,
      userPoolTokenAccount,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      walletAuthority,
      pool: {
        feeBaseAccount,
        feeQuoteAccount,
        poolPublicKey,
        poolMint,
        baseTokenVault,
        quoteTokenVault,
      },
      programId,
    } = params

    WITHDRAW_LIQUIDITY_INSTRUCTION_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('redeem_basket'),
        redemptionSize: poolTokenAmount,
        baseTokenReturnedMin,
        quoteTokenReturnedMin,
      },
      data,
    );

    const keys = [
      account(poolPublicKey),
      account(poolMint, true),
      account(baseTokenVault, true),
      account(quoteTokenVault, true),
      account(poolSigner),
      account(userPoolTokenAccount, true),
      account(userBaseTokenAccount, true),
      account(userQuoteTokenAccount, true),
      account(walletAuthority, false, true),
      account(walletAuthority),
      account(TOKEN_PROGRAM_ID),
      account(feeBaseAccount, true),
      account(feeQuoteAccount, true),
      account(SYSVAR_CLOCK_PUBKEY),
    ]

    return new TransactionInstruction({
      programId,
      keys,
      data,
    });
  }

  /**
   * Create swap tokens instruction. Detect pool program version base on `poolVersion` field
   * @param params 
   * @returns
   */

  static swapInstruction(params: SwapInstructionParams): TransactionInstruction {
    if (params.poolVersion === 1) {
      return this.swapInstructionV1(params)
    }
    return this.swapInstructionV2(params)
  }

  private static swapInstructionData(params: SwapInstructionParams) {
    const data = Buffer.alloc(SWAP_INSTRUCTION_LAYOUT.span)
    const {
      outcomeAmount,
      minIncomeAmount,
      side,
    } = params

    SWAP_INSTRUCTION_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('swap'),
        tokens: outcomeAmount,
        minTokens: minIncomeAmount,
        side: side === SIDE.ASK ? Side.Ask : Side.Bid,
      },
      data,
    )

    return data
  }


  /**
   * Create swap tokens instruction for v1 pool
   * @param params 
   * @returns
   */

  static swapInstructionV1(params: SwapInstructionParams) {
    const {
      pool: {
        poolPublicKey,
        poolMint,
        baseTokenVault,
        quoteTokenVault,
        feePoolTokenAccount,
      },
      walletAuthority,
      poolSigner,
      userBaseTokenAccount,
      userQuoteTokenAccount,
    } = params

    const data = Pool.swapInstructionData(params)


    const keys = [
      account(poolPublicKey),
      account(poolSigner),
      account(poolMint, true),
      account(baseTokenVault, true),
      account(quoteTokenVault, true),
      account(feePoolTokenAccount, true),
      account(walletAuthority, false, true),
      account(userBaseTokenAccount, true),
      account(userQuoteTokenAccount, true),
      account(TOKEN_PROGRAM_ID),
    ]

    return new TransactionInstruction({
      programId: POOLS_PROGRAM_ADDRESS,
      keys,
      data,
    })
  }


  /**
   * Create swap tokens instruction for v2 pool
   * @param params 
   * @returns
   */


  static swapInstructionV2(params: SwapInstructionParams) {
    const {
      pool: {
        poolPublicKey,
        poolMint,
        baseTokenVault,
        quoteTokenVault,
        feePoolTokenAccount,
        curve,
      },
      walletAuthority,
      poolSigner,
      userBaseTokenAccount,
      userQuoteTokenAccount,
    } = params

    if (!curve) {
      throw new Error('No curve account provided')
    }

    const data = Pool.swapInstructionData(params)

    const keys = [
      account(poolPublicKey),
      account(poolSigner),
      account(poolMint, true),
      account(baseTokenVault, true),
      account(quoteTokenVault, true),
      account(feePoolTokenAccount, true),
      account(walletAuthority, false, true),
      account(userBaseTokenAccount, true),
      account(userQuoteTokenAccount, true),
      account(curve),
      account(TOKEN_PROGRAM_ID),
    ]


    return new TransactionInstruction({
      programId: POOLS_V2_PROGRAM_ADDRESS,
      keys,
      data,
    });
  }

}
