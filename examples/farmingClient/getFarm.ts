import { PublicKey } from '@solana/web3.js'
import { farmingClient } from '../common'
async function getFarm() {
  const farms = await farmingClient.getFarms({
    stakeMint: new PublicKey('8yRDnJwirkTnNaw4TsyzwTfZzs81Vvn7hkoF7pbkBiRD'),
  })

  console.log('Farm:', farms[0])
}

getFarm()
