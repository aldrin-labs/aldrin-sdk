import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { AldrinApiPoolsClient, DEFAULT_FARMING_TICKET_END_TIME } from '../../src'; // or "@aldrin-exchange/sdk"
import { connection, farmingClient } from '../common';


/** Check farming state */
export async function checkLPPosition() {
  const apiClient = new AldrinApiPoolsClient()

  const pool = new PublicKey('B7ckp2dXhA8V8kE4bwMXWvuS4mwxCM2NCZbTu1bYoKPA')


  const poolTokenMint = new PublicKey('F8caiu7pwDYaK6S1BUtuxB9d5hicn7bQV5SMt9zPzog');
  const userWallet = new PublicKey('7woYstDDzUdTB9FSDGc5iEoAdYSQpFq2o9DWfsK5ZBgj');

  const stSolVault = new PublicKey('FQGiS3zKkBEPyC9xzcKEHEuJJ12rwMcAwKPHZfgr9vwq')
  const wsolVault = new PublicKey('dyPZGrAsWjzmbzX4nXBZXLDWWFGooynhTQWDSZ81WHy')

  const lpTokensAmount = await connection.getParsedTokenAccountsByOwner(userWallet, {
    programId: TOKEN_PROGRAM_ID,
  })
  // console.log('lpTokensAmount', lpTokensAmount.value)

  const acc = lpTokensAmount.value.find((acc) => acc.account.data.parsed.info.mint === poolTokenMint.toBase58())


  console.log('LP tokens:', acc?.account.data.parsed.info.tokenAmount.uiAmountString)

  const tickets = await farmingClient.getFarmingTickets({
    pool,
    userKey: userWallet,
    poolVersion: 2,
  })
  console.log('0')
  const stSolVaultBalance = await connection.getTokenAccountBalance(stSolVault)
  console.log('1')
  const wsolVaultBalance = await connection.getTokenAccountBalance(wsolVault)
  console.log('2')
  const lptokenSupply = await connection.getTokenSupply(poolTokenMint)
  console.log('3')
  const activeTickets = tickets.filter((_) => _.endTime.eq(DEFAULT_FARMING_TICKET_END_TIME))

  const lockedLPTokens = activeTickets.reduce((acc, ticket) => acc.add(ticket.tokensFrozen), new BN(0))

  const lockedTokensNumber = parseFloat(lockedLPTokens.toString())


  console.log('Amounts:')
  console.log('- LP tokens: Supply', lptokenSupply.value.uiAmount, ', Locked', lockedTokensNumber, ', on user wallet', acc?.account.data.parsed.info.tokenAmount.uiAmountString || 0)
  console.log('- stSOL', stSolVaultBalance.value.uiAmount)
  console.log('- (w)SOL', wsolVaultBalance.value.uiAmount)

  if (!lptokenSupply.value.uiAmount) {
    throw new Error('No LP tokens')
  }
  const participation = lockedTokensNumber / lptokenSupply.value.uiAmount;

  const stSOLPosition = (stSolVaultBalance.value.uiAmount || 0) * participation
  const wSOLPosition = (wsolVaultBalance.value.uiAmount || 0) * participation

  console.log('Your position: stSOL:', stSOLPosition.toFixed(4), ', wSOL:', wSOLPosition.toFixed(4))
  // const tokenSwap = await TokenSwap.initialize();

  // const farmed = await tokenSwap.getFarmed({
  //   wallet,
  //   poolMint: AUTHORIZED_POOLS.SOL_USDC.poolMint,
  // })


  // farmed.forEach((f) => {
  //   console.log(`Reward for farming: mint ${f.tokenInfo.mint.toBase58()}, amount: ${f.calcAccount?.tokenAmount.toString()}`)
  // })
}

checkLPPosition()
