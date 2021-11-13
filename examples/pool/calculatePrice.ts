import { AUTHORIZED_POOLS } from '../../src'
import { poolClient, tokenClient } from '../common'

/**
 * Calculate price of first token in pool RIN/USDC
 */
export async function calculatePoolPrice() {

  // Find pool info
  const allPools = await poolClient.getPools({ mint: AUTHORIZED_POOLS.RIN_USDC.poolMint })
  const myPool = allPools[0]

  const { baseTokenMint, baseTokenVault, quoteTokenMint, quoteTokenVault } = myPool


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

  console.log('Tokens amount in pool: :')
  console.log('Base (RIN): ', baseVaultAccount.amount.toString(), ', decimal denominator', baseTokenInfo.decimalDenominator.toNumber())
  console.log('Quote (USDC): ', quoteVaultAccount.amount.toString(), ', decimal denominator', quoteTokenInfo.decimalDenominator.toNumber())


  // Be careful: amount.toNumber() could give you overflow, better to use one of BigDecimal implementation - bn.js supports only ints
  const price =
    (quoteVaultAccount.amount.toNumber() / quoteTokenInfo.decimalDenominator.toNumber()) / (baseVaultAccount.amount.toNumber() / baseTokenInfo.decimalDenominator.toNumber())

  console.log('RIN price: ', price, ' USDC')
}
