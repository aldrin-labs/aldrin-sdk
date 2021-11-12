
// import { Wallet } from '@project-serum/anchor';
// import { Connection, Keypair } from '@solana/web3.js';

// import os from 'os'
// import fs from 'fs'
// import * as bs58 from 'bs58'
// import BN from 'bn.js'

// import { AUTHORIZED_POOLS, PoolClient, POOLS_PROGRAM_ADDRESS, TokenClient, TOKEN_LIST } from '../src'
// import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
// import { SIDE } from '../src/pools/types/swap';

// const privateKey = fs.readFileSync(
//   os.homedir() + '/.config/aldrin/privatekey',
//   {
//     encoding: 'utf-8',
//   }
// )


// const decoded = bs58.decode(privateKey)

// const payer = Keypair.fromSecretKey(new Uint8Array(decoded))

// const wallet = new Wallet(payer)

// console.log('Wallet:', wallet.payer.secretKey);

// const connection = new Connection('https://api.mainnet-beta.solana.com');

// const poolClient = new PoolClient(connection)
// const tokenClient = new TokenClient(connection)

// async function fetchPools() {
//   const allPools = await poolClient.getPools()
//   console.log('Pools: ', allPools)


//   const rin = TOKEN_LIST.tokens.find((t) => t.symbol === 'RIN')
//   const usdc = TOKEN_LIST.tokens.find((t) => t.symbol === 'USDC')


//   const myPool = allPools.find((p) => p.baseTokenMint.toBase58() === rin?.address && p.quoteTokenMint.toBase58() === usdc?.address)

//   if (!myPool) {
//     throw new Error('Pool not found')
//   }
//   console.log('myPool:', myPool)

//   const { baseTokenMint, baseTokenVault, quoteTokenMint, quoteTokenVault } = myPool

//   const [
//     baseTokenInfo,
//     quoteTokenInfo,
//     baseTokenAccount,
//     quoteTokenAccount,
//   ] = await Promise.all([
//     tokenClient.getMintInfo(baseTokenMint),
//     tokenClient.getMintInfo(quoteTokenMint),
//     tokenClient.getTokenAccount(baseTokenVault),
//     tokenClient.getTokenAccount(quoteTokenVault),
//   ])

//   console.log('Check mints: base - ', baseTokenMint.toBase58(), baseTokenAccount.mint.toBase58())
//   console.log('Check mints: quote - ', quoteTokenMint.toBase58(), quoteTokenAccount.mint.toBase58())

// }

// async function addLiquidity() {
//   const allPools = await poolClient.getPools()

//   const rin = TOKEN_LIST.tokens.find((t) => t.symbol === 'RIN')
//   const usdc = TOKEN_LIST.tokens.find((t) => t.symbol === 'USDC')

//   console.log('getPools:', allPools)

//   const myPool = allPools.find((p) => p.baseTokenMint.toBase58() === rin?.address && p.quoteTokenMint.toBase58() === usdc?.address)

//   if (!myPool) {
//     throw new Error('Pool not found!')
//   }


//   const { baseTokenMint, baseTokenVault, quoteTokenMint, quoteTokenVault } = myPool

//   const [
//     baseTokenInfo,
//     quoteTokenInfo,
//     baseAmount,
//     quoteAmount,
//   ] = await Promise.all([
//     tokenClient.getMintInfo(baseTokenMint),
//     tokenClient.getMintInfo(quoteTokenMint),
//     tokenClient.getTokenAccount(baseTokenVault),
//     tokenClient.getTokenAccount(quoteTokenVault),
//   ])

//   const price =
//     (quoteAmount.amount.toNumber() / quoteTokenInfo.decimalDenominator.toNumber()) /
//     (baseAmount.amount.toNumber() / baseTokenInfo.decimalDenominator.toNumber())

//   console.log('RIN/USDC price: ', price)

//   const walletTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
//     programId: TOKEN_PROGRAM_ID,
//   })

//   const rinAccount = walletTokens.value
//     .find((wt) => wt.account.data.parsed.info.mint === rin?.address)

//   const usdcAccount = walletTokens.value
//     .find((wt) => wt.account.data.parsed.info.mint === usdc?.address)


//   if (!rinAccount || !usdcAccount) {
//     throw new Error('Please create token accounts first!')
//   }

//   console.log('User balances: ', rinAccount.account.data.parsed.info, usdcAccount.account.data.parsed.info)


//   const rinToDeposit = 1
//   const rinTokensToDeposit = new BN(rinToDeposit * baseTokenInfo.decimalDenominator.toNumber())

//   const usdcTokensToDeposit = new BN(price * rinToDeposit * quoteTokenInfo.decimalDenominator.toNumber())

//   console.log('Deposit tokens: RIN - ', rinTokensToDeposit.toString(), '; USDC - ', usdcTokensToDeposit.toString())

//   const poolTokenAccount = walletTokens.value
//     .find((wt) => wt.account.data.parsed.info.mint === myPool.poolMint.toBase58())

//   const txId = await poolClient.depositLiquidity({
//     pool: myPool,
//     userPoolTokenAccount: poolTokenAccount ? poolTokenAccount.pubkey : null,
//     maxBaseTokenAmount: rinTokensToDeposit,
//     maxQuoteTokenAmount: usdcTokensToDeposit,
//     userBaseTokenAccount: rinAccount.pubkey,
//     userQuoteTokenAccount: usdcAccount.pubkey,
//     wallet,
//   })

//   console.log('Deposit transaction sent: ', txId)

//   // Add some logic to check transaction confirmations
// }


// async function withdrawLiquidity() {
//   const allPools = await poolClient.getPools()

//   const rin = TOKEN_LIST.tokens.find((t) => t.symbol === 'RIN')
//   const usdc = TOKEN_LIST.tokens.find((t) => t.symbol === 'USDC')

//   console.log('getPools:', allPools)

//   const myPool = allPools.find((p) => p.baseTokenMint.toBase58() === rin?.address && p.quoteTokenMint.toBase58() === usdc?.address)

//   if (!myPool) {
//     throw new Error('Pool not found!')
//   }


//   const { baseTokenMint, baseTokenVault, quoteTokenMint, quoteTokenVault } = myPool


//   const [
//     baseTokenInfo,
//     quoteTokenInfo,
//     baseAmount,
//     quoteAmount,
//   ] = await Promise.all([
//     tokenClient.getMintInfo(baseTokenMint),
//     tokenClient.getMintInfo(quoteTokenMint),
//     tokenClient.getTokenAccount(baseTokenVault),
//     tokenClient.getTokenAccount(quoteTokenVault),
//   ])

//   // console.log('Amounts:')
//   // console.log('Base: ', baseAmount.amount.toString(), baseTokenInfo.decDelimiter, baseTokenInfo.decimals)
//   // console.log('Quote: ', quoteAmount.amount.toString(), quoteTokenInfo.decDelimiter, quoteTokenInfo.decimals)


//   // Be careful: amount.toNumber() could give you overflow, better to use one of BigDecimal implementation - bn.js supports only ints

//   const price =
//     (quoteAmount.amount.toNumber() / quoteTokenInfo.decimalDenominator.toNumber()) /
//     (baseAmount.amount.toNumber() / baseTokenInfo.decimalDenominator.toNumber())

//   console.log('RIN/USDC price: ', price)

//   const walletTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
//     programId: TOKEN_PROGRAM_ID,
//   })

//   const poolTokenAccount = walletTokens.value
//     .find((wt) => wt.account.data.parsed.info.mint === myPool.poolMint.toBase58())


//   const rinAccount = walletTokens.value
//     .find((wt) => wt.account.data.parsed.info.mint === rin?.address)

//   const usdcAccount = walletTokens.value
//     .find((wt) => wt.account.data.parsed.info.mint === usdc?.address)


//   if (!poolTokenAccount) {
//     throw new Error('No LP account - nothing to withdraw!')
//   }

//   if (!rinAccount || !usdcAccount) {
//     throw new Error(`No token account: RIN: ${rinAccount}, USDC: ${usdcAccount}`)
//   }

//   // Withdraw 10% of tokens
//   const lpTokenAmount = new BN(poolTokenAccount.account.data.parsed.info.tokenAmount.amount).divn(10)

//   const txId = await poolClient.withdrawLiquidity({
//     pool: myPool,
//     userPoolTokenAccount: poolTokenAccount.pubkey,
//     userBaseTokenAccount: rinAccount.pubkey,
//     userQuoteTokenAccount: usdcAccount.pubkey,
//     poolTokenAmount: lpTokenAmount,
//     wallet,
//   })

//   console.log('Withdraw liquidity transaction sent: ', txId)

//   // Add some logic to check transaction confirmations
// }


// async function swapTokens() {
//   const allPools = await poolClient.getPools()

//   const rin = TOKEN_LIST.tokens.find((t) => t.symbol === 'RIN')
//   const usdc = TOKEN_LIST.tokens.find((t) => t.symbol === 'USDC')

//   console.log('getPools:', allPools)

//   const myPool = allPools.find((p) => p.baseTokenMint.toBase58() === rin?.address && p.quoteTokenMint.toBase58() === usdc?.address)

//   if (!myPool) {
//     throw new Error('Pool not found!')
//   }

//   console.log('myPool: ', myPool.poolMint.toBase58(), myPool.poolPublicKey.toBase58())


//   const { baseTokenMint, baseTokenVault, quoteTokenMint, quoteTokenVault } = myPool

//   const [
//     baseTokenInfo,
//     quoteTokenInfo,
//     baseAmount,
//     quoteAmount,
//   ] = await Promise.all([
//     tokenClient.getMintInfo(baseTokenMint),
//     tokenClient.getMintInfo(quoteTokenMint),
//     tokenClient.getTokenAccount(baseTokenVault),
//     tokenClient.getTokenAccount(quoteTokenVault),
//   ])

//   // Be careful: amount.toNumber() could give you overflow, better to use one of BigDecimal implementation - bn.js supports only ints

//   const price =
//     (quoteAmount.amount.toNumber() / quoteTokenInfo.decimalDenominator.toNumber()) /
//     (baseAmount.amount.toNumber() / quoteTokenInfo.decimalDenominator.toNumber())

//   console.log('RIN/USDC price: ', price)

//   const walletTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
//     programId: TOKEN_PROGRAM_ID,
//   })

//   const rinAccount = walletTokens.value
//     .find((wt) => wt.account.data.parsed.info.mint === rin?.address)

//   const usdcAccount = walletTokens.value
//     .find((wt) => wt.account.data.parsed.info.mint === usdc?.address)


//   /**
//    * 
//    * Buy RIN on 5 USDC
//    * 
//    * Calculate exact buy price & amount
//    * 
//    * X - Base(RIN) token amount in pool
//    * Y - Quote(USDC) token amount in pool
//    * A - Token amount to buy (unknown)
//    * B - USDC token amount (5*10**6) 
//    * 
//    * X * Y = (X - A) * (Y + B)
//    * 
//    * X - A = (X * Y) / (Y + B)
//    * 
//    * A = X - (X * Y) / (Y + B)
//    * 
//    * */

//   const X = baseAmount.amount
//   const Y = quoteAmount.amount
//   const B = new BN(5 * quoteTokenInfo.decimalDenominator.toNumber()) // 5 USDC

//   const rinAmount = X.sub(X.mul(Y).div(Y.add(B)))

//   console.log('Buy RIN: ', rinAmount.toString())

//   const buyTxId = await poolClient.swap({
//     pool: myPool,
//     outcomeAmount: B,
//     minIncomeAmount: rinAmount.muln(0.995), // Add slippage 0.5%
//     userBaseTokenAccount: rinAccount?.pubkey,
//     userQuoteTokenAccount: usdcAccount?.pubkey,
//     side: SIDE.BID,
//     wallet,
//   })

//   console.log('Swap (buy RIN) transaction sent: ', buyTxId)


//   const sellTxId = await poolClient.swap({
//     pool: myPool,
//     outcomeAmount: rinAmount,
//     minIncomeAmount: B.muln(0.995), // Add slippage 0.5%
//     userBaseTokenAccount: rinAccount?.pubkey,
//     userQuoteTokenAccount: usdcAccount?.pubkey,
//     side: SIDE.ASK,
//     wallet,
//   })


//   console.log('Swap (sell RIN) transaction sent: ', sellTxId)

//   // Add some logic to check transaction confirmations
// }

// async function getFarmingState() {
//   const allPools = await pool.getPools()

//   const mSol = TOKEN_LIST.tokens.find((t) => t.symbol === 'mSOL')
//   const usdc = TOKEN_LIST.tokens.find((t) => t.symbol === 'USDC')

//   console.log('getPools:', allPools)

//   const myPool = allPools.find((p) => p.baseTokenMint.toBase58() === mSol?.address && p.quoteTokenMint.toBase58() === usdc?.address)

//   console.log('myPool: ', myPool)

//   if (!myPool) {
//     throw new Error('Pool not found!')
//   }
//   const states = await pool.getFarmingState({ poolPublicKey: myPool?.poolPublicKey })

//   const activeStates = states.filter((s) => !s.tokensTotal.eq(s.tokensUnlocked)) // Skip finished staking states


//   // Optional - resolve rewards
//   const stateVaults = await Promise.all(activeStates.map(async (state) => {
//     const t = new TokenProgram(connection, null, state.farmingTokenVault)
//     const tokenInfo = await t.getVaultTokenAmount()
//     return {
//       tokenInfo,
//       state,
//     }
//   })
//   )

//   stateVaults.forEach((sv) => {
//     console.log('Reward for staking: mint ', sv.tokenInfo.mint, 'reward ', sv.state.tokensPerPeriod.toString(), ' per', sv.state.periodLength)
//   })


//   const walletTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
//     programId: TOKEN_PROGRAM_ID,
//   })

//   const poolTokenAccount = walletTokens.value
//     .find((wt) => wt.account.data.parsed.info.mint === myPool.poolMint.toBase58())


//   if (!poolTokenAccount) {
//     throw new Error('No LP account - nothing to stake!')
//   }

//   const lpTokenAmount = new BN(poolTokenAccount.account.data.parsed.info.tokenAmount.amount)

//   if (lpTokenAmount.eqn(0)) {
//     throw new Error('LP account is empty - nothing to stake!')
//   }


//   console.log('Available to stake (LP tokens): ', lpTokenAmount.toString())

//   // Stake 10% of all tokens
//   const stakeAmount = lpTokenAmount.muln(0.1)

//   const fs = activeStates[0] // Start farming on any of active states
//   const txId = await pool.startFarming({
//     poolPublicKey: myPool.poolPublicKey,
//     farmingState: fs.farmingStatePublicKey,
//     lpTokenFreezeVault: myPool.lpTokenFreezeVault,
//     lpTokenAccount: poolTokenAccount.pubkey,
//     tokenAmount: stakeAmount,
//   })
//   // // myPool?.poolPublicKey
//   console.log('Start farming: transaction sent, ', txId)

// }

// async function useTokenSwap() {
//   const rinPool = AUTHORIZED_POOLS.RIN_USDC
//   const ts = await TokenSwap.loadTokenSwap(connection, rinPool.poolMint, POOLS_PROGRAM_ADDRESS, wallet.payer)
//   console.log('ts: ', ts)
// }


// async function getFarmingState() {
//   const mSolPool = await poolClient.getPools({ mint: AUTHORIZED_POOLS.mSOL_USDC.poolMint })

//   console.log('getPools:', mSolPool)

//   const myPool = mSolPool[0]

//   console.log('myPool: ', myPool)

//   if (!myPool) {
//     throw new Error('Pool not found!')
//   }
//   const states = await poolClient.getFarmingState({ poolPublicKey: myPool?.poolPublicKey })

//   const activeStates = states.filter((s) => !s.tokensTotal.eq(s.tokensUnlocked)) // Skip finished staking states


//   // console.log('activeStates: ', activeStates)
//   // Optional - resolve rewards
//   const stateVaults = await Promise.all(activeStates.map(async (state) => {
//     const tokenInfo = await tokenClient.getTokenAccount(state.farmingTokenVault)
//     const tokenMintInfo = await tokenClient.getMintInfo(tokenInfo.mint)
//     return {
//       tokenInfo,
//       state,
//       tokenMintInfo,
//     }
//   })
//   )

//   stateVaults.forEach((sv) => {
//     console.log('Reward for staking: mint ', sv.tokenInfo.mint, 'reward ', sv.state.tokensPerPeriod.toString(), ' per', sv.state.periodLength)
//   })


//   const walletTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
//     programId: TOKEN_PROGRAM_ID,
//   })

//   const poolTokenAccount = walletTokens.value
//     .find((wt) => wt.account.data.parsed.info.mint === myPool.poolMint.toBase58())


//   if (!poolTokenAccount) {
//     throw new Error('No LP account - nothing to stake!')
//   }

//   const lpTokenAmount = new BN(poolTokenAccount.account.data.parsed.info.tokenAmount.amount)

//   if (lpTokenAmount.eqn(0)) {
//     throw new Error('LP account is empty - nothing to stake!')
//   }


//   console.log('Available to stake (LP tokens): ', lpTokenAmount.toString())


//   const tickets = await poolClient.getFarmingTickets({ userKey: wallet.publicKey, pool: myPool.poolPublicKey })

//   if (tickets.length === 0) {
//     throw new Error('No tickets, nothing to check')
//   }

//   // const fs = activeStates[0] // Start farming on any of active states
//   // const queue = await poolClient.getFarmingSnapshotsQueue()
//   // stateVaults.forEach((fs) => {
//   //   tickets.forEach(async (t) => {
//   //     // console.log('Ticket state: ', t, t.tokensFrozen.toString(), t.statesAttached)

//   //     // const txId = await poolClient.endFarming({
//   //     //   wallet,
//   //     //   poolPublicKey: myPool.poolPublicKey,
//   //     //   farmingState: fs.farmingStatePublicKey,
//   //     //   farmingSnapshots: fs.farmingSnapshots,
//   //     //   farmingTicket: t.farmingTicketPublicKey,
//   //     //   lpTokenFreezeVault: myPool.lpTokenFreezeVault,
//   //     //   userPoolTokenAccount: poolTokenAccount.pubkey,
//   //     // })

//   //     // console.log('Unstake LP tokens: Transaction sent', txId)

//   //     const rewards = PoolClient.calculateFarmingRewards({
//   //       ticket: t,
//   //       queue,
//   //       state: fs.state, // Calculate for each state separately, sometimes there are few reward pools
//   //     })

//   //     console.log('Ticket reward for mint ', fs.tokenInfo.mint.toBase58(), ' : ', rewards.toNumber() / fs.tokenMintInfo.decimalDivider.toNumber())
//   //   })
//   // })

//   // console.log('tickets', tickets[0].statesAttached)


//   // // Stake 10% of all tokens
//   const stakeAmount = lpTokenAmount.muln(0.1)

//   const fs = activeStates[0] // Start farming on any of active states
//   const txId = await poolClient.startFarming({
//     poolPublicKey: myPool.poolPublicKey,
//     farmingState: fs.farmingStatePublicKey,
//     lpTokenFreezeVault: myPool.lpTokenFreezeVault,
//     lpTokenAccount: poolTokenAccount.pubkey,
//     tokenAmount: stakeAmount,
//     wallet,
//   })
//   // // // myPool?.poolPublicKey
//   console.log('Start farming: transaction sent, ', txId)

// }


// getFarmingState()
