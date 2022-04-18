import { wallet, connection } from '../common'
import idl from './plutonians.json'
import { Program, Idl, Provider } from 'anchor020'
import { PublicKey } from '@solana/web3.js'

export const PLUTONIANS_STAKING_PROGRAM = new PublicKey('PLUSqEwLLUrkrGLJvBjevMQtpomPxcLHPjQQ6ZNvTsL')
export const PLUTONIANS_STAKE_TOKEN_MINT = new PublicKey('2cJgFtnqjaoiu9fKVX3fny4Z4pRzuaqfJ3PBTMk2D9ur') // PLD
export const PLUTONIANS_REWARD_TOKEN_MINT = new PublicKey('7p6zGHdmWHvCH4Lsik2MoMBXqPGhFbSPSceSBXd8KNEC') // PU238

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
