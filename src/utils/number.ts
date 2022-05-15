import BN from 'bn.js'

export const bnToNumber = (bn: BN): number => {
  return parseInt(bn.toString(), 10)
}
