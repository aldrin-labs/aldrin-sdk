import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { wallet, farmingClient } from '../common'

async function startFarming() {
  const farms = await farmingClient.getFarms({
    stakeMint: new PublicKey('DYXowmYDqBz4PPuhT6iXB5zFySnxKtT7mWRLeVfLDeJL'),
  })
  farms.map((_) => console.log('Farms: ', _.publicKey.toString(), '  ', _.stakeMint.toString()))

  const txId = await farmingClient.startFarming({
    farm: farms[0].publicKey,
    tokenAmount: new BN(1_000_000),
    wallet,
  })

  console.log('Farming started:', txId)
 
}

startFarming()
