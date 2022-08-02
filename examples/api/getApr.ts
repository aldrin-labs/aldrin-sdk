import { AldrinApiPoolsClient } from '../../src'; // or "@aldrin-exchange/sdk"

export async function getApr() {
  const client = new AldrinApiPoolsClient()
  const poolsInfo = await client.getPoolsInfo()

  const RIN_USDC_POOL = poolsInfo.find(pool => pool.name === 'RIN_USDC')
  console.log('pool:', RIN_USDC_POOL);

  if (RIN_USDC_POOL) {
    const RIN_PRICE = 0.3658; // $
    const totalLockedUsdValue = RIN_USDC_POOL.lpTokenFreezeVaultBalance.muln(
      RIN_USDC_POOL?.tvl.totalUsd || 0)
      .div(RIN_USDC_POOL.supply).toNumber()

    const activeFarmings = RIN_USDC_POOL.farmingStates.filter((f) => f.tokensTotal.gt(f.tokensUnlocked))

    console.log('activeFarmings', activeFarmings)
    // There is only RIN rewards
    const usdRewardsPerDay = activeFarmings.map((f) => {
      const rewardsPerDay = f.tokensPerPeriod.muln(24); // 24 hours
      const usdValue = (parseFloat(rewardsPerDay.toString()) / 10 ** f.farmingTokenMintDecimals) * RIN_PRICE;
      return usdValue;
    }).reduce((acc, usdValue) => acc + usdValue, 0)

    console.log('usdRewardsPerDay:', totalLockedUsdValue, usdRewardsPerDay)

    const rewardsPerYear = usdRewardsPerDay * 365;
    const apr = rewardsPerYear / totalLockedUsdValue * 100;

    console.log('APR: farming ', apr, ', pool fees', RIN_USDC_POOL.lpApr24h, ' total: ', apr + RIN_USDC_POOL.lpApr24h)
  }

}

getApr()
