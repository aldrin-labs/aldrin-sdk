import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { SIDE, WithWallet } from '..';
import { u64 } from '../utils';


export type DTwapFees = {
  placingFeeNumerator: u64
  placingFeeDenominator: u64
  cancellingFeeNumerator: u64
  cancellingFeeDenominator: u64
}


export type DTwapPair = {
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
  fees: DTwapFees
  pairSettings: PublicKey // Pair account
}

export type DTwapOrder = {
  isInitialized: boolean
  amount: u64
  startTime: BN
  endTime: BN
  timeHorizon: BN
  averageTransaction: u64
  amountFilled: u64
  amountToFill: u64
  stepsFilled: u64
  stepsToFill: u64
  tokensSwapped: u64
  authority: PublicKey
}

export type DTwapOrderArrayBase = {
  twammFromTokenVault: PublicKey
  twammToTokenVault: PublicKey
  signer: PublicKey
  feeAccount: PublicKey
  pairSettings: PublicKey
  signerNonce: BN
  
  orders: DTwapOrder[]
  orderArray: PublicKey
}

export type DTwapOrderArayParsed = DTwapOrderArrayBase & {
  side: { bid?: Record<string, never>, ask?: Record<string, never> } 
}

export type DTwapOrderArayResponse = DTwapOrderArrayBase & {
  side: SIDE
}

export type GetDTwapOrders = {
  pairSettings?: PublicKey
  userKey?: PublicKey
}

export type GetDTwapAvailableTokensParams = WithWallet & {
  pairSettings: PublicKey
  orderArray: PublicKey
  pyth: PublicKey
}

export type GetDTwapResponse = {
  amountFrom: BN
  amountTo: BN
}

export type DTwapExecuteSwapParams =  WithWallet & {
  pairSettings: PublicKey
  orderArray: PublicKey
  signer: PublicKey
  userFrom: PublicKey
  userTo: PublicKey
  twammFromTokenVault: PublicKey
  twammToTokenVault: PublicKey
  pyth: PublicKey
}
