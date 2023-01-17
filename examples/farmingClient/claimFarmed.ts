import { PublicKey } from '@solana/web3.js'
import { farmingClient, wallet } from '../common'

async function claimFarmed() {
  const farms = await farmingClient.getFarms({
    stakeMint: new PublicKey('DYXowmYDqBz4PPuhT6iXB5zFySnxKtT7mWRLeVfLDeJL'),
  })

  const txId = await farmingClient.claimFarmed({
    farm: farms[0].publicKey,
    wallet,
  })

  console.log('Farmed claimed:', txId)
 
}

claimFarmed()
