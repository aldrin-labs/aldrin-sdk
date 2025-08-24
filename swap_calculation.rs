use std::cmp;

// Curve types matching the TypeScript CURVE enum
pub enum CurveType {
    Product = 0,
    Stable = 1,
}

// Error codes
pub enum PoolError {
    SlippageExceeded = 0x12c, // 300 in decimal
    TokenLimitExceeded = 301,
    CalculationError = 302,
    ZeroResultingTokens = 303,
    // ... other errors
}

impl std::fmt::Display for PoolError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PoolError::SlippageExceeded => write!(f, "Slippage exceeded"),
            PoolError::TokenLimitExceeded => write!(f, "Token limit reached"),
            PoolError::CalculationError => write!(f, "Calculation error"),
            PoolError::ZeroResultingTokens => write!(f, "Swap size is too small"),
            // ... other errors
        }
    }
}

/// Calculate the amount of tokens to receive (A) given the amount of tokens to pay (B)
/// 
/// Formula: A = X - (X * Y) / (Y + B)
/// 
/// Where:
/// - X: Base token amount in pool
/// - Y: Quote token amount in pool
/// - B: Quote token amount (amount to pay)
/// - A: Base token amount (amount to receive)
pub fn calculate_swap_out_amount(
    x: u64,
    y: u64,
    b: u64,
    curve_type: CurveType,
) -> Result<u64, PoolError> {
    match curve_type {
        CurveType::Product => {
            // For constant product curve (X * Y = K)
            if b == 0 {
                return Err(PoolError::ZeroResultingTokens);
            }
            
            // Calculate using the formula: A = X - (X * Y) / (Y + B)
            let y_plus_b = y.checked_add(b).ok_or(PoolError::CalculationError)?;
            
            // Calculate X * Y
            let x_times_y = x.checked_mul(y).ok_or(PoolError::CalculationError)?;
            
            // Calculate (X * Y) / (Y + B)
            let div_result = x_times_y.checked_div(y_plus_b).ok_or(PoolError::CalculationError)?;
            
            // Calculate X - (X * Y) / (Y + B)
            let a = x.checked_sub(div_result).ok_or(PoolError::CalculationError)?;
            
            if a == 0 {
                return Err(PoolError::ZeroResultingTokens);
            }
            
            Ok(a)
        },
        CurveType::Stable => {
            // For stable curve, the calculation is more complex
            // In the TypeScript code, it uses the computeOutputAmount function from @orca-so/stablecurve
            // This is a simplified implementation for stable curves
            // In a real implementation, you would use a more sophisticated algorithm
            
            // For stable curves with similar assets, the swap rate is close to 1:1
            // with a small adjustment based on the imbalance
            
            // This is a placeholder - in a real implementation, you would use the actual stable curve formula
            // which typically involves calculating an invariant based on the amplification coefficient
            
            // For now, we'll just return the input amount as an approximation
            if b == 0 {
                return Err(PoolError::ZeroResultingTokens);
            }
            
            Ok(b)
        }
    }
}

/// Calculate the amount of tokens to pay (B) given the amount of tokens to receive (A)
/// 
/// Formula: B = (X * Y) / (X - A) - Y
/// 
/// Where:
/// - X: Base token amount in pool
/// - Y: Quote token amount in pool
/// - A: Base token amount (amount to receive)
/// - B: Quote token amount (amount to pay)
pub fn calculate_swap_in_amount(
    x: u64,
    y: u64,
    a: u64,
    curve_type: CurveType,
) -> Result<u64, PoolError> {
    match curve_type {
        CurveType::Product => {
            // For constant product curve (X * Y = K)
            if a == 0 {
                return Err(PoolError::ZeroResultingTokens);
            }
            
            if a >= x {
                return Err(PoolError::TokenLimitExceeded);
            }
            
            // Calculate using the formula: B = (X * Y) / (X - A) - Y
            let x_minus_a = x.checked_sub(a).ok_or(PoolError::CalculationError)?;
            
            // Calculate X * Y
            let x_times_y = x.checked_mul(y).ok_or(PoolError::CalculationError)?;
            
            // Calculate (X * Y) / (X - A)
            let div_result = x_times_y.checked_div(x_minus_a).ok_or(PoolError::CalculationError)?;
            
            // Calculate (X * Y) / (X - A) - Y
            let b = div_result.checked_sub(y).ok_or(PoolError::CalculationError)?;
            
            if b == 0 {
                return Err(PoolError::ZeroResultingTokens);
            }
            
            Ok(b)
        },
        CurveType::Stable => {
            // For stable curve, similar to above, this is a placeholder
            // In a real implementation, you would use the actual stable curve formula
            
            if a == 0 {
                return Err(PoolError::ZeroResultingTokens);
            }
            
            if a >= x {
                return Err(PoolError::TokenLimitExceeded);
            }
            
            // Simplified approximation for stable curves
            Ok(a)
        }
    }
}

/// Check if a swap would exceed the allowed slippage
/// 
/// Returns an error if the actual output amount is less than the minimum expected amount
pub fn check_slippage(
    actual_amount: u64,
    minimum_amount: u64,
) -> Result<(), PoolError> {
    if actual_amount < minimum_amount {
        Err(PoolError::SlippageExceeded)
    } else {
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_constant_product_swap_out() {
        // Example pool with 1000 X tokens and 5000 Y tokens
        let x = 1000;
        let y = 5000;
        
        // Swap 100 Y tokens for X tokens
        let b = 100;
        
        // Calculate how many X tokens will be received
        let a = calculate_swap_out_amount(x, y, b, CurveType::Product).unwrap();
        
        // Verify the constant product formula: X * Y = (X - A) * (Y + B)
        let k_before = x * y;
        let k_after = (x - a) * (y + b);
        
        // Due to integer division, there might be a small difference
        assert!(k_before >= k_after);
        assert!(k_before - k_after < x); // The difference should be small
        
        // For this example, the result should be approximately 19 X tokens
        assert!(a >= 19 && a <= 20);
    }

    #[test]
    fn test_constant_product_swap_in() {
        // Example pool with 1000 X tokens and 5000 Y tokens
        let x = 1000;
        let y = 5000;
        
        // Want to receive 20 X tokens
        let a = 20;
        
        // Calculate how many Y tokens need to be paid
        let b = calculate_swap_in_amount(x, y, a, CurveType::Product).unwrap();
        
        // Verify the constant product formula: X * Y = (X - A) * (Y + B)
        let k_before = x * y;
        let k_after = (x - a) * (y + b);
        
        // Due to integer division, there might be a small difference
        assert!(k_before <= k_after);
        assert!(k_after - k_before < y); // The difference should be small
        
        // For this example, the result should be approximately 104 Y tokens
        assert!(b >= 102 && b <= 105);
    }

    #[test]
    fn test_slippage_check() {
        // Actual amount received
        let actual = 19;
        
        // Minimum amount expected (with 5% slippage on 20 tokens)
        let minimum = 19;
        
        // This should pass
        assert!(check_slippage(actual, minimum).is_ok());
        
        // But if the minimum is higher
        let higher_minimum = 20;
        
        // This should fail with SlippageExceeded
        assert!(matches!(check_slippage(actual, higher_minimum), Err(PoolError::SlippageExceeded)));
    }
}

// Example usage
fn main() {
    // Example pool with 1000 X tokens and 5000 Y tokens
    let x = 1000;
    let y = 5000;
    
    // Swap 100 Y tokens for X tokens
    let b = 100;
    
    match calculate_swap_out_amount(x, y, b, CurveType::Product) {
        Ok(a) => {
            println!("Swapping {} Y tokens for {} X tokens", b, a);
            
            // Check if this meets our minimum expected amount (with slippage)
            let min_expected = 19; // For example, expecting at least 19 tokens
            
            match check_slippage(a, min_expected) {
                Ok(_) => println!("Swap successful, slippage within limits"),
                Err(e) => println!("Swap failed: {}", e),
            }
        },
        Err(e) => println!("Calculation error: {}", e),
    }
}