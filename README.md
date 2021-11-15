# Aldrin DEX SDK

[![GitHub license](https://img.shields.io/badge/license-APACHE-blue.svg)](https://github.com/aldrin-exchange/aldrin-sdk/blob/main/LICENSE)

<p align="center">
  <img src="https://aldrin.com/logo.png" alt="Aldrin logo">
</p>

<p align="center">
  [<a href="https://dex.aldrin.com">Website</a> |  <a href="#">API Reference</a> | <a href="https://github.com/aldrin-exchange/aldrin-sdk/tree/main/examples">Examples</a> ]
</p>

## Instalation

```bash
npm install @aldrin/sdk
``` 
or 

```bash
yarn add @aldrin/sdk
```

## Usage

***

### Trade (swap tokens)

```js
import { Wallet } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { TokenSwap } from '../../src';


const wallet = Wallet.local() // Or any other solana wallet

async function trade() {
  const tokenSwap = await TokenSwap.initialize()

  const rin = new PublicKey('E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp')
  const usdc = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

  const rinPrice = await tokenSwap.getPrice({ mintFrom: rin, mintTo: usdc })
  const usdRinPrice = await tokenSwap.getPrice({ mintFrom: usdc, mintTo: rin })

  console.log(`RIN/USDC price: ${rinPrice}`, `USDC/RIN price: ${usdRinPrice}` )

  const transactionId = await tokenSwap.swap({
    wallet: wallet,
    minIncomeAmount: new BN(1_000_000_000), // 1 RIN
    // outcomeAmount: new BN(5_000_000) // 5 USDC
    mintFrom: usdc,
    mintTo: rin,
  })

  trade()
} 
```

***

### Add [pool](https://dex.aldrin.com/pools) liquidity


```js
import BN from 'bn.js'
import { Wallet } from '@project-serum/anchor';
import { AUTHORIZED_POOLS } from '../../src'

const wallet = Wallet.local() // Or any other solana wallet


async function depositLiquidity() {
   const tokenSwap = await TokenSwap.initialize()

  const transactionId = await tokenSwap.depositLiquidity({
    wallet: wallet,
    poolMint: AUTHORIZED_POOLS.RIN_USDC.poolMint,
    // maxBase: new BN(1_000_000_000), // 1 RIN
    maxQuote: new BN(5_000_000), // 5 USDC
  })

  console.log('Liquidity added: ', transactionId)
}
```

***

### Withdraw liquidity from pool

```js
import BN from 'bn.js'
import { Wallet } from '@project-serum/anchor';
import { AUTHORIZED_POOLS } from '../../src'

const wallet = Wallet.local() // Or any other solana wallet

export async function withdrawLiquidity() {
  const tokenSwap = await TokenSwap.initialize()

  const transactionId = await tokenSwap.withdrawLiquidity({
    wallet: wallet,
    poolMint: AUTHORIZED_POOLS.RIN_USDC.poolMint,
    poolTokenAmount: new BN(100_000), // LP tokens
    // minBase: new BN(1_000_000), // 1 RIN
    // minQuote: new BN(5_000_000), // 1 RIN
  })

  console.log('Liquidity withdrawed: ', transactionId)
}
```

You can find more complex examples by [link](https://github.com/aldrin-exchange/aldrin-sdk/tree/main/examples).


## Development

1. Clone [repository](https://github.com/aldrin-exchange/aldrin-sdk)
2. Run `yarn` or `npm install`


## Warning 
The library is under active development. Use it at your own risk.

