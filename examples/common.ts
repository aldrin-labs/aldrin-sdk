
import { Wallet } from '@project-serum/anchor';
import { Connection, Keypair } from '@solana/web3.js';

import os from 'os'
import fs from 'fs'
import * as bs58 from 'bs58'
import BN from 'bn.js'
import { PoolClient, TokenClient } from '../src';

const privateKey = fs.readFileSync(
  os.homedir() + '/.config/aldrin/privatekey',
  {
    encoding: 'utf-8',
  }
)


const decoded = bs58.decode(privateKey)

const payer = Keypair.fromSecretKey(new Uint8Array(decoded))

const wallet = new Wallet(payer)


const connection = new Connection('https://api.mainnet-beta.solana.com');

const poolClient = new PoolClient(connection)
const tokenClient = new TokenClient(connection)

export {
  wallet,
  poolClient,
  connection,
  tokenClient,
}
