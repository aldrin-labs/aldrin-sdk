import { PublicKey } from '@solana/web3.js'
import { PoolClient } from '../src'

describe('PoolClient', () => {

  const RIN_USDC_POOL = new PublicKey('Gathk79qZfJ4G36M7hiL3Ef1P5SDt7Xhm2C1vPhtWkrw')
  test('Pools fetching', async () => {
    const client = new PoolClient()
    const pools = await client.getPools({ mint: RIN_USDC_POOL })
    expect(pools.length).toBe(1)

    const pool = pools[0]

    expect(pool.poolMint.toBase58()).toBe(RIN_USDC_POOL.toBase58())
  })
})


afterAll(done => {
  done()
})
