import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SYSVAR_CLOCK_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import { GetTwammAvailableTokensParams, GET_AVAILABLE_TOKENS_LAYOUT, TwammExecuteSwapParams } from '.';
import { TWAMM_PROGRAM_ADDRESS } from '..';
import { account, instructionDiscriminator } from '../utils';

/**
 * TWAMM instructions & help utils
 */
export class TwAmm {

  /**
     * Create instruction for getAvailableTokensForSale simulation
    * @param params 
     * @returns 
     */
  static getAvailableTokensInstruction(params: GetTwammAvailableTokensParams) {

    const data = Buffer.alloc(GET_AVAILABLE_TOKENS_LAYOUT.span)
    const { pairSettings, pyth, orderArray } = params

    GET_AVAILABLE_TOKENS_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('get_available_tokens_for_sale'),
      },
      data,
    );

    const keys = [
      account(pairSettings),
      account(orderArray),
      account(pyth),
      account(SYSVAR_CLOCK_PUBKEY),
    ]

    return new TransactionInstruction({
      programId: TWAMM_PROGRAM_ADDRESS,
      keys,
      data,
    });
  }

  static executeSwapInstruction(params: TwammExecuteSwapParams) {
    const data = Buffer.alloc(GET_AVAILABLE_TOKENS_LAYOUT.span)
    const {
      pairSettings,
      pyth,
      orderArray,
      signer,
      wallet,
      userFrom,
      userTo,
      twammFromTokenVault,
      twammToTokenVault,
    } = params

    GET_AVAILABLE_TOKENS_LAYOUT.encode(
      {
        instruction: instructionDiscriminator('execute_swap_token'),
      },
      data,
    );

    const keys = [
      account(pairSettings),
      account(orderArray, true),
      account(signer),
      account(userFrom, true),
      account(userTo, true),
      account(wallet.publicKey, false, true),
      account(twammFromTokenVault, true),
      account(twammToTokenVault, true),
      account(pyth),
      account(SYSVAR_CLOCK_PUBKEY),
      account(TOKEN_PROGRAM_ID),
    ]

    return new TransactionInstruction({
      programId: TWAMM_PROGRAM_ADDRESS,
      keys,
      data,
    });
  }
}
