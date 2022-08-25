import { Connection, Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';
import fs from 'fs';
import os from 'os';
import { StakingClient, FarmingClient, PoolClient, TokenClient, DTwapClient, SOLANA_RPC_ENDPOINT } from '../src';  // or "@aldrin-exchange/sdk"
import { Wallet } from './wallet';

// If you are working with the sources of SDK, not with an npm package, you should place you privateKey into ~/.config/aldrin/privateKey first
const privateKey = fs.readFileSync(
  os.homedir() + '/.config/aldrin/privatekey',
  {
    encoding: 'utf-8',
  }
)

// If you wallet privateKey is in base58 format, you have to use this approach of extracting your privateKey:
const decoded = bs58.decode(privateKey.trim())
// const payer = Keypair.fromSecretKey(new Uint8Array(decoded))
const payer = Keypair.fromSecretKey(new Uint8Array([169,202,118,127,81,16,121,159,69,178,29,242,178,105,237,72,20,90,62,6,96,99,220,38,90,145,159,224,161,204,8,189,148,133,178,90,234,27,106,173,204,61,5,214,112,218,85,120,8,212,61,96,95,75,60,157,68,244,151,37,52,24,94,225]))

console.log('payer', payer.publicKey.toString())
// If you wallet privateKey is in String<Uint8Array>, you have to use this approach of extracting your privateKey:
// const payer = Keypair.fromSecretKey(Buffer.from(JSON.parse(privateKey)))


// const wallet = new NodeWallet(payer)
const wallet = new Wallet(payer)


const connection = new Connection(SOLANA_RPC_ENDPOINT);

const poolClient = new PoolClient(connection)
const farmingClient = new FarmingClient(connection)
const tokenClient = new TokenClient(connection)
const dTwapClient = new DTwapClient(connection)
const stakingClient = new StakingClient(connection)

export {
  wallet,
  poolClient,
  tokenClient,
  farmingClient,
  dTwapClient,
  stakingClient,
  connection,
};

