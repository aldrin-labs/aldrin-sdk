import { PublicKey } from '@solana/web3.js'
import { connection, farmingClient, wallet } from '../common'

async function startFarming() {
  const farms = await farmingClient.getFarms({
    stakeMint: new PublicKey('DYXowmYDqBz4PPuhT6iXB5zFySnxKtT7mWRLeVfLDeJL'),
  })
  const farm = farms[0]

  if (!farm) {
    throw new Error('No farm found')
  }

  const farmers = await farmingClient.getFarmers({
    farm: farm.publicKey,
    authority: wallet.publicKey,
  })

  const farmer = farmers[0]

  if (!farmer) {
    throw new Error('Farmer not found!')
  }

  console.log('Harvests:')
  farm.harvests.forEach((harvest) => {
    console.log('- Mint:', harvest.mint.toString())
    harvest.periods.forEach((period) => {
      console.log('  - Period: start at ', period.startsAt.toString(), ', ends at', period.endsAt.toString())
      console.log('    - Rewards:', period.tps.toString())
    })
  })
  const slot = await connection.getSlot()
  console.log('----------------')
  console.log('Staked: ', farmer.staked.toString())
  console.log('Vested: ', farmer.vested.toString())
  console.log('Last calculation (slot): ', farmer.calculateNextHarvestFrom.toString(), ', current slot: ', slot)
  console.log('Available to claim:')
  farmer.harvests.forEach((harvest) => {
    console.log(' - Mint', harvest.mint.toString(), ', amount', harvest.tokens.toString())
  })

}

startFarming()
