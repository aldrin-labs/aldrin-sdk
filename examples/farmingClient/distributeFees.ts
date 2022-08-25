import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js'
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

  const pool = new PublicKey('DSTdXLF62i8z6KJptxdrr3s3YtsuwhnpfoLNor4jRFnC')

  const tx = new Transaction()
    .add(
      await program.instruction.distributeFees(
        new BN(100_000000000),
        {
          accounts: {
            pool,
            farmingState: new PublicKey('2pXGJso2Zzp16KeK5y7ac3jgQr6Yz9bjRrNG5L3y8eWt'),
            farmingSnapshots: new PublicKey('Arima5vE5noxehtZLYVgQX3EEM6pemxSpEeqfT9N2qGj'),
            farmingTokenVault: new PublicKey('3umQCGSRTVB1x4XJASp2dHEaEeQJ2h15BueAq3RJnv8R'),
            feeAccount: new PublicKey('3JVNogLH4t9Q6ozLSbiXtrb9EAgp72sJPEoerpMuwf6B'),
            walletAuthority: wallet.publicKey,
            authority: wallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      )
    )
  const txId = await sendTransaction({ transaction: tx, wallet, connection })
  console.log('Transaciton sent:', txId)
}

createFarm()
