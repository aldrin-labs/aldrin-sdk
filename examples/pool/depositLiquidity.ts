import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import BN from 'bn.js'
import { AUTHORIZED_POOLS, TOKEN_LIST } from '../../src'
import { connection, poolClient, tokenClient, wallet } from '../common'

/**
 * Deposit liquidity to AMM pool
 */
 async function depositLiquidity() {
   // Find pool info
   const allPools = await poolClient.getPools({ mint: AUTHORIZED_POOLS.RIN_USDC.poolMint })
   const myPool = allPools[0]
 
   const { baseTokenMint, baseTokenVault, quoteTokenMint, quoteTokenVault } = myPool
 
 
   const rin = TOKEN_LIST.tokens.find((t) => t.symbol === 'RIN')
   const usdc = TOKEN_LIST.tokens.find((t) => t.symbol === 'USDC')
 
 
   const [
     baseTokenInfo,
     quoteTokenInfo,
     baseVaultAccount,
     quoteVaultAccount,
   ] = await Promise.all([
     tokenClient.getMintInfo(baseTokenMint),
     tokenClient.getMintInfo(quoteTokenMint),
     tokenClient.getTokenAccount(baseTokenVault),
     tokenClient.getTokenAccount(quoteTokenVault),
   ])

  // Be careful: amount.toNumber() could give you overflow, better to use one of BigDecimal implementation - bn.js supports only ints

  const price =
    (baseVaultAccount.amount.toNumber() / quoteTokenInfo.decimalDenominator.toNumber()) /
    (quoteVaultAccount.amount.toNumber() / baseTokenInfo.decimalDenominator.toNumber())

  console.log('RIN/USDC price: ', price)

  const walletTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
    programId: TOKEN_PROGRAM_ID,
  })

  const rinAccount = walletTokens.value
    .find((wt) => wt.account.data.parsed.info.mint === rin?.address)

  const usdcAccount = walletTokens.value
    .find((wt) => wt.account.data.parsed.info.mint === usdc?.address)


  if (!rinAccount || !usdcAccount) {
    throw new Error('Please create token accounts first!')
  }

  console.log('User balances: ', rinAccount.account.data.parsed.info, usdcAccount.account.data.parsed.info)


  const rinToDeposit = 1
  const rinTokensToDeposit = new BN(rinToDeposit * baseTokenInfo.decimalDenominator.toNumber())

  const usdcTokensToDeposit = new BN(price * rinToDeposit * quoteTokenInfo.decimalDenominator.toNumber())

  console.log('Deposit tokens: RIN - ', rinTokensToDeposit.toString(), '; USDC - ', usdcTokensToDeposit.toString())

  const poolTokenAccount = walletTokens.value
    .find((wt) => wt.account.data.parsed.info.mint === myPool.poolMint.toBase58())

  const txId = await poolClient.depositLiquidity({
    pool: myPool,
    userPoolTokenAccount: poolTokenAccount ? poolTokenAccount.pubkey : null,
    maxBaseTokenAmount: rinTokensToDeposit,
    maxQuoteTokenAmount: usdcTokensToDeposit,
    userBaseTokenAccount: rinAccount.pubkey,
    userQuoteTokenAccount: usdcAccount.pubkey,
    wallet,
  })

  console.log('Deposit transaction sent: ', txId)

  // Add some logic to check transaction confirmations
}

