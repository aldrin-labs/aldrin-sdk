import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import BN from 'bn.js'
import { AUTHORIZED_POOLS, TOKEN_LIST } from '../../src'
import { poolClient, tokenClient, connection, wallet } from '../common'

async function withdrawLiquidity() {
  const allPools = await poolClient.getPools({ mint: AUTHORIZED_POOLS.RIN_USDC.poolMint })

  const rin = TOKEN_LIST.tokens.find((t) => t.symbol === 'RIN')
  const usdc = TOKEN_LIST.tokens.find((t) => t.symbol === 'USDC')


  const myPool = allPools[0]

  if (!myPool) {
    throw new Error('Pool not found!')
  }

  const { baseTokenMint, baseTokenVault, quoteTokenMint, quoteTokenVault } = myPool


  const [
    baseTokenInfo,
    quoteTokenInfo,
    baseAmount,
    quoteAmount,
  ] = await Promise.all([
    tokenClient.getMintInfo(baseTokenMint),
    tokenClient.getMintInfo(quoteTokenMint),
    tokenClient.getTokenAccount(baseTokenVault),
    tokenClient.getTokenAccount(quoteTokenVault),
  ])

  
  // Be careful: amount.toNumber() could give you overflow, better to use one of BigDecimal implementation - bn.js supports only ints

  const price =
    (quoteAmount.amount.toNumber() / quoteTokenInfo.decimalDenominator.toNumber()) /
    (baseAmount.amount.toNumber() / baseTokenInfo.decimalDenominator.toNumber())

  console.log('RIN/USDC price: ', price)

  const walletTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
    programId: TOKEN_PROGRAM_ID,
  })

  const poolTokenAccount = walletTokens.value
    .find((wt) => wt.account.data.parsed.info.mint === myPool.poolMint.toBase58())


  const rinAccount = walletTokens.value
    .find((wt) => wt.account.data.parsed.info.mint === rin?.address)

  const usdcAccount = walletTokens.value
    .find((wt) => wt.account.data.parsed.info.mint === usdc?.address)


  if (!poolTokenAccount) {
    throw new Error('No LP account - nothing to withdraw!')
  }

  if (!rinAccount || !usdcAccount) {
    throw new Error(`No token account: RIN: ${rinAccount}, USDC: ${usdcAccount}, please create token accounts first`)
  }

  // Withdraw 10% of LP tokens
  const lpTokenAmount = new BN(poolTokenAccount.account.data.parsed.info.tokenAmount.amount).divn(10)

  const txId = await poolClient.withdrawLiquidity({
    pool: myPool,
    userPoolTokenAccount: poolTokenAccount.pubkey,
    userBaseTokenAccount: rinAccount.pubkey,
    userQuoteTokenAccount: usdcAccount.pubkey,
    poolTokenAmount: lpTokenAmount,
    wallet,
  })

  console.log('Withdraw liquidity transaction sent: ', txId)

  // Add some logic to check transaction confirmations
}
