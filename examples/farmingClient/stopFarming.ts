import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { wallet, farmingClient } from '../common'

async function stopFarming() {
  const farms = await farmingClient.getFarms({
    stakeMint: new PublicKey('8yRDnJwirkTnNaw4TsyzwTfZzs81Vvn7hkoF7pbkBiRD'),
  })

  const txId = await farmingClient.stopFarming({
    farm: farms[0].publicKey,
    unstakeMax: new BN(1000000),
    wallet,
  })

  console.log('Farming stopped:', txId)
 
}

stopFarming()
