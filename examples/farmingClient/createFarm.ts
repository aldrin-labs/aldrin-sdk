import { AnchorProvider, Idl, Program } from '@project-serum/anchor'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js'
import { BN } from 'bn.js'
import { FARMING_PROGRAM_ADDRESS, sendTransaction } from '../../src'
import idl from '../../src/idl/farming.json'
import { connection, wallet } from '../common'

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

export const getWhitelistCompounding = async (farm: PublicKey) => {
  const [wl] = await PublicKey.findProgramAddress(
    [Buffer.from('whitelist_compounding'), farm.toBytes(), farm.toBytes()],
    new PublicKey(FARMING_PROGRAM_ADDRESS)
  )

  return wl
}


async function createFarm() {
  const program = new Program(
    idl as Idl,
    FARMING_PROGRAM_ADDRESS,
    new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions())
  )

  const currentSlot = await connection.getSlot()

  const farm = Keypair.generate()
  // const farm = new PublicKey('C5Cvmu4RCLxaosPuHLTysaLRpfW3yr8Zh8exgXTUQ9Es')
  const farmSignerPda = await getFarmSignerPda(farm.publicKey)
  const stakeVault = await getStakeVault(farm.publicKey)

  const RIN = new PublicKey('E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp')
  const stakeMint = RIN
  const harvestMint = RIN
  const harvestWallet = new PublicKey('INSERT_HARVEST_WALLET_HERE')
  const harvestVault = await getHarvestVault(farm.publicKey, harvestMint)

  const params = [{ slot: new BN(currentSlot + 100) }, new BN('periodLengthInSlots'), { amount: new BN('tokensPerSlot') }]

  const c = Keypair.generate()
  console.log('Created:',
    farm.toString(),
    stakeMint.toString(),
    harvestMint.toString(),
    stakeVault.toString(),
    harvestVault.toString(),
  )
  const tx = new Transaction()
    .add(
      await program.account.farm.createInstruction(c),
    )
    .add(
      await program.methods
        .createFarm()
        .accounts({
          admin: wallet.publicKey,
          farm: farm.publicKey,
          farmSignerPda,
          stakeMint,
          stakeVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction()
    ).add(
      await program.methods
        .addHarvest()
        .accounts({
          admin: wallet.publicKey,
          farm: farm.publicKey,
          farmSignerPda,
          harvestMint,
          harvestVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction()
    )
    .add(
      await program.methods
        .whitelistFarmForCompounding()
        .accounts({
          admin: wallet.publicKey,
          sourceFarm: farm.publicKey,
          targetFarm: farm.publicKey,
          whitelistCompounding: await getWhitelistCompounding(farm.publicKey),
        }).instruction()
    )
    .add(
      await program.methods
        .newHarvestPeriod(harvestMint, ...params)
        .accounts({
          admin: wallet.publicKey,
          farm: farm.publicKey,
          harvestWallet,
          harvestVault,
          farmSignerPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction()
    )

  const txId = await sendTransaction({ transaction: tx, wallet, connection })
  console.log('Transaciton sent:', txId)
}

createFarm()
