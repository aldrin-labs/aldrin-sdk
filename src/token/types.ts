
import { PublicKey, Transaction } from '@solana/web3.js'
import BN from 'bn.js'

export interface TokenInfoResponse {
  mintAuthorityOption: number
  mintAuthority: PublicKey
  supply: BN
  decimals: number
  isInitialized: number
  freezeAuthorityOption: number
  freezeAuthority: PublicKey
}

export interface TokenMintInfo {
  mintAuthorityOption: number
  mintAuthority: PublicKey
  supply: BN
  decimals: number
  isInitialized: number
  freezeAuthorityOption: number
  freezeAuthority: PublicKey
  decimalDenominator: BN
}

export interface TokenAccountInfo {
  mint:PublicKey
  owner: PublicKey
  amount: BN
  delegateOption: number
  delegate: PublicKey 
  state: number
  isNativeOption: number
  isNative: number
  delegatedAmount: BN
  closeAuthorityOption: number
  closeAuthority: PublicKey
}


export interface CreateAccountParams {
  owner: PublicKey
  mint: PublicKey
  amount?: number
}

export interface CreateAccountResponse {
  transaction: Transaction
  newAccountPubkey: PublicKey
}
