# Aldrin AMM Pool Error Codes

This document explains common error codes encountered when interacting with Aldrin AMM pools.

## Error Code 0x12c (300 decimal)

**Error Message:** `Program log: Custom program error: 0x12c`

**Description:** This error typically occurs in the following scenarios:

1. **Pool State Issues:**
   - Pool is frozen or disabled
   - Pool liquidity is insufficient for the requested swap
   - Pool accounts are in an invalid state

2. **Slippage Protection:**
   - The actual swap price exceeds the maximum slippage tolerance
   - Market has moved significantly between quote and execution

3. **Account Issues:**
   - Token accounts are frozen or closed
   - Insufficient token balance in user accounts
   - Wrong token mint provided for the pool

4. **Calculation Errors:**
   - Swap amount calculation results in invalid state
   - Numerical overflow or underflow in calculations

**Troubleshooting:**

- Check pool liquidity before attempting large swaps
- Increase slippage tolerance if markets are volatile
- Verify token account balances and states
- Ensure correct token mints are being used
- Try smaller swap amounts to test pool functionality

**Related Code:**
- TypeScript implementation: `src/tokenSwap.ts` (resolveSwapInputs method)
- Rust implementation: `rust/src/lib.rs` (calculate_swap_amount_out/in functions)

## Common Resolution Steps

1. Refresh pool data to get current liquidity levels
2. Check if the pool supports the requested token pair
3. Verify user has sufficient balance for the swap
4. Ensure slippage tolerance is appropriate for current market conditions
5. Try breaking large swaps into smaller chunks