
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

const POOLS_PROGRAM_ADDRESS = new PublicKey('AMM55ShdkoGRB5jVYPjWziwk8m5MpwyDgsMWHaMSQWH6')
const POOLS_V2_PROGRAM_ADDRESS = new PublicKey('CURVGoZn8zycx6FXwwevgBTB2gVvdbGTEpvMJDbgs2t4')
const TWAMM_PROGRAM_ADDRESS = new PublicKey('G8m1KG1Po42eTPaQBVkU486sVAYU4hKwaueBPCe4Nrm4')


export const PRECISION_NOMINATOR = new BN(1_000_000) // BN precision

export {
  POOLS_PROGRAM_ADDRESS,
  POOLS_V2_PROGRAM_ADDRESS,
  TWAMM_PROGRAM_ADDRESS,
}
