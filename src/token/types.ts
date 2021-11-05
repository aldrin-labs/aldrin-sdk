import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

export interface TokenInfo {
  mintAuthorityOption: number
  mintAuthority: PublicKey
  supply: BN
  decimals: number
  decDelimiter: number
  decDelimiterBN: BN
  isInitialized: number
  freezeAuthorityOption: number
  freezeAuthority: PublicKey
}
