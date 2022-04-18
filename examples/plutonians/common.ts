import { wallet, connection } from '../common'
import idl from './plutonians.json'
import { Program, Idl, Provider } from 'anchor020'
import { PublicKey } from '@solana/web3.js'

export const PLUTONIANS_STAKING_PROGRAM = new PublicKey('HAjGJWMqqiCV2LdQWL7W7ho9cTCtaq7829sVtR1evz5a')
export const PLUTONIANS_STAKE_TOKEN_MINT = new PublicKey('3UGQ4Xpx8RBBjRGkTktm7j9raPn5tv91bScVKjNMyBiD')
export const PLUTONIANS_REWARD_TOKEN_MINT = new PublicKey('3UGQ4Xpx8RBBjRGkTktm7j9raPn5tv91bScVKjNMyBiD')

export const program = new Program(
  idl as Idl,
  PLUTONIANS_STAKING_PROGRAM,
  new Provider(
    connection,
    // walletAdapterToWallet(wallet),
    wallet, // TODO: resolve more gently?
    Provider.defaultOptions(),
  )
)

export const getBumpAccount = async () => PublicKey.findProgramAddress(
  [Buffer.from('staking_pool'), wallet.publicKey.toBytes(), PLUTONIANS_STAKE_TOKEN_MINT.toBytes(), PLUTONIANS_REWARD_TOKEN_MINT.toBytes()],
  PLUTONIANS_STAKING_PROGRAM
);
