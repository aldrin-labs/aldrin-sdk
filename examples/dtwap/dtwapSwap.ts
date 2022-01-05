import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey, Transaction } from '@solana/web3.js'
import BN from 'bn.js'
import { Pool, SIDE, TokenSwap, TwAmm, DTwapSwap } from '../../src'
import { sendTransaction } from '../../src/transactions'
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

  if (!bestBuy || !bestSell) {
    console.warn('No side: buy', bestBuy, ' sell: ', bestSell)
    return
  }

  const sellPrice = 1 / bestSell.price

  const priceDiff = Math.log(sellPrice / bestBuy.price) * 100

  if (priceDiff > CONFIG.priceDiff) {
    const myTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    })


    const walletTokens = myTokens.value

    const baseMint = CONFIG.base.toBase58()
    const quoteMint = CONFIG.quote.toBase58()


    const userBaseTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === baseMint)
    const userQuoteTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === quoteMint)

    if (userBaseTokenAccount && userQuoteTokenAccount) {
      console.log('Buy SOL price: ',
        bestBuy.order.orderArray.toString(),
        bestSell.order.orderArray.toString(),
        bestBuy.price, bestBuy.available.amountFrom.toString(),
        bestBuy.available.amountTo.toString(),
        ', Sell sol price: ',
        sellPrice,
        bestSell.available.amountFrom.toString(),
        bestSell.available.amountTo.toString(),
        ', diff, %: ',
        priceDiff,
      )
      // We always have funds in quote (USDC), so calculate base diff to swap back
      const baseDiff = bestBuy.available.amountTo.sub(bestSell.available.amountFrom)


      const transaction = new Transaction()
        .add(
          TwAmm.executeSwapInstruction({
            wallet,
            userFrom: userQuoteTokenAccount.pubkey,
            userTo: userBaseTokenAccount.pubkey,
            pairSettings: CONFIG.pairSettings,
            pyth: CONFIG.pyth,
            orderArray: bestBuy.order.orderArray,
            signer: bestBuy.order.signer,
            twammFromTokenVault: bestBuy.order.twammFromTokenVault,
            twammToTokenVault: bestBuy.order.twammToTokenVault,
          })
        )
        .add(
          Pool.swapInstruction({
            userBaseTokenAccount: userBaseTokenAccount.pubkey,
            userQuoteTokenAccount: userQuoteTokenAccount.pubkey,
            poolVersion: pool.pool.poolVersion,
            pool: pool.pool,
            outcomeAmount: baseDiff.abs(),
            minIncomeAmount: new BN(0), // TODO: Add slippage/checks/etc
            side: baseDiff.gtn(0) ? SIDE.ASK : SIDE.BID,
            wallet,
            walletAuthority: wallet.publicKey,
            poolSigner: pool.pool.poolSigner,
          })
        )
        .add(
          TwAmm.executeSwapInstruction({
            wallet,
            userFrom: userBaseTokenAccount.pubkey,
            userTo: userQuoteTokenAccount.pubkey,
            pairSettings: CONFIG.pairSettings,
            pyth: CONFIG.pyth,
            orderArray: bestSell.order.orderArray,
            signer: bestSell.order.signer,
            twammFromTokenVault: bestSell.order.twammFromTokenVault,
            twammToTokenVault: bestSell.order.twammToTokenVault,
          })
        )

      const txId = await sendTransaction({ transaction, connection, wallet })
      console.log('Arb tx sent: ', txId)

      return txId
    } else {
      console.warn('No account for base or quote: ', userBaseTokenAccount, userQuoteTokenAccount)
    }


  } else {
    console.log('Price diff less than threshold: ', priceDiff)
  }

  console.log('Nothing to do here, wait 1min')

}

doSwap()
setInterval(doSwap, 60_000)

