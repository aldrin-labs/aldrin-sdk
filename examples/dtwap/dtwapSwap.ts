import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey, Transaction } from '@solana/web3.js'
import BN from 'bn.js'
import { Pool, SIDE, TokenSwap, TwAmm, DTwapSwap } from '../../src'
import { createTokenAccountTransaction, sendTransaction } from '../../src/transactions'
import { wallet, connection } from '../common'

const CONFIG = {
  base: new PublicKey('So11111111111111111111111111111111111111112'), //  SOL
  quote: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
  pairSettings: new PublicKey('5rG2fwqq8aw1mHSTHJE7bHXmitqapkxsg9u9SdqML7Pa'),
  pyth: new PublicKey('H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG'),
  priceDiff: 0.5, // Percentage between best (for arbitrage, worst for maker) bid & ask
}

async function doSwap() {

  const ammClient = await TokenSwap.initialize({
    wallet,
  })


  const dtwapSwap = await DTwapSwap.initialize({
    wallet: wallet,
  })


  const pool = ammClient.findPool(CONFIG.quote, CONFIG.base)

  if (!pool) {
    throw new Error('No pool')
  }

  const poolPrice = await ammClient.getPrice({
    mintFrom: CONFIG.quote,
    mintTo: CONFIG.base,
  })

  console.log('poolPrice: ', poolPrice)

  const buyPrices = await dtwapSwap.getPrices({
    mintFrom: CONFIG.quote,
    mintTo: CONFIG.base,
  })


  // const bestBuy = buyPrices[0]

  const sellPrices = await dtwapSwap.getPrices({
    mintFrom: CONFIG.base,
    mintTo: CONFIG.quote,
  })

  const bestSell = sellPrices[0]
  const bestBuy = buyPrices[0]

  if (!bestBuy && !bestSell) {
    console.warn('No orders: buy', bestBuy, ' sell: ', bestSell)
    return
  }

  const buyDif = bestBuy ? Math.log(poolPrice / bestBuy.price) * 100 : 0
  const sellDiff = bestSell ? Math.log((1 / bestSell.price) / poolPrice) * 100 : 0

  const buyOrder = buyDif > CONFIG.priceDiff ? bestBuy : undefined
  const sellOrder = sellDiff > CONFIG.priceDiff ? bestSell : undefined

  // We always have funds in quote (USDC), so calculate base diff to swap back
  const poolAmount = (bestBuy?.available.amountTo || new BN(0)).sub((bestSell?.available.amountFrom || new BN(0)))


  if (!poolAmount.eqn(0)) {
    const myTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    })


    const walletTokens = myTokens.value

    const baseMint = CONFIG.base.toBase58()
    const quoteMint = CONFIG.quote.toBase58()


    let userBaseTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === baseMint)?.pubkey


    const transaction = new Transaction()

    if (!userBaseTokenAccount) {
      const resp = await createTokenAccountTransaction({
        wallet,
        mint: new PublicKey(baseMint),
      })

      userBaseTokenAccount = resp.newAccountPubkey
      transaction.add(resp.transaction)
    }
    const userQuoteTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === quoteMint)

    if (!userQuoteTokenAccount) {
      console.warn('No quote account: mint ', quoteMint)
      return false
    }

    console.log('Price diffs: ',
      buyDif,
      sellDiff,
    )

    if (!buyOrder && !sellOrder) {
      console.log('No orders to arbitrage, wait...')
      return false
    }

    console.log('Do swap: ', buyOrder?.available.amountTo.toString(), poolAmount.toString(), sellOrder?.available.amountFrom.toString())

    if (buyOrder) {
      transaction.add(
        TwAmm.executeSwapInstruction({
          wallet,
          userFrom: userQuoteTokenAccount.pubkey,
          userTo: userBaseTokenAccount,
          pairSettings: CONFIG.pairSettings,
          pyth: CONFIG.pyth,
          orderArray: buyOrder.order.orderArray,
          signer: buyOrder.order.signer,
          twammFromTokenVault: buyOrder.order.twammFromTokenVault,
          twammToTokenVault: buyOrder.order.twammToTokenVault,
        })
      )
    }


    transaction.add(
      Pool.swapInstruction({
        userBaseTokenAccount: userBaseTokenAccount,
        userQuoteTokenAccount: userQuoteTokenAccount.pubkey,
        poolVersion: pool.pool.poolVersion,
        pool: pool.pool,
        outcomeAmount: poolAmount.abs(),
        minIncomeAmount: new BN(0), // TODO: Add slippage/checks/etc
        side: poolAmount.gtn(0) ? SIDE.ASK : SIDE.BID,
        wallet,
        walletAuthority: wallet.publicKey,
        poolSigner: pool.pool.poolSigner,
      })
    )

    if (sellOrder) {
      transaction.add(
        TwAmm.executeSwapInstruction({
          wallet,
          userFrom: userBaseTokenAccount,
          userTo: userQuoteTokenAccount.pubkey,
          pairSettings: CONFIG.pairSettings,
          pyth: CONFIG.pyth,
          orderArray: sellOrder.order.orderArray,
          signer: sellOrder.order.signer,
          twammFromTokenVault: sellOrder.order.twammFromTokenVault,
          twammToTokenVault: sellOrder.order.twammToTokenVault,
        })
      )
    }

    const txId = await sendTransaction({ transaction, connection, wallet })
    console.log('Arb tx sent: ', txId)

    return txId


  } else {
    console.log('Price diff less than threshold: ', buyDif, sellDiff)
  }

  console.log('Nothing to do here, wait 1min')

}

doSwap()
setInterval(doSwap, 60_000)

