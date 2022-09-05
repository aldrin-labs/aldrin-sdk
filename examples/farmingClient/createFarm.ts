import { AnchorProvider, Idl, Program } from '@project-serum/anchor'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey, Transaction } from '@solana/web3.js'
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

async function createFarm() {
  const program = new Program(
    idl as Idl,
    FARMING_PROGRAM_ADDRESS,
    new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions())
  )

  const currentSlot = await connection.getSlot()

  // const farm = Keypair.generate()
  const farm = new PublicKey('C5Cvmu4RCLxaosPuHLTysaLRpfW3yr8Zh8exgXTUQ9Es')
  const farmSignerPda = await getFarmSignerPda(farm)
  const stakeVault = await getStakeVault(farm)

  const stakeMint = new PublicKey('7bzpxU9RS9DNBgvRDGGYwoPcHjAYU8AyGjKB4eDQQuHm')
  const harvestMint = new PublicKey('BCP6eCN2W1Z918hVoF3q9xw79AxFHsVxM4RSPxxKXL2m')
  const harvestVault = await getHarvestVault(farm, harvestMint)

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
    // .add(
    //   await program.methods
    //     .createFarm()
    //     .accounts({
    //       admin: wallet.publicKey,
    //       farm: farm.publicKey,
    //       farmSignerPda,
    //       stakeMint,
    //       stakeVault,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //       systemProgram: SystemProgram.programId,
    //       rent: SYSVAR_RENT_PUBKEY,
    //     })
    //     .instruction()
    // ).add(
    //   await program.methods
    //     .addHarvest()
    //     .accounts({
    //       admin: wallet.publicKey,
    //       farm: farm.publicKey,
    //       farmSignerPda,
    //       harvestMint,
    //       harvestVault,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //       systemProgram: SystemProgram.programId,
    //       rent: SYSVAR_RENT_PUBKEY,
    //     })
    //     .instruction()
    // )
    .add(
      await program.methods
        .newHarvestPeriod(harvestMint, { slot: new BN(currentSlot + 100) }, new BN(80), { amount: new BN('100000000000') })
        .accounts({
          admin: wallet.publicKey,
          farm,
          harvestWallet: new PublicKey('3JVNogLH4t9Q6ozLSbiXtrb9EAgp72sJPEoerpMuwf6B'),
          harvestVault,
          farmSignerPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction()
    )

  const txId = await sendTransaction({ transaction: tx, wallet, connection, partialSigners: [c] })
  console.log('Transaciton sent:', txId)
}

createFarm()
