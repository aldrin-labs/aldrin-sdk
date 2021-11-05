import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { AccountLayout, TokenLayout } from '../layout';
import { u64 } from '../utils';
import { TokenInfo } from './types';


export class TokenProgram {
  constructor(
    private connection: Connection,
    private mint: PublicKey,
    private vault: PublicKey | null = null,
  ) {

  }

  async getTokenInfo(): Promise<TokenInfo> {
    const resp = await this.connection.getAccountInfo(this.mint)
    if (!resp) {
      throw new Error(`No account for public key: ${this.mint}`)
    }
    const mintInfo = TokenLayout.decode(resp.data);

    return {
      mintAuthority: mintInfo.mintAuthority,
      mintAuthorityOption: mintInfo.mintAuthorityOption,
      supply: u64.fromBuffer(mintInfo.supply as Buffer),
      decimals: mintInfo.decimals,
      isInitialized: mintInfo.isInitialized,
      freezeAuthority: new PublicKey(mintInfo.freezeAuthority),
      freezeAuthorityOption: mintInfo.freezeAuthorityOption,
      decDelimiter: Math.pow(10, mintInfo.decimals),
      decDelimiterBN: new BN(Math.pow(10, mintInfo.decimals)),
    };
  }

  async getVaultTokenAmount() {
    if (!this.vault) {
      throw new Error('Vault not defined!')
    }
    const resp = await this.connection.getAccountInfo(this.vault)
    if (!resp) {
      throw new Error(`No account for public key: ${this.vault}`)
    }

    const accountInfo = AccountLayout.decode(resp.data);

    const result = {
      address: this.vault,
      mint: new PublicKey(accountInfo.mint),
      owner: new PublicKey(accountInfo.owner),
      amount: u64.fromBuffer(accountInfo.amount),
    }

    if (!result.mint.equals(this.mint)) {
      throw new Error(
        `Invalid account mint: ${JSON.stringify(
          accountInfo.mint,
        )} !== ${JSON.stringify(this.mint)}`,
      );
    }
    return result
  }

}