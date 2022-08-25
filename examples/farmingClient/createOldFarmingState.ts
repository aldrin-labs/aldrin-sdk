import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js'
import { Idl, Program, Provider } from 'anchor12'
import { BN } from 'bn.js'
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

  const farmingState = Keypair.generate()
  const snapshots = Keypair.generate()
  const farmingTokenVault = Keypair.generate()

  const stakeMint = new PublicKey('BCP6eCN2W1Z918hVoF3q9xw79AxFHsVxM4RSPxxKXL2m')
  const harvestMint = new PublicKey('BCP6eCN2W1Z918hVoF3q9xw79AxFHsVxM4RSPxxKXL2m')


  const pool = new PublicKey('DSTdXLF62i8z6KJptxdrr3s3YtsuwhnpfoLNor4jRFnC')


  console.log('Created:',
    farmingState.publicKey.toString(),
    stakeMint.toString(),
    harvestMint.toString(),
    farmingState.publicKey.toString(),
  )

  const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(connection);

  const [vaultSigner, vaultSignerNonce] = await PublicKey.findProgramAddress(
    [pool.toBuffer()],
    OLD_FARM_ADDR
  )

  const tx = new Transaction()
    .add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: farmingTokenVault.publicKey,
        lamports: balanceNeeded,
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
      })
    )
    .add(
      Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID, stakeMint, farmingTokenVault.publicKey, vaultSigner
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
      await program.account.farmingState.createInstruction(farmingState),
    )
    .add(
      await program.account.snapshotQueue.createInstruction(snapshots),
    )

    .add(
      await program.instruction.initializeFarming(
        new BN(1000_000000000), // tokenAmount
        new BN(100_000000000), //tokensPerPeriod
        new BN(600), // periodLength
        new BN(0), //noWithdrawPeriodSeconds
        new BN(0), //vestingPeriodSeconds
        {
          accounts: {
            pool,
            farmingState: farmingState.publicKey,
            snapshots: snapshots.publicKey,
            farmingTokenVault: farmingTokenVault.publicKey,
            farmingAuthority: wallet.publicKey,
            walletAuthority: wallet.publicKey,
            farmingTokenAccount: new PublicKey('3JVNogLH4t9Q6ozLSbiXtrb9EAgp72sJPEoerpMuwf6B'),
            tokenProgram: TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      )
    )
  const txId = await sendTransaction({ transaction: tx, wallet, connection, partialSigners: [farmingState, farmingTokenVault, snapshots] })
  console.log('Transaciton sent:', txId)
}

createFarm()
