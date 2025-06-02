use crate::{calculate_swap_amount_out, calculate_swap_amount_in, CurveType};
use num_bigint::BigUint;

#[test]
fn test_equivalent_to_typescript_examples() {
    // Test case mirroring the TypeScript calculation
    // Based on the formula from resolveSwapInputs: A = X - (X * Y) / (Y + B)
    
    let pool_base = BigUint::from(1_000_000u32);   // X = 1M base tokens
    let pool_quote = BigUint::from(2_000_000u32);  // Y = 2M quote tokens
    let outcome_amount = BigUint::from(100_000u32); // B = 100K quote tokens to send
    
    let result = calculate_swap_amount_out(
        &pool_base,
        &pool_quote,
        &outcome_amount,
        CurveType::Product
    );
    
    assert!(result.is_ok());
    let amount_out = result.unwrap();
    
    // Manual calculation: A = 1000000 - (1000000 * 2000000) / (2000000 + 100000)
    // A = 1000000 - (2000000000000) / (2100000)
    // A = 1000000 - 952380 = 47619 (approximately)
    
    println!("Amount out: {}", amount_out);
    assert!(amount_out > BigUint::from(47000u32)); // Should be around 47619
    assert!(amount_out < BigUint::from(48000u32));
}

#[test]
fn test_inverse_calculation() {
    // Test the inverse calculation: B = (X * Y) / (X - A) - Y
    
    let pool_base = BigUint::from(1_000_000u32);   // X = 1M base tokens
    let pool_quote = BigUint::from(2_000_000u32);  // Y = 2M quote tokens
    let min_income = BigUint::from(47619u32);      // A = tokens to receive
    
    let result = calculate_swap_amount_in(
        &pool_base,
        &pool_quote,
        &min_income,
        CurveType::Product
    );
    
    assert!(result.is_ok());
    let amount_in = result.unwrap();
    
    println!("Amount in: {}", amount_in);
    // Should be approximately 100000 (the original outcome_amount)
    assert!(amount_in > BigUint::from(99000u32));
    assert!(amount_in < BigUint::from(101000u32));
}

#[test]
fn test_stable_curve_equivalence() {
    // For stable curves, should be 1:1 exchange
    let pool_base = BigUint::from(1_000_000u32);
    let pool_quote = BigUint::from(1_000_000u32);
    let outcome_amount = BigUint::from(100_000u32);
    
    let result = calculate_swap_amount_out(
        &pool_base,
        &pool_quote,
        &outcome_amount,
        CurveType::Stable
    );
    
    assert!(result.is_ok());
    let amount_out = result.unwrap();
    
    // For stable curves, should get exactly the same amount
    assert_eq!(amount_out, outcome_amount);
}