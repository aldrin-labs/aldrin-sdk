import { Idl, Program, Provider } from '@project-serum/anchor'
import { twammClient, wallet, connection } from '../common'
import idl from '../../src/idl/twamm.json'
import { SIDE, TWAMM_PROGRAM_ADDRESS } from '../../src'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

async function getPairs() {
  const pairs = await twammClient.getPairs()
  const pair = pairs[0]

  pairs.forEach((pair) => console.log('pair: ', pair.pairSettings.toBase58(), pair.baseTokenMint.toString(), pair.quoteTokenMint.toString()))

  const orders = await twammClient.getOrders({ pairSettings: pairs[0].pairSettings })


  const myTokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
    programId: TOKEN_PROGRAM_ID,
  })

  for (const orderArray of orders) {
    const availableTokens = await twammClient.getAvailableTokens({
      pairSettings: pair.pairSettings,
      pyth: pair.pyth,
      orderArray: orderArray.orderArray,
      wallet,
    })
    // console.log('getAvailable: ', 'from: ', getAvailable.amountFrom.toString(), 'to: ', getAvailable.amountTo.toString())


    const walletTokens = myTokens.value

    const baseMint = pair.baseTokenMint.toBase58()
    const quoteMint = pair.quoteTokenMint.toBase58()


    const userBaseTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === baseMint)
    const userQuoteTokenAccount = walletTokens.find((wt) => wt.account.data.parsed.info.mint === quoteMint)


    if (orderArray.side === SIDE.BID && userBaseTokenAccount && userQuoteTokenAccount && availableTokens.amountFrom.gtn(0)) {
      console.log('Try to execute swap: ',
        baseMint,
        quoteMint,
        orderArray.side,
        userBaseTokenAccount.pubkey.toString(),
        userQuoteTokenAccount.pubkey.toString(),

        availableTokens.amountFrom.toString(),
        availableTokens.amountTo.toString(),
        availableTokens.price,
      )

      return

      // const txId = await twammClient.executeSwap({
      //   wallet,
      //   pairSettings: pair.pairSettings,
      //   orderArray: orderArray.orderArray,
      //   userFrom: orderArray.side == SIDE.BID ? userBaseTokenAccount.pubkey : userQuoteTokenAccount.pubkey,
      //   userTo: orderArray.side == SIDE.BID ? userQuoteTokenAccount.pubkey : userBaseTokenAccount.pubkey,
      //   signer: orderArray.signer,
      //   twammFromTokenVault:  orderArray.twammFromTokenVault,
      //   twammToTokenVault:  orderArray.twammToTokenVault,
      //   pyth: pair.pyth,
      // })

      // console.log('Swap executed: ', txId)
      // return
    }
  }


}

getPairs()
