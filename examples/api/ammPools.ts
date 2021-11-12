import { AldrinApiPoolsClient } from '../../src';

export async function getTotalVolumeLocked() {
  const client = new AldrinApiPoolsClient()

  const result = await client.getTotalVolumeLocked()
  console.log('result: ', result)
}

getTotalVolumeLocked()
