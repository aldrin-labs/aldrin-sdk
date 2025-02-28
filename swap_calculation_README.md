# Aldrin AMM V2 Swap Calculation in Rust

This repository contains a Rust implementation of the swap out amount calculation used in Aldrin AMM V2. It's based on the TypeScript implementation found in the Aldrin SDK.

## Overview

The implementation provides two main functions:

1. `calculate_swap_out_amount` - Calculates how many tokens you'll receive given the amount you're paying
2. `calculate_swap_in_amount` - Calculates how many tokens you need to pay to receive a specific amount

Both functions support two curve types:
- Constant Product (similar to Uniswap V2)
- Stable Curve (similar to Curve Finance, but simplified in this implementation)

## Understanding Error Code 0x12c

The error code `0x12c` (300 in decimal) corresponds to the `SlippageExceeded` error in the Aldrin AMM V2 program. This error occurs when a swap would result in receiving fewer tokens than the minimum amount specified by the user.

When you execute a swap, you typically specify a "minimum amount" of tokens you expect to receive. If the actual amount you would receive is less than this minimum (due to price movements or other factors), the transaction will fail with error code `0x12c` and the message "Slippage exceeded".

This is a protection mechanism to prevent users from receiving significantly fewer tokens than expected due to price movements between the time they submit their transaction and when it's executed on the blockchain.

## Swap Calculation Formula

The swap calculation is based on the constant product formula:

```
X * Y = (X - A) * (Y + B)
```

Where:
- X: Base token amount in pool
- Y: Quote token amount in pool
- A: Token amount to buy (amount to receive)
- B: Quote token amount (amount to pay)

From this formula, we can derive:

1. To calculate how many tokens you'll receive (A) given the amount you're paying (B):
   ```
   A = X - (X * Y) / (Y + B)
   ```

2. To calculate how many tokens you need to pay (B) to receive a specific amount (A):
   ```
   B = (X * Y) / (X - A) - Y
   ```

## Usage Example

```rust
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
```

## Notes on Stable Curves

The implementation for stable curves in this code is simplified. In the TypeScript code, it uses the `computeOutputAmount` function from the `@orca-so/stablecurve` package, which implements a more sophisticated algorithm based on the StableSwap invariant.

For a complete implementation of stable curves, you would need to implement the full StableSwap algorithm, which involves calculating an invariant based on the amplification coefficient.