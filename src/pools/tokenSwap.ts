import { TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token';
import { Account, Connection, Keypair, PublicKey } from '@solana/web3.js';
import { PoolClient, SWAP_INSTRUCTION_LAYOUT } from '.';
import { POOLS_PROGRAM_ADDRESS } from '..';


export enum CurveType {
  ConstantProduct = 0,
}
/**
 * [SPL TokenSwap-compatible](https://spl.solana.com/token-swap) interface for Aldrin AMM Pools 
 */
export class TokenSwap {
  /**
    * Create a Token object attached to the specific token
    *
    * @param connection The connection to use
    * @param tokenSwap The token swap account
    * @param swapProgramId The program ID of the token-swap program
    * @param tokenProgramId The program ID of the token program
    * @param poolToken The pool token
    * @param authority The authority over the swap and accounts
    * @param tokenAccountA The token swap's Token A account
    * @param tokenAccountB The token swap's Token B account
    * @param mintA The mint of Token A
    * @param mintB The mint of Token B
    * @param tradeFeeNumerator The trade fee numerator
    * @param tradeFeeDenominator The trade fee denominator
    * @param ownerTradeFeeNumerator The owner trade fee numerator
    * @param ownerTradeFeeDenominator The owner trade fee denominator
    * @param ownerWithdrawFeeNumerator The owner withdraw fee numerator
    * @param ownerWithdrawFeeDenominator The owner withdraw fee denominator
    * @param hostFeeNumerator The host fee numerator
    * @param hostFeeDenominator The host fee denominator
    * @param curveType The curve type
    * @param payer Pays for the transaction
    */
  constructor(
    private connection: Connection,
    public tokenSwap: PublicKey,
    public swapProgramId: PublicKey,
    public tokenProgramId: PublicKey,
    public poolToken: PublicKey,
    public feeBaseAccount: PublicKey,
    public feeQuoteAccount: PublicKey,
    public authority: PublicKey,
    public tokenAccountA: PublicKey,
    public tokenAccountB: PublicKey,
    public mintA: PublicKey,
    public mintB: PublicKey,
    public tradeFeeNumerator: u64,
    public tradeFeeDenominator: u64,
    public ownerTradeFeeNumerator: u64,
    public ownerTradeFeeDenominator: u64,
    public ownerWithdrawFeeNumerator: u64,
    public ownerWithdrawFeeDenominator: u64,
    public hostFeeNumerator: u64,
    public hostFeeDenominator: u64,
    public curveType: number,
    public payer: Account | Keypair,
  ) {
  }

  static async getMinBalanceRentForExemptTokenSwap(
    connection: Connection,
  ): Promise<number> {
    return await connection.getMinimumBalanceForRentExemption(
      SWAP_INSTRUCTION_LAYOUT.span,
    );
  }

  static async loadTokenSwap(
    connection: Connection,
    address: PublicKey,
    programId: PublicKey,
    payer: Account | Keypair,
  ): Promise<TokenSwap> {
    const client = new PoolClient(connection)
    const a = await client.getPools({ mint: address })

    if (a.length != 1) {
      throw new Error(`Could not find pool for publicKey: ${address.toBase58()}, found: ${a}`)
    }

    const pool = a[0]

    return new TokenSwap(
      connection,
      pool.poolPublicKey,
      POOLS_PROGRAM_ADDRESS,
      TOKEN_PROGRAM_ID,
      pool.poolMint,
      pool.feeBaseAccount,
      pool.feeQuoteAccount,
      pool.authority,
      pool.baseTokenVault,
      pool.quoteTokenVault,
      pool.baseTokenMint,
      pool.quoteTokenMint,
      new u64(pool.fees.tradeFeeNumerator),
      new u64(pool.fees.tradeFeeDenominator),
      new u64(pool.fees.ownerTradeFeeNumerator),
      new u64(pool.fees.ownerTradeFeeDenominator),
      new u64(pool.fees.ownerWithdrawFeeNumerator),
      new u64(pool.fees.ownerWithdrawFeeDenominator),
      new u64(0),
      new u64(0),
      CurveType.ConstantProduct,
      payer
    )
  }


  // static createInitSwapInstruction(
  //   tokenSwapAccount: Account,
  //   authority: PublicKey,
  //   tokenAccountA: PublicKey,
  //   tokenAccountB: PublicKey,
  //   tokenPool: PublicKey,
  //   feeAccount: PublicKey,
  //   tokenAccountPool: PublicKey,
  //   tokenProgramId: PublicKey,
  //   swapProgramId: PublicKey,
  //   tradeFeeNumerator: number,
  //   tradeFeeDenominator: number,
  //   ownerTradeFeeNumerator: number,
  //   ownerTradeFeeDenominator: number,
  //   ownerWithdrawFeeNumerator: number,
  //   ownerWithdrawFeeDenominator: number,
  //   hostFeeNumerator: number,
  //   hostFeeDenominator: number,
  //   curveType: number,
  //   curveParameters: u64 = new u64(0),
  // ): TransactionInstruction  {
  //   // return PoolClient.
  // }
}
