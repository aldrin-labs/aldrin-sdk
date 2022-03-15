import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import BN from 'bn.js';
import { TokenAccountInfo } from '.';
import { SPL_ACCOUNT_LAYOUT, SPL_TOKEN_LAYOUT } from './layout';
import { CreateAccountParams, CreateAccountResponse, TokenMintInfo } from './types';


/**
 * SPL Token wrapper
 */
export class TokenClient {
  constructor(private connection: Connection) {

  }

  async getMintInfo(mint: PublicKey): Promise<TokenMintInfo> {
    const resp = await this.connection.getAccountInfo(mint)

    if (!resp) {
      throw new Error(`No account for public key: ${mint}`)
    }

    const mintInfo = SPL_TOKEN_LAYOUT.decode(resp.data) as TokenMintInfo;

    return {
      ...mintInfo,
      decimalDenominator: new BN(10 ** mintInfo.decimals),
    };
  }


  async getTokenAccount(address: PublicKey): Promise<TokenAccountInfo> {

    const resp = await this.connection.getAccountInfo(address)
    if (!resp) {
      throw new Error(`No account for public key: ${address}`)
    }

    return SPL_ACCOUNT_LAYOUT.decode(resp.data) as TokenAccountInfo;
  }


  /**
   * 
   * Generate new account address and create transaction
   * @returns account public key, transaction
   * 
   */
  static async createTokenAccountTransaction(params: CreateAccountParams): Promise<CreateAccountResponse> {
    const {
      owner,
      mint,
      amount,
      payer,
    } = params

    const ata = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      owner
    )

    const transaction = new Transaction()
    if (amount) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: owner,
          toPubkey: ata,
          lamports: amount,
        })
      )
    }

    const instruction = Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      ata,
      owner,
      payer || owner
    )


    transaction.add(instruction)

    return {
      transaction,
      newAccountPubkey: ata,
    }
  }
}
