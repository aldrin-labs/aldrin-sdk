import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { AccountInfo, Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import { TokenClient, TokenMintInfo, TokenSwapGetPriceParams } from '.';
import { Wallet } from './types';

export abstract class SwapBase {
  protected mintInfos = new Map<string, TokenMintInfo>()
  protected walletTokens = new Map<
    string,
    Array<{
      pubkey: PublicKey;
      account: AccountInfo<ParsedAccountData>;
    }>
  >();

  constructor(
    protected tokenClient: TokenClient,
    protected connection: Connection,
  ) {

  }

  abstract getPrice(params: TokenSwapGetPriceParams): Promise<number>

  protected async getMintInfo(mint: PublicKey): Promise<TokenMintInfo> {
    const existing = this.mintInfos.get(mint.toBase58())
    if (existing) {
      return existing
    }

    const info = await this.tokenClient.getMintInfo(mint)
    this.mintInfos.set(mint.toBase58(), info)

    return info
  }

  protected async getWalletTokens(wallet: Wallet) {
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
