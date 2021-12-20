//! The curve.fi invariant calculator - TS implementation
import BN from 'bn.js';

const AMP = new BN(85)

const N_COINS = new BN(2)
const N_COINS_SQUARED = new BN(4)

interface SwapWithoutFeesResult {
  sourceAmountSwapped: BN
  destinationAmountSwapped: BN
}

/// Returns true of values differ not more than by 1
const almostEqual = (a: BN, b: BN): boolean => a.sub(b).abs().lte(new BN(1))


/// d = (leverage * sum_x + d_product * n_coins) * initial_d / ((leverage - 1) * initial_d + (n_coins + 1) * d_product)
export const calculateStep = (initD: BN, leverage: BN, sumX: BN, dProd: BN): BN => {
  const leverageMul = leverage.mul(sumX)
  const dpMul = dProd.mul(N_COINS)
  const lVal = leverageMul.add(dpMul).mul(initD)

  const leverageSub = initD
    .mul(
      leverage.subn(1)
    )

  const nCoinsSum = dProd
    .mul(
      N_COINS.addn(1)
    )

  const rVal = leverageSub.add(nCoinsSum)
  return lVal.div(rVal)
}

/// Compute stable swap invariant (D)
/// Equation:
/// A * sum(x_i) * n**n + D = A * D * n**n + D**(n+1) / (n**n * prod(x_i))

export const computeD = (leverage: BN, amountA: BN, amountB: BN): BN => {
  const amountATimesCoins = amountA.mul(N_COINS)
  const amountBTimesCoins = amountB.mul(N_COINS)

  const sumX = amountA.add(amountB)  // sum(x_i), a.k.a S

  if (sumX.eqn(0)) {
    return new BN(0)
  }

  let dPrev = new BN(0)
  let d = sumX

  // Newton's method to approximate D
  for (let i = 0; i < 32; i++) {
    const dProd = d
      .mul(d)
      .div(amountATimesCoins)
      .mul(d)
      .div(amountBTimesCoins)

    dPrev = d

    //d = (leverage * sum_x + d_p * n_coins) * d / ((leverage - 1) * d + (n_coins + 1) * d_p);
    d = calculateStep(d, leverage, sumX, dProd)

    // Equality with the precision of 1
    if (almostEqual(dPrev, d)) {
      return d
    }
  }

  return d
}


/// Compute swap amount `y` in proportion to `x`
/// Solve for y:
/// y**2 + y * (sum' - (A*n**n - 1) * D / (A * n**n)) = D ** (n + 1) / (n ** (2 * n) * prod' * A)
/// y**2 + b*y = c
export const newDestinationAmount = (
  leverage: BN,
  newFromTokenAmount: BN,
  d: BN
): BN => {
  // sum' = prod' = x
  // c =  D ** (n + 1) / (n ** (2 * n) * prod' * A)
  const c = d
    .pow(
      N_COINS.addn(1)
    )
    .div(
      newFromTokenAmount
        .mul(N_COINS_SQUARED)
        .mul(leverage)
    )

  // b = sum' - (A*n**n - 1) * D / (A * n**n)
  const b = newFromTokenAmount
    .add(
      d.div(leverage)
    )

  let y = d
  let yPrev = new BN(0)

  // Solve for y by approximating: y**2 + b*y = c
  for (let i = 0; i < 32; i++) {
    yPrev = y
    y = y
      .pow(new BN(2))
      .add(c)
      .div(
        y.muln(2).add(b).sub(d)
      )
    if (almostEqual(yPrev, y)) {
      return y
    }
  }

  return y
}

export const swapAmounts = (
  fromTokenAmount: BN, // Liquidity A
  toTokenAmount: BN, // Liquidity B
  tokenAmount: BN, // User A
): SwapWithoutFeesResult => {
  const leverage = AMP.mul(N_COINS_SQUARED)
  const newFromTokenAmount = fromTokenAmount.add(tokenAmount);
  const newToAmount = newDestinationAmount(
    leverage,
    newFromTokenAmount,
    computeD(leverage, fromTokenAmount, toTokenAmount),
  )

  const destinationAmountSwapped = toTokenAmount.sub(newToAmount)

  return {
    sourceAmountSwapped: tokenAmount,
    destinationAmountSwapped,
  }
}
