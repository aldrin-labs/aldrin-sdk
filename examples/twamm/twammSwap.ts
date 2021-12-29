import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey, Transaction } from '@solana/web3.js'
import { TokenSwap, TwAmm, TwAmmSwap } from '../../src'
import { sendTransaction } from '../../src/transactions'
import { connection, wallet } from '../common'

async function twammSwap() {
  const base = new PublicKey('8wxoc2AnVsT6aLXDyA2G9PKfpx8mVT1Q5pPgvQLpCEVM') // Pseudo-SOL
  const quote = new PublicKey('A1BsqP5rH3HXhoFK6xLK6EFv9KsUzgR1UwBQhzMW9D2m') // Pseudo-USDC
  const pairSettings = new PublicKey('ARbb3kf9URdh6RNeUJWMsnmQVF8pnXZvQtuLAjZaqSZp')
  const pyth = new PublicKey('H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG')

  const ammClient = await TokenSwap.initialize({
    wallet,
  })

  const poolPrice = await ammClient.getPrice({
    mintFrom: quote,
    mintTo: base,
  })

  console.log('poolPrice: ', poolPrice)

  const twammSwap = await TwAmmSwap.initialize({
    wallet: wallet,
  })


  const buyPrices = await twammSwap.getPrices({
    mintFrom: quote,
    mintTo: base,
  })

  const bestBuy = buyPrices[0]

  const sellPrices = await twammSwap.getPrices({
    mintFrom: base,
    mintTo: quote,
  })

  const bestSell = sellPrices[0]

  const sellPrice = 1 / bestSell.price

  const logreturn = Math.log(sellPrice / bestBuy.price) * 100

  if (logreturn > 1) {
    console.log('Buy SOL price: ',
      bestBuy.price, bestBuy.available.amountFrom.toString(),
      bestBuy.available.amountTo.toString(),
      ', Sell sol price: ',
      sellPrice,
      bestSell.available.amountFrom.toString(),
      bestSell.available.amountTo.toString(),
      ', diff, %: ',
      logreturn,
    )


    const myTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    })

    const walletTokens = myTokens.value

    const baseMint = base.toBase58()
    const quoteMint = quote.toBase58()


    const userBaseTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === baseMint)
    const userQuoteTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === quoteMint)


    if (userBaseTokenAccount && userQuoteTokenAccount) {
      const transaction = new Transaction()
        .add(
          TwAmm.executeSwapInstruction({
            wallet,
            userFrom: userQuoteTokenAccount.pubkey,
            userTo: userBaseTokenAccount.pubkey,
            pairSettings,
            pyth,
            orderArray: bestBuy.order.orderArray,
            signer: bestBuy.order.signer,
            twammFromTokenVault: bestBuy.order.twammFromTokenVault,
            twammToTokenVault: bestBuy.order.twammToTokenVault,
          })
        )
        .add(
          TwAmm.executeSwapInstruction({
            wallet,
            userFrom: userBaseTokenAccount.pubkey,
            userTo: userQuoteTokenAccount.pubkey,
            pairSettings,
            pyth,
            orderArray: bestSell.order.orderArray,
            signer: bestSell.order.signer,
            twammFromTokenVault: bestSell.order.twammFromTokenVault,
            twammToTokenVault: bestSell.order.twammToTokenVault,
          })
        )

      const txId = await sendTransaction({ transaction, connection, wallet })
      console.log('txId: ', txId)
    }

  }

}

twammSwap()
