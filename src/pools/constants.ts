import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { PoolCommon, WithPoolPK } from '.'

export const Side = {
  Bid: { bid: {} },
  Ask: { ask: {} },
}

const POOLS = {
  RIN_USDC: {
    poolMint: new PublicKey('Gathk79qZfJ4G36M7hiL3Ef1P5SDt7Xhm2C1vPhtWkrw'),
    poolPublicKey: new PublicKey('Gubmyfw5Ekdp4pkXk9be5yNckSgCdgd7JEThx8SFzCQQ'),
    baseTokenMint: new PublicKey('E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp'),
    quoteTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    baseTokenVault: new PublicKey('8YuEKfvSwcfNKvdoHijzrUAgEeevj4529m8SddSYQ8FV'),
    quoteTokenVault: new PublicKey('5P7J5sPvJmdnNX4JuhGDsNRnTihVMY8q4dHHbbmQUouJ'),
  },
  RIN_SOL: {
    poolMint: new PublicKey('HFNv9CeUtKFKm7gPoX1QG1NnrPnDhA5W6xqHGxmV6kxX'),
    poolPublicKey: new PublicKey('7nrkzur3LUxgfxr3TBj9GpUsiABCwMgzwtNhHKG4hPYz'),
    baseTokenMint: new PublicKey('E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp'),
    quoteTokenMint: new PublicKey('So11111111111111111111111111111111111111112'),
    baseTokenVault: new PublicKey('3reyueV93V8CxXakMk4FF96uqBibDS9Di7zWgjxhkqt7'),
    quoteTokenVault: new PublicKey('3LX2NHkUux6gGjiQXY2nMCnLTr9QuCjguqh7KTwaupV5'),
  },
  mSOL_USDT: {
    poolMint: new PublicKey('77qHkg6TEe4FuZAr35bthTEadmT4ueWe1xomFFZkwiGQ'),
    poolPublicKey: new PublicKey('FC4sYMpsMvdsq8hHMEtmWA8xN25W71t2c7RycU5juX35'),
    baseTokenMint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    quoteTokenMint: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    baseTokenVault: new PublicKey('4aiKnDHFmNnLsopVsDyRBh8sbVohZYgdGzh3P9orpqNB'),
    quoteTokenVault: new PublicKey('HFHGsYQyni5gFMGudaHWpRzN5CejNpHr42PfQ4D6aGZM'),
  },
  mSOL_ETH: {
    poolMint: new PublicKey('4KeZGuXPq9fyZdt5sfzHMM36mxTf3oSkDaa4Y4gHm9Hz'),
    poolPublicKey: new PublicKey('2JANvFVV2M8dv7twzL1EF3PhEJaoJpvSt6PhnjW6AHG6'),
    baseTokenMint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    quoteTokenMint: new PublicKey('2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk'),
    baseTokenVault: new PublicKey('9MaVbwbZw3LgFTNAPfDj4viRAffXFGaAdJWfX3ifouHf'),
    quoteTokenVault: new PublicKey('6YwwwDQcQz5qAEipFJXHe3vBMKDcs9nfZXLitEubMxFc'),
  },
  mSOL_BTC: {
    poolMint: new PublicKey('9hkYqNM8QSx2vTwspaNg5VvW1LBxKWWgud8pCVdxKYZU'),
    poolPublicKey: new PublicKey('13FjT6LMUH9LQLQn6KGjJ1GNXKvgzoDSdxvHvAd4hcan'),
    baseTokenMint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    quoteTokenMint: new PublicKey('9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E'),
    baseTokenVault: new PublicKey('EhWAErmyrX8nT1eT8HVFw37amsEkm5VjKZH4ZUreDRCs'),
    quoteTokenVault: new PublicKey('Fpy5DXqdz7mfLDF8PYKVzxQrYtsaiQu36fLpv6gmGseH'),
  },
  mSOL_USDC: {
    poolMint: new PublicKey('H37kHxy82uLoF8t86wK414KzpVJy7uVJ9Kvt5wYsTGPh'),
    poolPublicKey: new PublicKey('Af4TpzGpo8Yc61bCNwactPKH9F951tHPzp8XGxWRLNE1'),
    baseTokenMint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    quoteTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    baseTokenVault: new PublicKey('BEPiCaDinG2uLSBKjiVGAdDV32dwiemANKJYejtpbT2h'),
    quoteTokenVault: new PublicKey('9CDfE5NfRcQomM7bZ2fCBLe9XKebmu8QY5tBHzojS8d8'),
  },
  SOL_USDC: {
    poolMint: new PublicKey('3sbMDzGtyHAzJqzxE7DPdLMhrsxQASYoKLkHMYJPuWkp'),
    poolPublicKey: new PublicKey('4GUniSDrCAZR3sKtLa1AWC8oyYubZeKJQ8KraQmy3Wt5'),
    baseTokenMint: new PublicKey('So11111111111111111111111111111111111111112'),
    quoteTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    baseTokenVault: new PublicKey('CLt1DtCioiByTizqLhxLAXweXr2g9D4ZEAStibACBg4L'),
    quoteTokenVault: new PublicKey('2M1JTZsc71V6FhRNjCDSttcs17HewC4KNNNkkc81L3gB'),
  },
}


type Keys = keyof typeof POOLS

type PoolsMap = { [day in Keys]: PoolCommon & WithPoolPK  }

export const AUTHORIZED_POOLS: PoolsMap = POOLS


export const PRE_VESTING_DENOMINATOR = new BN(3) // User receive 1/3 of reward if vesting not ended

export const SOLANA_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com'
