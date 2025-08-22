# Aldrin DEX SDK

[![GitHub license](https://img.shields.io/badge/license-APACHE-blue.svg)](https://github.com/aldrin-exchange/aldrin-sdk/blob/main/LICENSE)

<p align="center">
  <img src="https://aldrin.com/logo.png" alt="Aldrin logo">
</p>

<p align="center">
  [<a href="https://dex.aldrin.com">Website</a> |  <a href="https://github.com/aldrin-exchange/aldrin-sdk/tree/main/docs">API Reference</a> | <a href="https://github.com/aldrin-exchange/aldrin-sdk/tree/main/examples">Examples</a> ]
</p>

The Aldrin SDK is a comprehensive TypeScript/JavaScript library for interacting with the Aldrin decentralized exchange on Solana. It provides a high-level interface for token swapping, liquidity provision, farming, staking, and Dollar-Cost Averaging (DTWAP) functionality.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
  - [Custom RPC Configuration](#custom-rpc-configuration)
  - [Environment Variables](#environment-variables)
- [Core Features](#core-features)
  - [Token Swapping](#token-swapping)
  - [Liquidity Management](#liquidity-management)
  - [Farming](#farming)
  - [Staking](#staking)
  - [Dollar-Cost Averaging (DTWAP)](#dollar-cost-averaging-dtwap)
- [Advanced Usage](#advanced-usage)
  - [Error Handling](#error-handling)
  - [Transaction Options](#transaction-options)
  - [Price Calculations](#price-calculations)
- [API Reference](#api-reference)
- [Rust Integration](#rust-integration)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

## Installation

Install the Aldrin SDK using npm or yarn:

```bash
npm install @aldrin_exchange/sdk
# or
yarn add @aldrin_exchange/sdk
```

### Peer Dependencies

The SDK requires the following peer dependencies:

```bash
npm install @solana/web3.js bn.js
# or
yarn add @solana/web3.js bn.js
```

## Quick Start

Here's a simple example to get you started with token swapping:

```js
import { Connection, PublicKey } from '@solana/web3.js';
import { TokenSwap } from '@aldrin_exchange/sdk';
import BN from 'bn.js';

// Initialize the SDK
const tokenSwap = await TokenSwap.initialize();

// Define tokens (RIN and USDC)
const rinMint = new PublicKey('E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp');
const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// Get current price
const price = await tokenSwap.getPrice({ 
  mintFrom: usdcMint, 
  mintTo: rinMint 
});

console.log(`Current price: ${price} RIN per USDC`);

// Perform a swap (requires a wallet)
const txId = await tokenSwap.swap({
  wallet: yourWallet,
  mintFrom: usdcMint,
  mintTo: rinMint,
  minIncomeAmount: new BN(1_000_000_000), // 1 RIN minimum
});

console.log(`Swap completed: ${txId}`);
```

## Configuration

### Custom RPC Configuration

The SDK uses `https://api.mainnet-beta.solana.com` as the default RPC endpoint. You can customize this in several ways to use different providers like Helius, QuickNode, or your own RPC infrastructure.

#### Method 1: Environment Variable
Set the RPC endpoint globally for your application:

```bash
export SOLANA_RPC_ENDPOINT="https://your-custom-rpc-endpoint.com"
```

#### Method 2: Custom Connection Parameter
Pass a custom connection during initialization:

```js
import { Connection } from '@solana/web3.js';
import { TokenSwap } from '@aldrin_exchange/sdk';

const customConnection = new Connection('https://your-custom-rpc-endpoint.com');
const tokenSwap = await TokenSwap.initialize({ 
  connection: customConnection 
});
```

#### Method 3: Event-Driven Dynamic RPC Switching
For applications requiring runtime RPC endpoint switching (load balancing, failover, user preferences):

```js
import { EventEmitter } from 'events';
import { TokenSwap } from '@aldrin_exchange/sdk';

// Create an EventEmitter for RPC URL changes
const rpcEventEmitter = new EventEmitter();

// Initialize TokenSwap with event emitter
const tokenSwap = await TokenSwap.initialize({
  rpcEventEmitter: rpcEventEmitter
});

// Listen for successful/failed RPC changes
rpcEventEmitter.on('rpcUrlChangeSuccess', (newUrl) => {
  console.log(`Successfully switched to: ${newUrl}`);
});

rpcEventEmitter.on('rpcUrlChangeError', (error, attemptedUrl) => {
  console.error(`Failed to switch to ${attemptedUrl}:`, error);
});

// Switch RPC endpoints dynamically
rpcEventEmitter.emit('rpcUrlChange', 'https://your-helius-endpoint.com');
```

When an RPC URL change event is received, the SDK automatically:
- Creates a new Connection with the new RPC URL
- Recreates all internal clients (PoolClient, TokenClient, FarmingClient)
- Refreshes pool data from the new endpoint
- Emits success/error events for monitoring

### Environment Variables

The SDK supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SOLANA_RPC_ENDPOINT` | Custom RPC endpoint URL | `https://api.mainnet-beta.solana.com` |

## Core Features

### Token Swapping

The TokenSwap class provides the main interface for token exchanges on Aldrin DEX.

#### Basic Swap Example

```js
import { Wallet } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { TokenSwap } from '@aldrin_exchange/sdk';

const wallet = Wallet.local(); // Or any other Solana wallet

async function performSwap() {
  const tokenSwap = await TokenSwap.initialize();

  // Token addresses
  const rinMint = new PublicKey('E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp');
  const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  // Get current market prices
  const rinToUsdcPrice = await tokenSwap.getPrice({ 
    mintFrom: rinMint, 
    mintTo: usdcMint 
  });
  const usdcToRinPrice = await tokenSwap.getPrice({ 
    mintFrom: usdcMint, 
    mintTo: rinMint 
  });

  console.log(`RIN/USDC price: ${rinToUsdcPrice}`);
  console.log(`USDC/RIN price: ${usdcToRinPrice}`);

  // Perform swap with minimum output amount
  const transactionId = await tokenSwap.swap({
    wallet: wallet,
    mintFrom: usdcMint,
    mintTo: rinMint,
    minIncomeAmount: new BN(1_000_000_000), // 1 RIN minimum
    // Alternative: specify exact outcome amount
    // outcomeAmount: new BN(5_000_000) // 5 USDC exact
  });

  console.log(`Swap completed: ${transactionId}`);
}
```

#### Swap with Referral

Earn referral fees by including a referral account:

```js
import { PublicKey } from '@solana/web3.js';

await tokenSwap.swap({
  wallet: wallet,
  mintFrom: usdcMint,
  mintTo: rinMint,
  minIncomeAmount: new BN(1_000_000_000),
  referralAccount: new PublicKey('YourReferralAccountPublicKey'),
  referralPercent: 0.5, // 0.5% referral fee
});
```

#### Advanced Swap Parameters

```js
await tokenSwap.swap({
  wallet: wallet,
  mintFrom: usdcMint,
  mintTo: rinMint,
  minIncomeAmount: new BN(1_000_000_000),
  createTokenAccounts: true, // Auto-create token accounts if needed
  skipConfirmation: false, // Wait for transaction confirmation
  maxSlippage: 1.0, // Maximum slippage tolerance (1%)
});
```

### Liquidity Management

Add and remove liquidity from trading pools to earn fees and participate in yield farming.

#### Adding Liquidity
```

```js
import BN from 'bn.js';
import { Wallet } from '@project-serum/anchor';
import { AUTHORIZED_POOLS, TokenSwap } from '@aldrin_exchange/sdk';

const wallet = Wallet.local(); // Or any other Solana wallet

async function addLiquidity() {
  const tokenSwap = await TokenSwap.initialize();

  const transactionId = await tokenSwap.depositLiquidity({
    wallet: wallet,
    poolMint: AUTHORIZED_POOLS.RIN_USDC.poolMint,
    // Specify at least one of maxBase/maxQuote
    maxBase: new BN(1_000_000_000), // 1 RIN maximum
    maxQuote: new BN(5_000_000), // 5 USDC maximum
  });

  console.log('Liquidity added:', transactionId);
}
```

#### Removing Liquidity

```js
async function removeLiquidity() {
  const tokenSwap = await TokenSwap.initialize();

  const transactionId = await tokenSwap.withdrawLiquidity({
    wallet: wallet,
    poolMint: AUTHORIZED_POOLS.RIN_USDC.poolMint,
    poolTokenAmount: new BN(100_000), // LP tokens to burn
    // Specify minimum amounts to receive
    minBase: new BN(1_000_000), // Minimum base tokens
    minQuote: new BN(5_000_000), // Minimum quote tokens
  });

  console.log('Liquidity removed:', transactionId);
}
```

#### Getting Pool Information

```js
import { PoolClient } from '@aldrin_exchange/sdk';

async function getPoolInfo() {
  const poolClient = new PoolClient();
  
  // Get all available pools
  const pools = await poolClient.loadPools();
  
  // Get specific pool information
  const pool = await poolClient.loadPool(AUTHORIZED_POOLS.RIN_USDC.poolMint);
  
  console.log('Pool reserves:', {
    baseAmount: pool.baseAmount.toString(),
    quoteAmount: pool.quoteAmount.toString(),
    totalSupply: pool.poolTokenSupply.toString()
  });
}
```

### Farming

Earn additional rewards by staking your LP tokens in farming pools.

#### Starting a Farm

```js
import { FarmingClient, AUTHORIZED_POOLS } from '@aldrin_exchange/sdk';
import BN from 'bn.js';

async function startFarming() {
  const farmingClient = new FarmingClient();
  
  const transactionId = await farmingClient.startFarming({
    wallet: wallet,
    poolMint: AUTHORIZED_POOLS.SOL_USDC.poolMint,
    lpTokenAmount: new BN(100_000), // Amount of LP tokens to stake
  });

  console.log('Farming started:', transactionId);
}
```

#### Checking Farm Rewards

```js
import { TokenSwap, AUTHORIZED_POOLS } from '@aldrin_exchange/sdk';

async function checkFarmRewards() {
  const tokenSwap = await TokenSwap.initialize();

  const farmed = await tokenSwap.getFarmed({
    wallet: wallet,
    poolMint: AUTHORIZED_POOLS.SOL_USDC.poolMint,
  });

  farmed.forEach((reward) => {
    console.log(`Reward token: ${reward.tokenInfo.mint.toBase58()}`);
    console.log(`Amount: ${reward.calcAccount.tokenAmount.toString()}`);
  });
}
```

#### Claiming Farm Rewards

```js
async function claimFarmRewards() {
  const farmingClient = new FarmingClient();
  
  const transactionId = await farmingClient.claimFarmed({
    wallet: wallet,
    poolMint: AUTHORIZED_POOLS.SOL_USDC.poolMint,
  });

  console.log('Rewards claimed:', transactionId);
}
```

#### Stopping Farming

```js
async function stopFarming() {
  const farmingClient = new FarmingClient();
  
  const transactionId = await farmingClient.stopFarming({
    wallet: wallet,
    poolMint: AUTHORIZED_POOLS.SOL_USDC.poolMint,
  });

  console.log('Farming stopped:', transactionId);
}
```

### Staking

Stake RIN tokens to earn rewards and participate in governance.

#### Starting Staking

```js
import BN from 'bn.js';
import { StakingClient } from '@aldrin_exchange/sdk';

async function startStaking() {
  const stakingClient = new StakingClient();
  const tokenAmount = new BN(1_100_000); // Amount of RIN to stake

  const transactionId = await stakingClient.startStaking({
    wallet: wallet,
    tokenAmount: tokenAmount,
  });

  console.log('Staking started:', transactionId);
}
```

#### Ending Staking

```js
async function endStaking() {
  const stakingClient = new StakingClient();

  const transactionId = await stakingClient.endStaking({
    wallet: wallet,
  });

  console.log('Staking ended:', transactionId);
}
```

#### Claiming Staking Rewards

```js
async function claimStakingRewards() {
  const stakingClient = new StakingClient();

  const transactionId = await stakingClient.claim({
    wallet: wallet,
  });

  console.log('Staking rewards claimed:', transactionId);
}
```

#### Getting Staking Information

```js
async function getStakingInfo() {
  const stakingClient = new StakingClient();
  
  const stakingAccount = await stakingClient.getStakingAccount(wallet.publicKey);
  
  console.log('Staking info:', {
    stakedAmount: stakingAccount.stakedAmount.toString(),
    rewards: stakingAccount.rewards.toString(),
    startTime: stakingAccount.startTime,
  });
}
```

### Dollar-Cost Averaging (DTWAP)

Execute Dollar-Cost Averaging strategies with automated, time-based token purchases.

#### Creating a DTWAP Order

```js
import { DtwapClient } from '@aldrin_exchange/sdk';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

async function createDtwapOrder() {
  const dtwapClient = new DtwapClient();

  const order = await dtwapClient.createOrder({
    wallet: wallet,
    baseMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
    quoteMint: new PublicKey('E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp'), // RIN
    totalAmount: new BN(1000_000_000), // 1000 USDC total
    intervalAmount: new BN(10_000_000), // 10 USDC per interval
    intervalSeconds: 3600, // 1 hour intervals
    maxSlippage: 1.0, // 1% max slippage
  });

  console.log('DTWAP order created:', order);
}
```

#### Executing DTWAP Orders

```js
async function executeDtwapOrder() {
  const dtwapClient = new DtwapClient();
  
  // Execute next interval for a specific order
  const transactionId = await dtwapClient.executeOrder({
    wallet: wallet,
    orderAccount: orderPublicKey,
  });

  console.log('DTWAP order executed:', transactionId);
}
```

#### Managing DTWAP Orders

```js
async function manageDtwapOrders() {
  const dtwapClient = new DtwapClient();
  
  // Get all orders for a wallet
  const orders = await dtwapClient.getOrders(wallet.publicKey);
  
  orders.forEach(order => {
    console.log('Order ID:', order.publicKey.toBase58());
    console.log('Remaining amount:', order.remainingAmount.toString());
    console.log('Next execution:', new Date(order.nextExecution * 1000));
  });
  
  // Cancel an order
  const cancelTxId = await dtwapClient.cancelOrder({
    wallet: wallet,
    orderAccount: orderPublicKey,
  });
  
  console.log('Order cancelled:', cancelTxId);
}
```

## Advanced Usage

### Error Handling

The SDK provides detailed error information for better debugging:

```js
import { TokenSwap, AldrinError } from '@aldrin_exchange/sdk';

try {
  const txId = await tokenSwap.swap({
    wallet: wallet,
    mintFrom: usdcMint,
    mintTo: rinMint,
    minIncomeAmount: new BN(1_000_000_000),
  });
} catch (error) {
  if (error instanceof AldrinError) {
    console.error('Aldrin SDK Error:', error.code, error.message);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Transaction Options

Customize transaction behavior with additional options:

```js
const txId = await tokenSwap.swap({
  wallet: wallet,
  mintFrom: usdcMint,
  mintTo: rinMint,
  minIncomeAmount: new BN(1_000_000_000),
  // Transaction options
  skipPreflight: false, // Skip preflight simulation
  maxRetries: 3, // Maximum retry attempts
  preflightCommitment: 'confirmed', // Commitment level for preflight
  commitment: 'confirmed', // Commitment level for confirmation
});
```

### Price Calculations

Get detailed price information and impact analysis:

```js
async function analyzePriceImpact() {
  const tokenSwap = await TokenSwap.initialize();
  
  // Get price with impact analysis
  const priceInfo = await tokenSwap.getPriceWithImpact({
    mintFrom: usdcMint,
    mintTo: rinMint,
    amount: new BN(100_000_000), // 100 USDC
  });
  
  console.log('Price info:', {
    price: priceInfo.price,
    priceImpact: priceInfo.priceImpact, // Percentage
    minimumReceived: priceInfo.minimumReceived.toString(),
    fees: priceInfo.fees.toString(),
  });
}
```

### Batch Operations

Perform multiple operations in a single transaction:

```js
async function batchOperations() {
  const tokenSwap = await TokenSwap.initialize();
  
  const instructions = [];
  
  // Add swap instruction
  const swapIx = await tokenSwap.getSwapInstruction({
    wallet: wallet,
    mintFrom: usdcMint,
    mintTo: rinMint,
    minIncomeAmount: new BN(1_000_000_000),
  });
  instructions.push(swapIx);
  
  // Add liquidity instruction
  const liquidityIx = await tokenSwap.getDepositLiquidityInstruction({
    wallet: wallet,
    poolMint: AUTHORIZED_POOLS.RIN_USDC.poolMint,
    maxQuote: new BN(5_000_000),
  });
  instructions.push(liquidityIx);
  
  // Execute all instructions in one transaction
  const txId = await tokenSwap.sendInstructions(instructions, wallet);
  console.log('Batch transaction:', txId);
}
```

## API Reference

### TokenSwap Class

The main class for interacting with Aldrin DEX.

#### Methods

##### `initialize(params?: TokenSwapLoadParams): Promise<TokenSwap>`

Initialize a new TokenSwap instance.

**Parameters:**
- `connection?: Connection` - Custom Solana connection
- `rpcEventEmitter?: EventEmitter` - Event emitter for dynamic RPC switching

##### `swap(params: SwapParams): Promise<string>`

Execute a token swap.

**Parameters:**
- `wallet: Wallet` - Wallet to sign the transaction
- `mintFrom: PublicKey` - Source token mint
- `mintTo: PublicKey` - Destination token mint
- `minIncomeAmount?: BN` - Minimum tokens to receive
- `outcomeAmount?: BN` - Exact tokens to spend
- `referralAccount?: PublicKey` - Referral account for fee sharing
- `referralPercent?: number` - Referral fee percentage
- `createTokenAccounts?: boolean` - Create token accounts if needed

##### `getPrice(params: GetPriceParams): Promise<number>`

Get the current exchange rate between two tokens.

**Parameters:**
- `mintFrom: PublicKey` - Source token mint
- `mintTo: PublicKey` - Destination token mint

##### `depositLiquidity(params: DepositLiquidityParams): Promise<string>`

Add liquidity to a trading pool.

**Parameters:**
- `wallet: Wallet` - Wallet to sign the transaction
- `poolMint: PublicKey` - Pool token mint
- `maxBase?: BN` - Maximum base tokens to deposit
- `maxQuote?: BN` - Maximum quote tokens to deposit

##### `withdrawLiquidity(params: WithdrawLiquidityParams): Promise<string>`

Remove liquidity from a trading pool.

**Parameters:**
- `wallet: Wallet` - Wallet to sign the transaction
- `poolMint: PublicKey` - Pool token mint
- `poolTokenAmount: BN` - LP tokens to burn
- `minBase?: BN` - Minimum base tokens to receive
- `minQuote?: BN` - Minimum quote tokens to receive

### PoolClient Class

Interface for pool-related operations.

#### Methods

##### `loadPools(): Promise<Pool[]>`

Load all available trading pools.

##### `loadPool(poolMint: PublicKey): Promise<Pool>`

Load a specific pool by its mint address.

### FarmingClient Class

Interface for farming operations.

#### Methods

##### `startFarming(params: StartFarmingParams): Promise<string>`

Start farming with LP tokens.

##### `stopFarming(params: StopFarmingParams): Promise<string>`

Stop farming and withdraw LP tokens.

##### `claimFarmed(params: ClaimFarmedParams): Promise<string>`

Claim farming rewards.

### StakingClient Class

Interface for staking operations.

#### Methods

##### `startStaking(params: StartStakingParams): Promise<string>`

Start staking RIN tokens.

##### `endStaking(params: EndStakingParams): Promise<string>`

End staking and withdraw tokens.

##### `claim(params: ClaimParams): Promise<string>`

Claim staking rewards.

### DtwapClient Class

Interface for Dollar-Cost Averaging operations.

#### Methods

##### `createOrder(params: CreateOrderParams): Promise<Order>`

Create a new DTWAP order.

##### `executeOrder(params: ExecuteOrderParams): Promise<string>`

Execute the next interval of a DTWAP order.

##### `cancelOrder(params: CancelOrderParams): Promise<string>`

Cancel a DTWAP order.

##### `getOrders(wallet: PublicKey): Promise<Order[]>`

Get all DTWAP orders for a wallet.

## Rust Integration

For high-performance applications or integration with Rust programs, swap amount calculations are available in Rust:

```rust
use aldrin_swap_calc::{calculate_swap_amount_out, CurveType, SwapError};
use num_bigint::BigUint;

match calculate_swap_amount_out(
    &BigUint::from(1_000_000u32), // pool base amount
    &BigUint::from(2_000_000u32), // pool quote amount
    &BigUint::from(100_000u32),   // amount to swap
    CurveType::Product
) {
    Ok(amount_out) => println!("Will receive {} tokens", amount_out),
    Err(SwapError::InsufficientLiquidity) => println!("Not enough liquidity"),
    Err(SwapError::InvalidAmount) => println!("Invalid input amount"),
    Err(e) => println!("Error: {:?}", e),
}
```

See [Rust documentation](rust/README.md) for more details.

## Examples

The SDK includes comprehensive examples in the `examples/` directory:

- **Token Swapping**: `examples/tokenSwap/` - Basic and advanced swapping examples
- **Liquidity Management**: `examples/poolClient/` - Adding and removing liquidity
- **Farming**: `examples/farmingClient/` - Staking LP tokens and claiming rewards
- **Staking**: `examples/stakingClient/` - RIN token staking operations
- **DTWAP**: `examples/dtwap/` - Dollar-Cost Averaging examples
- **API Usage**: `examples/api/` - AMM pools and API interactions
- **Custom RPC**: `examples/customRpcExample.ts` - RPC configuration examples

### Running Examples

```bash
# Clone the repository
git clone https://github.com/aldrin-exchange/aldrin-sdk.git
cd aldrin-sdk

# Install dependencies
npm install

# Set up your wallet and RPC endpoint
export SOLANA_RPC_ENDPOINT="https://your-rpc-endpoint.com"

# Run a specific example
npx ts-node examples/tokenSwap/swap.ts
```

## Troubleshooting

### Common Issues

#### Insufficient Balance
```
Error: Insufficient balance for transaction
```
**Solution**: Ensure your wallet has enough tokens and SOL for transaction fees.

#### Slippage Tolerance
```
Error: Price impact too high
```
**Solution**: Increase slippage tolerance or reduce trade size.

#### RPC Connection Issues
```
Error: Failed to connect to RPC endpoint
```
**Solution**: 
- Check your RPC endpoint URL
- Verify network connectivity
- Try a different RPC provider
- Use the event-driven RPC switching feature for automatic failover

#### Token Account Not Found
```
Error: Token account not found
```
**Solution**: Set `createTokenAccounts: true` in your swap parameters.

### Performance Optimization

#### RPC Endpoint Selection
- Use premium RPC providers (Helius, QuickNode, etc.) for better performance
- Implement RPC load balancing using the event-driven switching feature
- Monitor RPC response times and switch automatically

#### Transaction Optimization
- Use appropriate commitment levels (`confirmed` vs `finalized`)
- Batch multiple operations when possible
- Set reasonable retry limits

#### Memory Management
- Reuse TokenSwap instances when possible
- Clear unused connections and clients
- Monitor memory usage in long-running applications

### Debugging

Enable debug logging:

```js
import { TokenSwap } from '@aldrin_exchange/sdk';

// Enable debug mode
process.env.DEBUG = 'aldrin:*';

const tokenSwap = await TokenSwap.initialize({
  debug: true
});
```

### Getting Help

- **Documentation**: [GitHub Docs](https://github.com/aldrin-exchange/aldrin-sdk/tree/main/docs)
- **Examples**: [GitHub Examples](https://github.com/aldrin-exchange/aldrin-sdk/tree/main/examples)
- **Issues**: [GitHub Issues](https://github.com/aldrin-exchange/aldrin-sdk/issues)
- **Discord**: [Aldrin Community](https://discord.gg/aldrin)

## Wallet Adapter Compatibility

The Aldrin SDK supports the Solana Wallet Adapter standard, making it compatible with various wallet providers:

```js
// Using a basic wallet
const wallet = {
  publicKey: new PublicKey("..."),
  signTransaction: async (tx) => { ... },
  signAllTransactions: async (txs) => { ... }
};

// Using a WalletAdapter-compatible wallet
const walletAdapter = {
  publicKey: new PublicKey("..."),
  signTransaction: async (tx) => { ... },
  signAllTransactions: async (txs) => { ... },
  connect: async () => { ... },
  disconnect: async () => { ... },
  connected: true,
  sendTransaction: async (tx, connection) => { ... }
};

// Both can be used with the SDK
const tokenSwap = await TokenSwap.initialize();
await tokenSwap.swap({
  wallet, // or walletAdapter
  // other parameters...
});
```

For more details, see the [Wallet Adapter Compatibility documentation](docs/wallet-adapter-compatibility.md).

## Development

### Building from Source

1. Clone the repository:
```bash
git clone https://github.com/aldrin-exchange/aldrin-sdk.git
cd aldrin-sdk
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run specific test suites
npm test -- --testPathPattern=tokenSwap
```

### Linting and Formatting

```bash
# Run linter
npm run lint

# Format code
npm run format
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Run tests and linting: `npm test && npm run lint`
5. Commit your changes: `git commit -am 'Add my feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Create a Pull Request

### Documentation

Generate API documentation:

```bash
# Generate docs
npm run docs

# Watch for changes
npm run docs:watch
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Warning

The library is under active development. Use it at your own risk. Always test thoroughly in development environments before using in production.

---

For more information, visit the [Aldrin DEX](https://dex.aldrin.com) or check out our [GitHub repository](https://github.com/aldrin-exchange/aldrin-sdk).