use num_bigint::BigUint;
use num_traits::Zero;

/// Curve types for AMM calculations
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum CurveType {
    /// Constant product formula: X * Y = (X - A) * (Y + B)
    Product = 0,
    /// Stable curve: 1:1 exchange rate
    Stable = 1,
}

/// Error types for swap calculations
#[derive(Debug, PartialEq)]
pub enum SwapError {
    /// Custom program error 0x12c (300 decimal)
    /// This error typically occurs when:
    /// - Pool is in an invalid state
    /// - Insufficient liquidity for the requested swap
    /// - Slippage tolerance exceeded
    /// - Token accounts are invalid or frozen
    ProgramError0x12c,
    /// Insufficient liquidity in the pool
    InsufficientLiquidity,
    /// Invalid input amounts
    InvalidAmount,
    /// Division by zero or overflow
    MathError,
}

/// Result type for swap calculations
pub type SwapResult<T> = Result<T, SwapError>;

/// Calculate the amount to receive (A) given the amount to send (B)
/// 
/// Based on the constant product formula: X * Y = (X - A) * (Y + B)
/// Solving for A: A = X - (X * Y) / (Y + B)
/// 
/// # Arguments
/// * `pool_base_amount` - X: Base token amount in pool
/// * `pool_quote_amount` - Y: Quote token amount in pool  
/// * `outcome_amount` - B: Quote token amount to send
/// * `curve_type` - Type of curve to use for calculation
/// 
/// # Returns
/// * `SwapResult<BigUint>` - Amount to receive (A) or error
pub fn calculate_swap_amount_out(
    pool_base_amount: &BigUint,
    pool_quote_amount: &BigUint,
    outcome_amount: &BigUint,
    curve_type: CurveType,
) -> SwapResult<BigUint> {
    if pool_base_amount.is_zero() || pool_quote_amount.is_zero() {
        return Err(SwapError::InsufficientLiquidity);
    }
    
    if outcome_amount.is_zero() {
        return Ok(BigUint::zero());
    }

    match curve_type {
        CurveType::Stable => {
            // For stable curves, use 1:1 exchange rate
            Ok(outcome_amount.clone())
        }
        CurveType::Product => {
            // Calculate: A = X - (X * Y) / (Y + B)
            let y_plus_b = pool_quote_amount + outcome_amount;
            
            if y_plus_b.is_zero() {
                return Err(SwapError::MathError);
            }
            
            let xy = pool_base_amount * pool_quote_amount;
            let xy_div_y_plus_b = &xy / &y_plus_b;
            
            if xy_div_y_plus_b > *pool_base_amount {
                return Err(SwapError::InsufficientLiquidity);
            }
            
            Ok(pool_base_amount - xy_div_y_plus_b)
        }
    }
}

/// Calculate the amount to send (B) given the amount to receive (A)
/// 
/// Based on the constant product formula: X * Y = (X - A) * (Y + B)
/// Solving for B: B = (X * Y) / (X - A) - Y
/// 
/// # Arguments
/// * `pool_base_amount` - X: Base token amount in pool
/// * `pool_quote_amount` - Y: Quote token amount in pool
/// * `min_income_amount` - A: Base token amount to receive
/// * `curve_type` - Type of curve to use for calculation
/// 
/// # Returns
/// * `SwapResult<BigUint>` - Amount to send (B) or error
pub fn calculate_swap_amount_in(
    pool_base_amount: &BigUint,
    pool_quote_amount: &BigUint,
    min_income_amount: &BigUint,
    curve_type: CurveType,
) -> SwapResult<BigUint> {
    if pool_base_amount.is_zero() || pool_quote_amount.is_zero() {
        return Err(SwapError::InsufficientLiquidity);
    }
    
    if min_income_amount.is_zero() {
        return Ok(BigUint::zero());
    }

    match curve_type {
        CurveType::Stable => {
            // For stable curves, use 1:1 exchange rate
            Ok(min_income_amount.clone())
        }
        CurveType::Product => {
            // Calculate: B = (X * Y) / (X - A) - Y
            if min_income_amount >= pool_base_amount {
                return Err(SwapError::InsufficientLiquidity);
            }
            
            let x_minus_a = pool_base_amount - min_income_amount;
            
            if x_minus_a.is_zero() {
                return Err(SwapError::MathError);
            }
            
            let xy = pool_base_amount * pool_quote_amount;
            let xy_div_x_minus_a = &xy / &x_minus_a;
            
            if xy_div_x_minus_a < *pool_quote_amount {
                return Err(SwapError::MathError);
            }
            
            Ok(xy_div_x_minus_a - pool_quote_amount)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_product_curve_amount_out() {
        let pool_base = BigUint::from(1000000u32);
        let pool_quote = BigUint::from(2000000u32);
        let outcome = BigUint::from(100000u32);
        
        let result = calculate_swap_amount_out(&pool_base, &pool_quote, &outcome, CurveType::Product);
        assert!(result.is_ok());
        
        // Should get less than 1:1 due to constant product formula
        let amount_out = result.unwrap();
        assert!(amount_out < outcome);
        assert!(amount_out > BigUint::zero());
    }

    #[test]
    fn test_stable_curve_amount_out() {
        let pool_base = BigUint::from(1000000u32);
        let pool_quote = BigUint::from(1000000u32);
        let outcome = BigUint::from(100000u32);
        
        let result = calculate_swap_amount_out(&pool_base, &pool_quote, &outcome, CurveType::Stable);
        assert!(result.is_ok());
        
        // Should get 1:1 for stable curve
        let amount_out = result.unwrap();
        assert_eq!(amount_out, outcome);
    }

    #[test]
    fn test_product_curve_amount_in() {
        let pool_base = BigUint::from(1000000u32);
        let pool_quote = BigUint::from(2000000u32);
        let min_income = BigUint::from(50000u32);
        
        let result = calculate_swap_amount_in(&pool_base, &pool_quote, &min_income, CurveType::Product);
        assert!(result.is_ok());
        
        let amount_in = result.unwrap();
        assert!(amount_in > BigUint::zero());
    }

    #[test]
    fn test_insufficient_liquidity() {
        let pool_base = BigUint::from(1000000u32);
        let pool_quote = BigUint::from(2000000u32);
        let min_income = BigUint::from(1000000u32); // Requesting all base tokens
        
        let result = calculate_swap_amount_in(&pool_base, &pool_quote, &min_income, CurveType::Product);
        assert_eq!(result, Err(SwapError::InsufficientLiquidity));
    }

    #[test]
    fn test_zero_amounts() {
        let pool_base = BigUint::from(1000000u32);
        let pool_quote = BigUint::from(2000000u32);
        let zero = BigUint::zero();
        
        let result = calculate_swap_amount_out(&pool_base, &pool_quote, &zero, CurveType::Product);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), BigUint::zero());
    }

    #[test]
    fn test_zero_pool_amounts() {
        let zero = BigUint::zero();
        let outcome = BigUint::from(100000u32);
        
        let result = calculate_swap_amount_out(&zero, &zero, &outcome, CurveType::Product);
        assert_eq!(result, Err(SwapError::InsufficientLiquidity));
    }
}

#[cfg(test)]
mod integration_tests;