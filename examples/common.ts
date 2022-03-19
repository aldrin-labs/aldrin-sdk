import { Connection, Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';
import fs from 'fs';
import os from 'os';
import { FarmingClient, PoolClient, TokenClient, DTwapClient, SOLANA_RPC_ENDPOINT } from '../src';  // or "@aldrin-exchange/sdk" 
import { Wallet } from './wallet';

// If you are working with the sources of SDK, not with an npm package, you should place you privateKey into ~/.config/aldrin/privateKey first
const privateKey = fs.readFileSync(
  os.homedir() + '/.config/aldrin/privatekey',
  {
    encoding: 'utf-8',
  }
)

// If you wallet privateKey is in base58 format, you have to use this approach of extracting your privateKey:
const decoded = bs58.decode(privateKey)
const payer = Keypair.fromSecretKey(new Uint8Array(decoded))

// If you wallet privateKey is in String<Uint8Array>, you have to use this approach of extracting your privateKey:
// const payer = Keypair.fromSecretKey(Buffer.from(JSON.parse(privateKey)))


// const wallet = new NodeWallet(payer)
const wallet = new Wallet(payer)


const connection = new Connection(SOLANA_RPC_ENDPOINT);

const poolClient = new PoolClient(connection)
const farmingClient = new FarmingClient(connection)
const tokenClient = new TokenClient(connection)
const dTwapClient = new DTwapClient(connection)

export {
  wallet,
  poolClient,
  tokenClient,
  farmingClient,
  dTwapClient,
  connection,
};

