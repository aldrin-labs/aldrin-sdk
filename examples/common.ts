import { Connection, Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';
import fs from 'fs';
import os from 'os';
import { FarmingClient, PoolClient, TokenClient, TwAmmClient } from '../src';
import { Wallet } from './wallet';


const privateKey = fs.readFileSync(
  os.homedir() + '/.config/aldrin/privatekey',
  {
    encoding: 'utf-8',
  }
)

const decoded = bs58.decode(privateKey)

const payer = Keypair.fromSecretKey(new Uint8Array(decoded))


// const wallet = new NodeWallet(payer)
const wallet = new Wallet(payer)


const connection = new Connection('https://api.mainnet-beta.solana.com');

const poolClient = new PoolClient(connection)
const farmingClient = new FarmingClient(connection)
const tokenClient = new TokenClient(connection)
const twammClient = new TwAmmClient(connection)

export {
  wallet,
  poolClient,
  tokenClient,
  farmingClient,
  twammClient,
  connection,
};

