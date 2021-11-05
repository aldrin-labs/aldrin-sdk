
import { Wallet } from '@project-serum/anchor';
import { Connection, Keypair } from '@solana/web3.js';

import os from 'os'
import fs from 'fs'
import * as bs58 from 'bs58'
import BN from 'bn.js'
import { PoolProgram, TokenProgram } from '../src';
import { TOKEN_LIST } from '../src/token';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SIDE } from '../src/pools/types';

const privateKey = fs.readFileSync(
  os.homedir() + '/.config/aldrin/privatekey',
  {
    encoding: 'utf-8',
  }
)


const decoded = bs58.decode(privateKey)

const payer = Keypair.fromSecretKey(new Uint8Array(decoded))

const wallet = new Wallet(payer)

console.log('Wallet:', wallet.payer.secretKey);

const connection = new Connection('https://api.mainnet-beta.solana.com');

const pool = new PoolProgram(connection, wallet);

async function getSnapshots() {
  const result = await pool.getSnapshots()
  console.log('getSnapshots:', JSON.stringify(result))
}

async function getPrice() {
  const allPools = await pool.getPools()

  console.log('getPools:', allPools)

  const myPool = allPools[0]

  const { baseTokenMint, baseTokenVault, quoteTokenMint, quoteTokenVault } = myPool

  const baseToken = new TokenProgram(connection, baseTokenMint, baseTokenVault,)
  const quoteToken = new TokenProgram(connection, quoteTokenMint, quoteTokenVault,)

  const [
    baseTokenInfo,
    quoteTokenInfo,
    baseAmount,
    quoteAmount,
  ] = await Promise.all([
    baseToken.getTokenInfo(),
    quoteToken.getTokenInfo(),
    baseToken.getVaultTokenAmount(),
    quoteToken.getVaultTokenAmount(),
  ])

  console.log('Amounts:')
  console.log('Base: ', baseAmount.amount.toString(), baseTokenInfo.decDelimiter, baseTokenInfo.decimals)
  console.log('Quote: ', quoteAmount.amount.toString(), quoteTokenInfo.decDelimiter, quoteTokenInfo.decimals)


  // Be careful: amount.toNumber() could give you overflow, better to use one of BigDecimal implementation - bn.js supports only ints
  const price =
    (quoteAmount.amount.toNumber() / quoteTokenInfo.decDelimiter) / (baseAmount.amount.toNumber() / baseTokenInfo.decDelimiter)

  console.log('Pool price: ', price, baseTokenMint.toBase58(), quoteTokenMint.toBase58())

}

async function addLiquidity() {
  const allPools = await pool.getPools()

  const rin = TOKEN_LIST.tokens.find((t) => t.symbol === 'RIN')
  const usdc = TOKEN_LIST.tokens.find((t) => t.symbol === 'USDC')

  console.log('getPools:', allPools)

  const myPool = allPools.find((p) => p.baseTokenMint.toBase58() === rin?.address && p.quoteTokenMint.toBase58() === usdc?.address)

  if (!myPool) {
    throw new Error('Pool not found!')
  }


  const { baseTokenMint, baseTokenVault, quoteTokenMint, quoteTokenVault } = myPool

  const baseToken = new TokenProgram(connection, baseTokenMint, baseTokenVault,)
  const quoteToken = new TokenProgram(connection, quoteTokenMint, quoteTokenVault,)

  const [
    baseTokenInfo,
    quoteTokenInfo,
    baseAmount,
    quoteAmount,
  ] = await Promise.all([
    baseToken.getTokenInfo(),
    quoteToken.getTokenInfo(),
    baseToken.getVaultTokenAmount(),
    quoteToken.getVaultTokenAmount(),
  ])

  // console.log('Amounts:')
  // console.log('Base: ', baseAmount.amount.toString(), baseTokenInfo.decDelimiter, baseTokenInfo.decimals)
  // console.log('Quote: ', quoteAmount.amount.toString(), quoteTokenInfo.decDelimiter, quoteTokenInfo.decimals)


  // Be careful: amount.toNumber() could give you overflow, better to use one of BigDecimal implementation - bn.js supports only ints

  const price =
    (quoteAmount.amount.toNumber() / quoteTokenInfo.decDelimiter) /
    (baseAmount.amount.toNumber() / baseTokenInfo.decDelimiter)

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
  const rinTokensToDeposit = new BN(rinToDeposit * baseTokenInfo.decDelimiter)

  const usdcTokensToDeposit = new BN(price * rinToDeposit * quoteTokenInfo.decDelimiter)

  console.log('Deposit tokens: RIN - ', rinTokensToDeposit.toString(), '; USDC - ', usdcTokensToDeposit.toString())

  const poolTokenAccount = walletTokens.value
    .find((wt) => wt.account.data.parsed.info.mint === myPool.poolMint.toBase58())

  const txId = await pool.depositLiquidity({
    pool: myPool,
    poolTokenAccount: poolTokenAccount ? poolTokenAccount.pubkey : null,
    baseTokenAmount: rinTokensToDeposit,
    quoteTokenAmount: usdcTokensToDeposit,
    baseTokenAccount: rinAccount.pubkey,
    quoteTokenAccount: usdcAccount.pubkey,
  })

  console.log('Deposit transaction sent: ', txId)

  // Add some logic to check transaction confirmations
}




async function withdrawLiquidity() {
  const allPools = await pool.getPools()

  const rin = TOKEN_LIST.tokens.find((t) => t.symbol === 'RIN')
  const usdc = TOKEN_LIST.tokens.find((t) => t.symbol === 'USDC')

  console.log('getPools:', allPools)

  const myPool = allPools.find((p) => p.baseTokenMint.toBase58() === rin?.address && p.quoteTokenMint.toBase58() === usdc?.address)

  if (!myPool) {
    throw new Error('Pool not found!')
  }


  const { baseTokenMint, baseTokenVault, quoteTokenMint, quoteTokenVault } = myPool

  const baseToken = new TokenProgram(connection, baseTokenMint, baseTokenVault,)
  const quoteToken = new TokenProgram(connection, quoteTokenMint, quoteTokenVault,)

  const [
    baseTokenInfo,
    quoteTokenInfo,
    baseAmount,
    quoteAmount,
  ] = await Promise.all([
    baseToken.getTokenInfo(),
    quoteToken.getTokenInfo(),
    baseToken.getVaultTokenAmount(),
    quoteToken.getVaultTokenAmount(),
  ])

  // console.log('Amounts:')
  // console.log('Base: ', baseAmount.amount.toString(), baseTokenInfo.decDelimiter, baseTokenInfo.decimals)
  // console.log('Quote: ', quoteAmount.amount.toString(), quoteTokenInfo.decDelimiter, quoteTokenInfo.decimals)


  // Be careful: amount.toNumber() could give you overflow, better to use one of BigDecimal implementation - bn.js supports only ints

  const price =
    (quoteAmount.amount.toNumber() / quoteTokenInfo.decDelimiter) /
    (baseAmount.amount.toNumber() / baseTokenInfo.decDelimiter)

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
    throw new Error(`No token account: RIN: ${rinAccount}, USDC: ${usdcAccount}`)
  }

  // Withdraw 10% of tokens
  const lpTokenAmount = new BN(poolTokenAccount.account.data.parsed.info.tokenAmount.amount).divn(10)

  const txId = await pool.withdrawLiquidity({
    pool: myPool,
    poolTokenAccount: poolTokenAccount.pubkey,
    baseTokenAccount: rinAccount.pubkey,
    quoteTokenAccount: usdcAccount.pubkey,
    poolTokenAmount: lpTokenAmount,
  })

  console.log('Withdraw liquidity transaction sent: ', txId)

  // Add some logic to check transaction confirmations
}



async function swapTokens() {
  const allPools = await pool.getPools()

  const rin = TOKEN_LIST.tokens.find((t) => t.symbol === 'RIN')
  const usdc = TOKEN_LIST.tokens.find((t) => t.symbol === 'USDC')

  console.log('getPools:', allPools)

  const myPool = allPools.find((p) => p.baseTokenMint.toBase58() === rin?.address && p.quoteTokenMint.toBase58() === usdc?.address)

  if (!myPool) {
    throw new Error('Pool not found!')
  }


  const { baseTokenMint, baseTokenVault, quoteTokenMint, quoteTokenVault } = myPool

  const baseToken = new TokenProgram(connection, baseTokenMint, baseTokenVault)
  const quoteToken = new TokenProgram(connection, quoteTokenMint, quoteTokenVault)

  const [
    baseTokenInfo,
    quoteTokenInfo,
    baseAmount,
    quoteAmount,
  ] = await Promise.all([
    baseToken.getTokenInfo(),
    quoteToken.getTokenInfo(),
    baseToken.getVaultTokenAmount(),
    quoteToken.getVaultTokenAmount(),
  ])

  // console.log('Amounts:')
  // console.log('Base: ', baseAmount.amount.toString(), baseTokenInfo.decDelimiter, baseTokenInfo.decimals)
  // console.log('Quote: ', quoteAmount.amount.toString(), quoteTokenInfo.decDelimiter, quoteTokenInfo.decimals)


  // Be careful: amount.toNumber() could give you overflow, better to use one of BigDecimal implementation - bn.js supports only ints

  const price =
    (quoteAmount.amount.toNumber() / quoteTokenInfo.decDelimiter) /
    (baseAmount.amount.toNumber() / baseTokenInfo.decDelimiter)

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
  const B = new BN(5 * quoteTokenInfo.decDelimiter) // 5 USDC

  const buyAmount = X.sub(X.mul(Y).div(Y.add(B)))

  console.log('Buy amount: ', buyAmount.toString())

  const txId = await pool.swap({
    pool: myPool,
    outcomeAmount: B,
    minIncomeAmount: B.muln(0.995), // Add slippage 0.5%
    baseTokenAccount: rinAccount?.pubkey,
    quoteTokenAccount: usdcAccount?.pubkey,
    side: SIDE.BID
  })

  console.log('Swap transaction sent: ', txId)

  // Add some logic to check transaction confirmations
}


swapTokens()