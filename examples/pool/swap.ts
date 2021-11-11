import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import BN from 'bn.js'
import { AUTHORIZED_POOLS, SIDE, TOKEN_LIST } from '../../src'
import { poolClient, tokenClient, connection, wallet } from '../common'


/**
 * Token swap example
 */
export async function swapTokens() {
  const allPools = await poolClient.getPools({ mint: AUTHORIZED_POOLS.RIN_USDC.poolMint })
  const myPool = allPools[0]


  const { baseTokenVault, quoteTokenMint, quoteTokenVault } = myPool

  const [
    quoteTokenInfo,
    baseAmount,
    quoteAmount,
  ] = await Promise.all([
    tokenClient.getMintInfo(quoteTokenMint),
    tokenClient.getTokenAccount(baseTokenVault),
    tokenClient.getTokenAccount(quoteTokenVault),
  ])


  const rin = TOKEN_LIST.tokens.find((t) => t.symbol === 'RIN')
  const usdc = TOKEN_LIST.tokens.find((t) => t.symbol === 'USDC')


  // Be careful: amount.toNumber() could give you overflow, better to use one of BigDecimal implementation - bn.js supports only ints

  const price =
    (quoteAmount.amount.toNumber() / quoteTokenInfo.decimalDenominator.toNumber()) /
    (baseAmount.amount.toNumber() / quoteTokenInfo.decimalDenominator.toNumber())

  console.log('RIN/USDC price: ', price)

  const walletTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
    programId: TOKEN_PROGRAM_ID,
  })

  const rinAccount = walletTokens.value
    .find((wt) => wt.account.data.parsed.info.mint === rin?.address)

  const usdcAccount = walletTokens.value
    .find((wt) => wt.account.data.parsed.info.mint === usdc?.address)


  /**
   * 
   * Buy RIN on 5 USDC
   * 
   * Calculate exact buy price & amount
   * Calculation does not consider any fees, please check {PoolRpcResponse#fees}
   * 
   * X - Base(RIN) token amount in pool
   * Y - Quote(USDC) token amount in pool
   * A - Token amount to buy (unknown)
   * B - USDC token amount (5*10**6) 
   * 
   * X * Y = (X - A) * (Y + B)
   * 
   * X - A = (X * Y) / (Y + B)
   * 
   * A = X - (X * Y) / (Y + B)
   * 
   * */

  const X = baseAmount.amount
  const Y = quoteAmount.amount
  const B = new BN(5 * quoteTokenInfo.decimalDenominator.toNumber()) // 5 USDC

  const rinAmount = X.sub(X.mul(Y).div(Y.add(B)))

  console.log('Buy RIN: ', rinAmount.toString())

  const buyTxId = await poolClient.swap({
    pool: myPool,
    outcomeAmount: B,
    minIncomeAmount: rinAmount.muln(0.995), // Add slippage 0.5%
    userBaseTokenAccount: rinAccount?.pubkey,
    userQuoteTokenAccount: usdcAccount?.pubkey,
    side: SIDE.BID,
    wallet,
  })

  console.log('Swap (buy RIN) transaction sent: ', buyTxId)


  const sellTxId = await poolClient.swap({
    pool: myPool,
    outcomeAmount: rinAmount,
    minIncomeAmount: B.muln(0.995), // Add slippage 0.5%
    userBaseTokenAccount: rinAccount?.pubkey,
    userQuoteTokenAccount: usdcAccount?.pubkey,
    side: SIDE.ASK,
    wallet,
  })


  console.log('Swap (sell RIN) transaction sent: ', sellTxId)

  // Add some logic to check transaction confirmations
}
