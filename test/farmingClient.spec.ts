import { PublicKey } from '@solana/web3.js'
import { FarmingClient } from '../src'

describe('FarmingClient', () => {

  const RIN_USDC_POOL_PK = new PublicKey('Gubmyfw5Ekdp4pkXk9be5yNckSgCdgd7JEThx8SFzCQQ')

  test('Farming states fetching', async () => {
    const client = new FarmingClient()
    const farmingStates = await client.getFarmingState({ poolPublicKey: RIN_USDC_POOL_PK })

    expect(farmingStates.length).toBeGreaterThan(0)
    const fs = farmingStates[0]

    expect(fs.pool.toBase58()).toBe(RIN_USDC_POOL_PK.toBase58())
  })
})


afterAll(done => {
  done()
})
