import { PublicKey } from '@solana/web3.js'
import { FARMING_PROGRAM_ADDRESS } from '../constants'

export const getFarmSignerPda = async (farm: PublicKey) => {
  const [farmSignerPda] = await PublicKey.findProgramAddress(
    [Buffer.from('signer'), farm.toBytes()],
    new PublicKey(FARMING_PROGRAM_ADDRESS)
  )
  return farmSignerPda
}

export const getStakeVault = async (farm: PublicKey) => {
  const [stakeVault] = await PublicKey.findProgramAddress(
    [Buffer.from('stake_vault'), farm.toBytes()],
    new PublicKey(FARMING_PROGRAM_ADDRESS)
  )

  return stakeVault
}
export const getHarvestVault = async (farm: PublicKey, harvestMint: PublicKey) => {
  const [stakeVault] = await PublicKey.findProgramAddress(
    [Buffer.from('harvest_vault'), farm.toBytes(), harvestMint.toBytes()],
    new PublicKey(FARMING_PROGRAM_ADDRESS)
  )

  return stakeVault
}

export const getFarmer = async (farm: PublicKey, authority: PublicKey) => {
  const [farmer] = await PublicKey.findProgramAddress(
    [Buffer.from('farmer'), farm.toBytes(), authority.toBytes()],
    new PublicKey(FARMING_PROGRAM_ADDRESS)
  )

  return farmer
}
