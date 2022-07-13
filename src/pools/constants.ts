import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { PoolCommon, WithPoolPK } from '.'

export const Side = {
  Bid: { bid: {} },
  Ask: { ask: {} },
}

export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112')

const POOLS = {
  RIN_USDC: {
    poolMint: new PublicKey('Gathk79qZfJ4G36M7hiL3Ef1P5SDt7Xhm2C1vPhtWkrw'),
    poolPublicKey: new PublicKey('Gubmyfw5Ekdp4pkXk9be5yNckSgCdgd7JEThx8SFzCQQ'),
    baseTokenMint: new PublicKey('E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp'),
    quoteTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    baseTokenVault: new PublicKey('8YuEKfvSwcfNKvdoHijzrUAgEeevj4529m8SddSYQ8FV'),
    quoteTokenVault: new PublicKey('5P7J5sPvJmdnNX4JuhGDsNRnTihVMY8q4dHHbbmQUouJ'),
    curveType: 0,
    poolVersion: 1,
  },
  RIN_SOL: {
    poolMint: new PublicKey('HFNv9CeUtKFKm7gPoX1QG1NnrPnDhA5W6xqHGxmV6kxX'),
    poolPublicKey: new PublicKey('7nrkzur3LUxgfxr3TBj9GpUsiABCwMgzwtNhHKG4hPYz'),
    baseTokenMint: new PublicKey('E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp'),
    quoteTokenMint: new PublicKey('So11111111111111111111111111111111111111112'),
    baseTokenVault: new PublicKey('3reyueV93V8CxXakMk4FF96uqBibDS9Di7zWgjxhkqt7'),
    quoteTokenVault: new PublicKey('3LX2NHkUux6gGjiQXY2nMCnLTr9QuCjguqh7KTwaupV5'),
    curveType: 0,
    poolVersion: 1,
  },
  mSOL_USDT: {
    poolMint: new PublicKey('77qHkg6TEe4FuZAr35bthTEadmT4ueWe1xomFFZkwiGQ'),
    poolPublicKey: new PublicKey('FC4sYMpsMvdsq8hHMEtmWA8xN25W71t2c7RycU5juX35'),
    baseTokenMint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    quoteTokenMint: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    baseTokenVault: new PublicKey('4aiKnDHFmNnLsopVsDyRBh8sbVohZYgdGzh3P9orpqNB'),
    quoteTokenVault: new PublicKey('HFHGsYQyni5gFMGudaHWpRzN5CejNpHr42PfQ4D6aGZM'),
    curveType: 0,
    poolVersion: 1,
  },
  mSOL_ETH: {
    poolMint: new PublicKey('4KeZGuXPq9fyZdt5sfzHMM36mxTf3oSkDaa4Y4gHm9Hz'),
    poolPublicKey: new PublicKey('2JANvFVV2M8dv7twzL1EF3PhEJaoJpvSt6PhnjW6AHG6'),
    baseTokenMint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    quoteTokenMint: new PublicKey('2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk'),
    baseTokenVault: new PublicKey('9MaVbwbZw3LgFTNAPfDj4viRAffXFGaAdJWfX3ifouHf'),
    quoteTokenVault: new PublicKey('6YwwwDQcQz5qAEipFJXHe3vBMKDcs9nfZXLitEubMxFc'),
    curveType: 0,
    poolVersion: 1,
  },
  mSOL_BTC: {
    poolMint: new PublicKey('9hkYqNM8QSx2vTwspaNg5VvW1LBxKWWgud8pCVdxKYZU'),
    poolPublicKey: new PublicKey('13FjT6LMUH9LQLQn6KGjJ1GNXKvgzoDSdxvHvAd4hcan'),
    baseTokenMint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    quoteTokenMint: new PublicKey('9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E'),
    baseTokenVault: new PublicKey('EhWAErmyrX8nT1eT8HVFw37amsEkm5VjKZH4ZUreDRCs'),
    quoteTokenVault: new PublicKey('Fpy5DXqdz7mfLDF8PYKVzxQrYtsaiQu36fLpv6gmGseH'),
    curveType: 0,
    poolVersion: 1,
  },
  mSOL_USDC: {
    poolMint: new PublicKey('H37kHxy82uLoF8t86wK414KzpVJy7uVJ9Kvt5wYsTGPh'),
    poolPublicKey: new PublicKey('Af4TpzGpo8Yc61bCNwactPKH9F951tHPzp8XGxWRLNE1'),
    baseTokenMint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    quoteTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    baseTokenVault: new PublicKey('BEPiCaDinG2uLSBKjiVGAdDV32dwiemANKJYejtpbT2h'),
    quoteTokenVault: new PublicKey('9CDfE5NfRcQomM7bZ2fCBLe9XKebmu8QY5tBHzojS8d8'),
    curveType: 0,
    poolVersion: 1,
  },
  SOL_USDC: {
    poolMint: new PublicKey('3sbMDzGtyHAzJqzxE7DPdLMhrsxQASYoKLkHMYJPuWkp'),
    poolPublicKey: new PublicKey('4GUniSDrCAZR3sKtLa1AWC8oyYubZeKJQ8KraQmy3Wt5'),
    baseTokenMint: new PublicKey('So11111111111111111111111111111111111111112'),
    quoteTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    baseTokenVault: new PublicKey('CLt1DtCioiByTizqLhxLAXweXr2g9D4ZEAStibACBg4L'),
    quoteTokenVault: new PublicKey('2M1JTZsc71V6FhRNjCDSttcs17HewC4KNNNkkc81L3gB'),
    curveType: 0,
    poolVersion: 1,
  },
  mSOL_UST: {
    poolMint: new PublicKey('BE7eTJ8DB7xTu6sKsch4gWDCXbD48PLGesRLx7E1Qce4'),
    poolPublicKey: new PublicKey('EnKhda5n5LYbZjPv7d7WChkSXzo5RgV8eSVVkGCXsQUn'),
    baseTokenMint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    quoteTokenMint: new PublicKey('9vMJfxuKxXBoEa7rM12mYLMwTacLMLDJqHozw96WQL8i'),
    baseTokenVault: new PublicKey('29jNBEn9VEvM5ppVLGThrGc7ExnT3WyNhYyqbizpyNFK'),
    quoteTokenVault: new PublicKey('6RmiUpwLquyQWVMeYx4oktQvtCuUH48fzRMwbC5kUa4h'),
    curveType: 0,
    poolVersion: 1,
  },
  mSOL_MNGO: {
    poolMint: new PublicKey('EotLYRsnRVqR3euN24P9PMXCqJv1WLsV8kJxR9o1y4U7'),
    poolPublicKey: new PublicKey('CAHchWN1xoxNvXmqmmj6U834ip585rXZbh9NkvE9vTea'),
    baseTokenMint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    quoteTokenMint: new PublicKey('MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac'),
    baseTokenVault: new PublicKey('FE3PR8sbojxrxWoTzuLHhDX5hAXfPocS9wCruSJ2y7BF'),
    quoteTokenVault: new PublicKey('CJzgYvbf2pv6HiTu13ymSVDSRmVQFoF8rkFYvwDNWVJL'),
    curveType: 0,
    poolVersion: 1,
  },
  LARIX_mSOL: {
    poolMint: new PublicKey('9X5EdjWCXsnu41EQBFbrpWvfjjftwFR2SVB1YRMEt1sF'),
    poolPublicKey: new PublicKey('3taPGAR6qVnDNtaRXvuWQUfiQCGFVpiDLNuCkYLqrv9N'),
    baseTokenMint: new PublicKey('Lrxqnh6ZHKbGy3dcrCED43nsoLkM1LTzU2jRfWe8qUC'),
    quoteTokenMint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    baseTokenVault: new PublicKey('2DByjmqChVBtLi6rbQRMbfRbddNSgJ7BodtgCBvTbd7d'),
    quoteTokenVault: new PublicKey('3FcohJaEgNrR3WQF8Da7k4yPzANSBoEjiEJkj2kzB5st'),
    curveType: 0,
    poolVersion: 1,
  },
  MEAN_mSOL: {
    poolMint: new PublicKey('5gpA85kbXyq6EwMftVgVVGWxoxwXu8Z8VvipNAqGPEpU'),
    poolPublicKey: new PublicKey('jzE2xMiQgVT5ku2nyQqZExPrQHQP6pJ4i29JSw72HCf'),
    baseTokenMint: new PublicKey('MEANeD3XDdUmNMsRGjASkSWdC8prLYsoRJ61pPeHctD'),
    quoteTokenMint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    baseTokenVault: new PublicKey('8acWiMKaRHgviDDWhym88TkWXaMJDUuBEYiSy58kazw'),
    quoteTokenVault: new PublicKey('8rdkCpqT2rZfUEwYQAGecVFJPjnQsUZjx4RB3LYXUCda'),
    curveType: 0,
    poolVersion: 1,
  },
  USDC_USDT: {
    poolMint: new PublicKey('2o83TXtZrgzub691p3tKnyFC67qVnQN8yCCW925WuBs6'),
    poolPublicKey: new PublicKey('3wpyb9CnJ9tcMHrUvwFqsPzdUhAtYZU8F4bxJRr2qd1P'),
    baseTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    quoteTokenMint: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    baseTokenVault: new PublicKey('2jmbKwqVJnwV5zqFNAiVSTAqzuYXj3KJuKMNboXVa2EY'),
    quoteTokenVault: new PublicKey('CHWKoACMrbjAk2YuY54EL5GxQvVEoqioFHvYpKQotX67'),
    curveType: 1,
    poolVersion: 2,
  },
  mSOL_SOL: {
    poolMint: new PublicKey('CCJ73enCHai27dS79uhqMYMGoehVQsP1YECyDq9xvyt9'),
    poolPublicKey: new PublicKey('2gCzKgSTPSy4fL7z9NQhJAKvumEofTa2DFJU4wGhQ5Jt'),
    baseTokenMint: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
    quoteTokenMint: new PublicKey('So11111111111111111111111111111111111111112'),
    baseTokenVault: new PublicKey('3VwacVEwZWLaGCjhWdkfnYhfLWMdfhRaoHJkouUVwKub'),
    quoteTokenVault: new PublicKey('FARYkuYJfe9putyXajbS3sAngXSMxk97kqRHT7iQhoV4'),
    curveType: 1,
    poolVersion: 2,
  },
}


const PERM_POOLS = {
  SLX_USDC: {
    poolMint: new PublicKey('E3XeF4QCTMMo8P5yrgqNMvoRJMyVPTNHhWkbRCgoeAfC'),
    poolPublicKey: new PublicKey('Hv5F48Br7dbZvUpKFuyxxuaC4v95C1uyDGhdkFFCc9Gf'),
    baseTokenMint: new PublicKey('AASdD9rAefJ4PP7iM89MYUsQEyCQwvBofhceZUGDh5HZ'),
    quoteTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    baseTokenVault: new PublicKey('BWwtpKxkKJSe4Vv9Ha6iGxdgWwxvy2k6qwooE6WjwUhG'),
    quoteTokenVault: new PublicKey('EF9M6hDSSTZhwdSrpKvkHn33EafZfRtaFQ9rq6MfqALm'),
  },
  DATE_USDC: {
    poolMint: new PublicKey('3gigDvmgCuz2gWRhr6iSxH1gCd1k4LpYoUsxEjLWJcLB'),
    poolPublicKey: new PublicKey('F5MWosWE681D32N5QHbWWaJrXaMAD2PHhDsEr2Sac56X'),
    baseTokenMint: new PublicKey('Ce3PSQfkxT5ua4r2JqCoWYrMwKWC5hEzwsrT9Hb7mAz9'),
    quoteTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    baseTokenVault: new PublicKey('A9FRb9MyAipfzEwkbF5euJ2dE7Bcj1GHBhdSdN8KBkoE'),
    quoteTokenVault: new PublicKey('EVdVfqSEhumJmL3adAs4qCpEGGBGUoTdqG1krqMDboi4'),
  },
  OOGI_USDC: {
    poolMint: new PublicKey('46EsyeSzs6tBoTRmFiGfDzGQe13LP337C7mMtdNMkgcU'),
    poolPublicKey: new PublicKey('6sKC96Z35vCNcDmA3ZbBd9Syx5gnTJdyNKVEdzpBE5uX'),
    baseTokenMint: new PublicKey('H7Qc9APCWWGDVxGD5fJHmLTmdEgT9GFatAKFNg6sHh8A'),
    quoteTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    baseTokenVault: new PublicKey('8fJUjr1o5i48R4URoQXDVbXmjrAUcRZWFkc2U2TMvgEd'),
    quoteTokenVault: new PublicKey('AdgHaAavPxwjBVw966dZPA9h9MbkbYXAXViGiQRBXMNJ'),
  },
}

type Keys = keyof typeof POOLS

type PoolsMap = { [day in Keys]: PoolCommon & WithPoolPK  }
type PermissionlessPoolsMap = { [day in keyof typeof PERM_POOLS]: PoolCommon & WithPoolPK  }

export const AUTHORIZED_POOLS: PoolsMap = POOLS
export const PERMISSIONLESS_POOLS: PermissionlessPoolsMap = PERM_POOLS


export const PRE_VESTING_NUMERATOR = new BN(1) // User receive 1/3 of reward if vesting not ended
export const PRE_VESTING_DENOMINATOR = new BN(3) // User receive 1/3 of reward if vesting not ended

export const VESTING_NUMERATOR = new BN(2) // User receive another 2/3 of reward if vesting  ended
export const VESTING_DENOMINATOR = new BN(3) // User receive another 2/3 of reward if vesting not ended

export const SWAP_FEE_NUMERATOR = new BN(3)
export const SWAP_FEE_DENOMINATOR = new BN(1000)

// export const SOLANA_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com'
export const SOLANA_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com'
