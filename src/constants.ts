import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

const POOLS_PROGRAM_ADDRESS = new PublicKey('AMM55ShdkoGRB5jVYPjWziwk8m5MpwyDgsMWHaMSQWH6')
const POOLS_V2_PROGRAM_ADDRESS = new PublicKey('CURVGoZn8zycx6FXwwevgBTB2gVvdbGTEpvMJDbgs2t4')
const DTWAP_PROGRAM_ADDRESS = new PublicKey('TWAPR9s1DEhrr8tuFbwEPws5moHXebMotqU85wwVmvU')
const STAKING_PROGRAM_ADDRESS = new PublicKey('rinajRPUgiiW2rG6uieXvcNNQNaWr9ZcMmqo28VvXfa')
const FARMING_PROGRAM_ADDRESS = new PublicKey('DFarMhaRkdYqhK5jZsexMftaJuWHrY7VzAfkXx5ZmxqZ') // TODO

export const PRECISION_NOMINATOR = new BN(1_000_000) // BN precision


export const EMPTY_PUBLIC_KEY = new PublicKey('11111111111111111111111111111111')

export {
  POOLS_PROGRAM_ADDRESS,
  POOLS_V2_PROGRAM_ADDRESS,
  DTWAP_PROGRAM_ADDRESS,
  STAKING_PROGRAM_ADDRESS,
  FARMING_PROGRAM_ADDRESS,
}
