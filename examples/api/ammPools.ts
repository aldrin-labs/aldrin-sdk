import { AldrinApiPoolsClient } from '../../src';

export async function getTotalVolumeLocked() {
  const client = new AldrinApiPoolsClient()

  const tvl = await client.getTotalVolumeLocked()
  console.log('TVL: ', tvl)

  const poolsInfo = await client.getPoolsInfo()

  console.log('poolsInfo: ', poolsInfo)
}

getTotalVolumeLocked()
