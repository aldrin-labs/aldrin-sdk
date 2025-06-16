# Aldrin Swap Calculator (Rust)

This Rust library provides swap amount calculations for Aldrin AMM V2 pools, equivalent to the TypeScript implementation in `src/tokenSwap.ts`.

## Features

- **Constant Product AMM**: Implements the standard x*y=k formula for token swaps
- **Stable Curve AMM**: Supports 1:1 exchange rates for stable token pairs  
- **High Precision**: Uses arbitrary precision arithmetic via `num-bigint`
- **Error Handling**: Comprehensive error types for different failure scenarios

## Usage

Add to your `Cargo.toml`:

```toml
[dependencies]
aldrin-swap-calc = { path = "rust" }
```

### Calculate Swap Output Amount

```rust
use aldrin_swap_calc::{calculate_swap_amount_out, CurveType};
use num_bigint::BigUint;

// Pool has 1M base tokens and 2M quote tokens
let pool_base_amount = BigUint::from(1_000_000u32);
let pool_quote_amount = BigUint::from(2_000_000u32);

// Want to swap 100K quote tokens
let amount_to_send = BigUint::from(100_000u32);

// Calculate how many base tokens we'll receive
let amount_out = calculate_swap_amount_out(
    &pool_base_amount,
    &pool_quote_amount, 
    &amount_to_send,
    CurveType::Product
)?;

println!("Will receive {} base tokens", amount_out);
```

### Calculate Swap Input Amount

```rust
use aldrin_swap_calc::{calculate_swap_amount_in, CurveType};
use num_bigint::BigUint;

// Pool has 1M base tokens and 2M quote tokens  
let pool_base_amount = BigUint::from(1_000_000u32);
let pool_quote_amount = BigUint::from(2_000_000u32);

// Want to receive 50K base tokens
let amount_to_receive = BigUint::from(50_000u32);

// Calculate how many quote tokens we need to send
let amount_in = calculate_swap_amount_in(
    &pool_base_amount,
    &pool_quote_amount,
    &amount_to_receive, 
    CurveType::Product
)?;

println!("Need to send {} quote tokens", amount_in);
```

## Mathematical Formulas

### Constant Product Formula

For swaps using the constant product curve (most common):

**Given amount to send (B), calculate amount to receive (A):**
```
X * Y = (X - A) * (Y + B)
A = X - (X * Y) / (Y + B)
```

**Given amount to receive (A), calculate amount to send (B):**
```
X * Y = (X - A) * (Y + B)  
B = (X * Y) / (X - A) - Y
```

Where:
- X = Base token amount in pool
- Y = Quote token amount in pool
- A = Base token amount to receive
- B = Quote token amount to send

### Stable Curve Formula

For stable token pairs (like USDC/USDT):
```
A = B (1:1 exchange rate)
```

## Error Handling

The library provides comprehensive error handling:

```rust
use aldrin_swap_calc::{SwapError, SwapResult};

match calculate_swap_amount_out(&x, &y, &b, CurveType::Product) {
    Ok(amount) => println!("Success: {}", amount),
    Err(SwapError::InsufficientLiquidity) => println!("Not enough liquidity"),
    Err(SwapError::MathError) => println!("Calculation overflow/underflow"),
    Err(SwapError::ProgramError0x12c) => println!("Pool program error"),
    Err(SwapError::InvalidAmount) => println!("Invalid input amount"),
}
```

## Relationship to TypeScript Implementation

This Rust implementation mirrors the logic in `src/tokenSwap.ts`:

- TypeScript `resolveSwapInputs()` → Rust `calculate_swap_amount_out/in()`
- TypeScript `CURVE.PRODUCT` → Rust `CurveType::Product` 
- TypeScript `CURVE.STABLE` → Rust `CurveType::Stable`
- Uses same mathematical formulas and edge case handling

## Testing

Run the test suite:

```bash
cd rust
cargo test
```

Tests cover:
- Basic swap calculations for both curve types
- Edge cases (zero amounts, insufficient liquidity)
- Error conditions and boundary values
- Mathematical precision and overflow protection