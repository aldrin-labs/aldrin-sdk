import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js'
import { Idl, Program, Provider } from 'anchor12'
import { sendTransaction } from '../../src'
import idl from '../../src/idl/staking.json'
import { connection, wallet } from '../common'

const OLD_FARM_ADDR = new PublicKey('HST7rrdcpugJ1SfBJKw513asrdnMBiaMcjtBJzJSD484')
async function createFarm() {
  const program = new Program(
    idl as Idl,
    OLD_FARM_ADDR,
    new Provider(connection, wallet, Provider.defaultOptions())
  )

  const farm = Keypair.generate()

  const stakeMint = new PublicKey('BCP6eCN2W1Z918hVoF3q9xw79AxFHsVxM4RSPxxKXL2m')
  const harvestMint = new PublicKey('BCP6eCN2W1Z918hVoF3q9xw79AxFHsVxM4RSPxxKXL2m')

  const [vaultSigner, vaultSignerNonce] = await PublicKey.findProgramAddress(
    [farm.publicKey.toBuffer()],
    OLD_FARM_ADDR
  )

  const stakingVault = Keypair.generate()


  console.log('Created:',
    farm.publicKey.toString(),
    stakeMint.toString(),
    harvestMint.toString(),
    stakingVault.publicKey.toString(),
  )

  const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(connection);


  const tx = new Transaction()
    .add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: stakingVault.publicKey,
        lamports: balanceNeeded,
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
      })
    )
    .add(
      Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID, stakeMint, stakingVault.publicKey, vaultSigner
      )
    )
    // .add(
    //   Token.createSetAuthorityInstruction(
    //     TOKEN_PROGRAM_ID, stakingVault.publicKey, vaultSigner, 'CloseAccount', wallet.publicKey, []
    //   )
    // )
    // .add(
    //   Token.createSetAuthorityInstruction(
    //     TOKEN_PROGRAM_ID, stakingVault.publicKey, vaultSigner, 'AccountOwner', wallet.publicKey, []
    //   )
    // )
    .add(
      await program.account.stakingPool.createInstruction(farm),
    )
    .add(
      await program.instruction.initialize(
        vaultSignerNonce,
        {
          accounts: {
            pool: farm.publicKey,
            poolMint: stakeMint,
            stakingVault: stakingVault.publicKey,
            poolSigner: vaultSigner,
            authority: wallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      )
    )
  const txId = await sendTransaction({ transaction: tx, wallet, connection, partialSigners: [farm, stakingVault] })
  console.log('Transaciton sent:', txId)
}

createFarm()
