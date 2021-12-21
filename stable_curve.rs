//! The curve.fi invariant calculator.
use crate::curve::{
  calculator::{
      CurveCalculator, SwapWithoutFeesResult, TradeDirection,
  },
};
use spl_math::{precise_number::PreciseNumber, uint::U256};
use std::convert::TryFrom;
const N_COINS: u8 = 2;
const N_COINS_SQUARED: u8 = 4;
/// Returns self to the power of b
fn checked_u8_power(a: &U256, b: u8) -> Option<U256> {
  let mut result = *a;
  for _ in 1..b {
      result = result.checked_mul(*a)?;
  }
  Some(result)
}
/// Returns self multiplied by b
fn checked_u8_mul(a: &U256, b: u8) -> Option<U256> {
  let mut result = *a;
  for _ in 1..b {
      result = result.checked_add(*a)?;
  }
  Some(result)
}
/// Returns true of values differ not more than by 1
fn almost_equal(a: &U256, b: &U256) -> Option<bool> {
  if a > b {
      Some(a.checked_sub(*b)? <= U256::one())
  } else {
      Some(b.checked_sub(*a)? <= U256::one())
  }
}
/// StableCurve struct implementing CurveCalculator
#[derive(Clone, Debug, Default, PartialEq)]
pub struct StableCurve {
  /// Amplifier constant
  pub amp: u64,
}
/// d = (leverage * sum_x + d_product * n_coins) * initial_d / ((leverage - 1) * initial_d + (n_coins + 1) * d_product)
fn calculate_step(initial_d: &U256, leverage: u64, sum_x: u128, d_product: &U256) -> Option<U256> {
  let leverage_mul = U256::from(leverage).checked_mul(sum_x.into())?;
  let d_p_mul = checked_u8_mul(&d_product, N_COINS)?;
  let l_val = leverage_mul.checked_add(d_p_mul)?.checked_mul(*initial_d)?;
  let leverage_sub = initial_d.checked_mul((leverage.checked_sub(1)?).into())?;
  let n_coins_sum = checked_u8_mul(&d_product, N_COINS.checked_add(1)?)?;
  let r_val = leverage_sub.checked_add(n_coins_sum)?;
  l_val.checked_div(r_val)
}
/// Compute stable swap invariant (D)
/// Equation:
/// A * sum(x_i) * n**n + D = A * D * n**n + D**(n+1) / (n**n * prod(x_i))
fn compute_d(leverage: u64, amount_a: u128, amount_b: u128) -> Option<u128> {
  let amount_a_times_coins = checked_u8_mul(&U256::from(amount_a), N_COINS)?;
  let amount_b_times_coins = checked_u8_mul(&U256::from(amount_b), N_COINS)?;
  let sum_x = amount_a.checked_add(amount_b)?; // sum(x_i), a.k.a S
  if sum_x == 0 {
      Some(0)
  } else {
      let mut d_previous: U256;
      let mut d: U256 = sum_x.into();
      // Newton's method to approximate D
      for _ in 0..32 {
          let mut d_product = d;
          d_product = d_product
              .checked_mul(d)?
              .checked_div(amount_a_times_coins)?;
          d_product = d_product
              .checked_mul(d)?
              .checked_div(amount_b_times_coins)?;
          d_previous = d;
          //d = (leverage * sum_x + d_p * n_coins) * d / ((leverage - 1) * d + (n_coins + 1) * d_p);
          d = calculate_step(&d, leverage, sum_x, &d_product)?;
          // Equality with the precision of 1
          if almost_equal(&d, &d_previous)? {
              break;
          }
      }
      u128::try_from(d).ok()
  }
}
/// Compute swap amount `y` in proportion to `x`
/// Solve for y:
/// y**2 + y * (sum' - (A*n**n - 1) * D / (A * n**n)) = D ** (n + 1) / (n ** (2 * n) * prod' * A)
/// y**2 + b*y = c
fn compute_new_destination_amount(
  leverage: u64,
  new_source_amount: u128,
  d_val: u128,
) -> Option<u128> {
  // Upscale to U256
  let leverage: U256 = leverage.into();
  let new_source_amount: U256 = new_source_amount.into();
  let d_val: U256 = d_val.into();
  // sum' = prod' = x
  // c =  D ** (n + 1) / (n ** (2 * n) * prod' * A)
  let c = checked_u8_power(&d_val, N_COINS.checked_add(1)?)?
      .checked_div(checked_u8_mul(&new_source_amount, N_COINS_SQUARED)?.checked_mul(leverage)?)?;
  // b = sum' - (A*n**n - 1) * D / (A * n**n)
  let b = new_source_amount.checked_add(d_val.checked_div(leverage)?)?;
  // Solve for y by approximating: y**2 + b*y = c
  let mut y_prev: U256;
  let mut y = d_val;
  for _ in 0..32 {
      y_prev = y;
      y = (checked_u8_power(&y, 2)?.checked_add(c)?)
          .checked_div(checked_u8_mul(&y, 2)?.checked_add(b)?.checked_sub(d_val)?)?;
      if almost_equal(&y, &y_prev)? {
          break;
      }
  }
  u128::try_from(y).ok()
}
impl CurveCalculator for StableCurve {
  /// Stable curve
  fn swap_without_fees(
      &self,
      source_amount: u128,
      swap_source_amount: u128,
      swap_destination_amount: u128,
      _trade_direction: TradeDirection,
  ) -> Option<SwapWithoutFeesResult> {
      let leverage = self.amp.checked_mul(N_COINS_SQUARED as u64)?;
      let new_source_amount = swap_source_amount.checked_add(source_amount)?;
      let new_destination_amount = compute_new_destination_amount(
          leverage,
          new_source_amount,
          compute_d(leverage, swap_source_amount, swap_destination_amount)?,
      )?;
      let amount_swapped = swap_destination_amount.checked_sub(new_destination_amount)?;
      Some(SwapWithoutFeesResult {
          source_amount_swapped: source_amount,
          destination_amount_swapped: amount_swapped,
      })
  }
  fn withdraw_single_token_type_exact_out(
      &self,
      source_amount: u128,
      swap_token_a_amount: u128,
      swap_token_b_amount: u128,
      pool_supply: u128,
      trade_direction: TradeDirection,
  ) -> Option<u128> {
      if source_amount == 0 {
          return Some(0);
      }
      let leverage = self.amp.checked_mul(N_COINS as u64)?;
      let d0 = PreciseNumber::new(compute_d(
          leverage,
          swap_token_a_amount,
          swap_token_b_amount,
      )?)?;
      let (withdraw_token_amount, other_token_amount) = match trade_direction {
          TradeDirection::AtoB => (swap_token_a_amount, swap_token_b_amount),
          TradeDirection::BtoA => (swap_token_b_amount, swap_token_a_amount),
      };
      let updated_deposit_token_amount = withdraw_token_amount.checked_sub(source_amount)?;
      let d1 = PreciseNumber::new(compute_d(
          leverage,
          updated_deposit_token_amount,
          other_token_amount,
      )?)?;
      let diff = d0.checked_sub(&d1)?;
      let final_amount =
          (diff.checked_mul(&PreciseNumber::new(pool_supply)?))?.checked_div(&d0)?;
      final_amount.ceiling()?.to_imprecise()
  }
}
#[cfg(test)]
mod tests {
  use super::*;
  use proptest::prelude::*;
  use sim::StableSwapModel;
  proptest! {
      #[test]
      fn constant_product_swap_no_fee(
          swap_source_amount in 100..1_000_000_000_000_000_000u128,
          swap_destination_amount in 100..1_000_000_000_000_000_000u128,
          source_amount in 100..100_000_000_000u128,
          amp in 2..150u64
      ) {
          prop_assume!(source_amount < swap_source_amount);
          let curve = StableCurve { amp };
          let model: StableSwapModel = StableSwapModel::new(
              curve.amp.into(),
              vec![swap_source_amount, swap_destination_amount],
              N_COINS,
          );
          let result = curve.swap_without_fees(
              source_amount,
              swap_source_amount,
              swap_destination_amount,
              TradeDirection::AtoB,
          );
          let result = result.unwrap();
          let sim_result = model.sim_exchange(0, 1, source_amount);
          let diff =
              (sim_result as i128 - result.destination_amount_swapped as i128).abs();
          let tolerance = std::cmp::max(1, sim_result as i128 / 1_000_000_000);
          assert!(
              diff <= tolerance,
              "result={}, sim_result={}, amp={}, source_amount={}, swap_source_amount={}, swap_destination_amount={}, diff={}, tolerance={}",
              result.destination_amount_swapped,
              sim_result,
              amp,
              source_amount,
              swap_source_amount,
              swap_destination_amount,
              diff,
              tolerance
          );
      }
  }
}