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
        new BN(10_000000000),
        {
          accounts: {
            pool,
            farmingState: new PublicKey('CR8Ah6vGck7p9tpR8CL6f4o4D9viZytvZ7TPhKy3TD6B'),
            farmingSnapshots: new PublicKey('GDCPeicDdTTUY97nKX95zduv9SNfzh4EMfgmaNQJERv1'),
            farmingTokenVault: new PublicKey('FSngMihexTk62nrhGVuW2Gxiw7DAEcgTKCWWRmDw3yik'),
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
