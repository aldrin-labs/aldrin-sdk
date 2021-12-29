import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { SIDE, WithWallet } from '..';
import { u64 } from '../utils';


export type TwAmmFees = {
  placingFeeNumerator: u64
  placingFeeDenominator: u64
  cancellingFeeNumerator: u64
  cancellingFeeDenominator: u64
}


export type TwAmmPair = {
  baseTokenMint: PublicKey
  quoteTokenMint: PublicKey
  authority: PublicKey
  baseTokenFeeAccount: PublicKey
  quoteTokenFeeAccount: PublicKey
  initializerAccount: PublicKey
  pyth: PublicKey // Oracle address
  discountNumerator: PublicKey
  discountDenominator: PublicKey
  minimumTokens: u64
  baseMintDecimals: number
  quoteMintDecimals: number
  fees: TwAmmFees
  pairSettings: PublicKey // Pair account
}

export type TwAmmOrder = {
  isInitialized: boolean
  amount: u64
  startTime: number
  endTime: number
  timeHorizon: number
  averageTransaction: u64
  amountFilled: u64
  amountToFill: u64
  stepsFilled: u64
  stepsToFill: u64
  tokensSwapped: u64
  authority: PublicKey
}

export type TwAmmOrderArrayBase = {
  twammFromTokenVault: PublicKey
  twammToTokenVault: PublicKey
  signer: PublicKey
  feeAccount: PublicKey
  pairSettings: PublicKey
  signerNonce: BN
  
  orders: TwAmmOrder[]
  orderArray: PublicKey
}

export type TwAmmOrderArayParsed = TwAmmOrderArrayBase & {
  side: { bid?: Record<string, never>, ask?: Record<string, never> } 
}

export type TwAmmOrderArayResponse = TwAmmOrderArrayBase & {
  side: SIDE
}

export type GetTwAmmOrders = {
  pairSettings?: PublicKey
  userKey?: PublicKey
}

export type GetTwammAvailableTokensParams = WithWallet & {
  pairSettings: PublicKey
  orderArray: PublicKey
  pyth: PublicKey
}

export type GetTwammResponse = {
  amountFrom: BN
  amountTo: BN
}

export type TwammExecuteSwapParams =  WithWallet & {
  pairSettings: PublicKey
  orderArray: PublicKey
  signer: PublicKey
  userFrom: PublicKey
  userTo: PublicKey
  twammFromTokenVault: PublicKey
  twammToTokenVault: PublicKey
  pyth: PublicKey
}
