# Aldrin SDK Technical Specification

## Overview

The Aldrin SDK is a comprehensive TypeScript/JavaScript library for interacting with the Aldrin decentralized exchange on Solana. This document provides detailed technical specifications for all components, interfaces, and architectural patterns.

## Table of Contents

- [Architecture](#architecture)
- [Core Components](#core-components)
- [API Specification](#api-specification)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Performance Specifications](#performance-specifications)
- [Security Considerations](#security-considerations)
- [Integration Patterns](#integration-patterns)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Applications                     │
├─────────────────────────────────────────────────────────────────┤
│                          Aldrin SDK                             │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│ TokenSwap   │ PoolClient  │ FarmingClient│ StakingClient│ DTWAP   │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────┤
│             SwapBase (Shared functionality)                     │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│ Transaction │ Pool        │ Token       │ Farming     │ Utils   │
│ Handlers    │ Management  │ Operations  │ Operations  │         │
├─────────────┴─────────────┴─────────────┴─────────────┴─────────┤
│                    Solana Web3.js Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                       Solana RPC                               │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### TokenSwap
- **Primary Interface**: Main entry point for all trading operations
- **Swap Execution**: Handles token-to-token exchanges
- **Price Discovery**: Provides current market prices and impact analysis
- **Liquidity Management**: Add/remove liquidity from pools
- **Event-Driven RPC**: Dynamic RPC endpoint switching

#### PoolClient
- **Pool Discovery**: Load and manage trading pool information
- **Pool State**: Track pool reserves, fees, and configuration
- **Pool Validation**: Ensure pool integrity and authorization

#### FarmingClient
- **Yield Farming**: Stake LP tokens to earn additional rewards
- **Reward Management**: Track and claim farming rewards
- **Farm Operations**: Start, stop, and manage farming positions

#### StakingClient
- **Token Staking**: Stake RIN tokens for rewards and governance
- **Staking Rewards**: Calculate and claim staking rewards
- **Staking Lifecycle**: Manage staking periods and withdrawals

#### DtwapClient
- **Dollar-Cost Averaging**: Automated recurring purchases
- **Order Management**: Create, execute, and cancel DTWAP orders
- **Time-Based Execution**: Schedule and trigger order intervals

### Data Flow

```
User Request → TokenSwap → SwapBase → Specialized Client → Transaction → Solana
     ↓                                                                    ↓
Result ←─────────── Response ←───────── Confirmation ←─────────────── Network
```

## Core Components

### SwapBase Class

**Purpose**: Shared functionality across all client classes

**Key Features**:
- Connection management with automatic reconnection
- Transaction building and execution
- Error handling and retry logic
- Cache management for pool data
- Event emission for status updates

**Interface**:
```typescript
abstract class SwapBase {
  protected connection: Connection;
  protected poolClient: PoolClient;
  protected tokenClient: TokenClient;
  protected farmingClient: FarmingClient;
  
  // Core methods
  public abstract initialize(params?: any): Promise<void>;
  public updateConnection(newConnection: Connection): Promise<void>;
  protected buildTransaction(instructions: TransactionInstruction[]): Transaction;
  protected sendTransaction(transaction: Transaction, wallet: Wallet): Promise<string>;
}
```

### Connection Management

**RPC Configuration Hierarchy**:
1. Custom Connection parameter (highest priority)
2. Event-driven dynamic switching
3. Environment variable `SOLANA_RPC_ENDPOINT`
4. Default fallback endpoint

**Dynamic RPC Switching**:
```typescript
interface RpcEventEmitter extends EventEmitter {
  emit(event: 'rpcUrlChange', url: string): boolean;
  on(event: 'rpcUrlChangeSuccess', listener: (url: string) => void): this;
  on(event: 'rpcUrlChangeError', listener: (error: Error, url: string) => void): this;
}
```

## API Specification

### TokenSwap Interface

#### Initialization
```typescript
static async initialize(params?: TokenSwapLoadParams): Promise<TokenSwap>

interface TokenSwapLoadParams {
  connection?: Connection;
  rpcEventEmitter?: EventEmitter;
}
```

#### Swap Operations
```typescript
async swap(params: SwapParams): Promise<string>

interface SwapParams {
  wallet: Wallet;
  mintFrom: PublicKey;
  mintTo: PublicKey;
  minIncomeAmount?: BN;
  outcomeAmount?: BN;
  referralAccount?: PublicKey;
  referralPercent?: number;
  createTokenAccounts?: boolean;
  skipConfirmation?: boolean;
  maxSlippage?: number;
}
```

#### Price Discovery
```typescript
async getPrice(params: GetPriceParams): Promise<number>
async getPriceWithImpact(params: PriceImpactParams): Promise<PriceImpactInfo>

interface GetPriceParams {
  mintFrom: PublicKey;
  mintTo: PublicKey;
}

interface PriceImpactParams extends GetPriceParams {
  amount: BN;
}

interface PriceImpactInfo {
  price: number;
  priceImpact: number;
  minimumReceived: BN;
  fees: BN;
  route: PublicKey[];
}
```

#### Liquidity Operations
```typescript
async depositLiquidity(params: DepositLiquidityParams): Promise<string>
async withdrawLiquidity(params: WithdrawLiquidityParams): Promise<string>

interface DepositLiquidityParams {
  wallet: Wallet;
  poolMint: PublicKey;
  maxBase?: BN;
  maxQuote?: BN;
}

interface WithdrawLiquidityParams {
  wallet: Wallet;
  poolMint: PublicKey;
  poolTokenAmount: BN;
  minBase?: BN;
  minQuote?: BN;
}
```

### PoolClient Interface

```typescript
class PoolClient {
  async loadPools(): Promise<Pool[]>
  async loadPool(poolMint: PublicKey): Promise<Pool>
  async getPoolByTokens(tokenA: PublicKey, tokenB: PublicKey): Promise<Pool | null>
  async getPoolInfo(poolMint: PublicKey): Promise<PoolInfo>
}

interface Pool {
  poolMint: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseAmount: BN;
  quoteAmount: BN;
  poolTokenSupply: BN;
  feeRatio: number;
  curve: CurveType;
}

interface PoolInfo extends Pool {
  volume24h: BN;
  fees24h: BN;
  apy: number;
  tvl: BN;
}
```

### FarmingClient Interface

```typescript
class FarmingClient {
  async startFarming(params: StartFarmingParams): Promise<string>
  async stopFarming(params: StopFarmingParams): Promise<string>
  async claimFarmed(params: ClaimFarmedParams): Promise<string>
  async getFarmed(params: GetFarmedParams): Promise<FarmedInfo[]>
  async getFarm(poolMint: PublicKey): Promise<Farm>
}

interface StartFarmingParams {
  wallet: Wallet;
  poolMint: PublicKey;
  lpTokenAmount: BN;
}

interface StopFarmingParams {
  wallet: Wallet;
  poolMint: PublicKey;
}

interface ClaimFarmedParams {
  wallet: Wallet;
  poolMint: PublicKey;
}

interface GetFarmedParams {
  wallet: Wallet;
  poolMint: PublicKey;
}

interface FarmedInfo {
  tokenInfo: TokenInfo;
  calcAccount: {
    tokenAmount: BN;
    lastClaimed: number;
  };
}

interface Farm {
  poolMint: PublicKey;
  rewardTokens: PublicKey[];
  rewardRates: BN[];
  totalStaked: BN;
  startTime: number;
  endTime: number;
}
```

### StakingClient Interface

```typescript
class StakingClient {
  async startStaking(params: StartStakingParams): Promise<string>
  async endStaking(params: EndStakingParams): Promise<string>
  async claim(params: ClaimParams): Promise<string>
  async getStakingAccount(wallet: PublicKey): Promise<StakingAccount>
}

interface StartStakingParams {
  wallet: Wallet;
  tokenAmount: BN;
}

interface EndStakingParams {
  wallet: Wallet;
}

interface ClaimParams {
  wallet: Wallet;
}

interface StakingAccount {
  stakedAmount: BN;
  rewards: BN;
  startTime: number;
  lastClaimed: number;
  stakingRate: number;
}
```

### DtwapClient Interface

```typescript
class DtwapClient {
  async createOrder(params: CreateOrderParams): Promise<Order>
  async executeOrder(params: ExecuteOrderParams): Promise<string>
  async cancelOrder(params: CancelOrderParams): Promise<string>
  async getOrders(wallet: PublicKey): Promise<Order[]>
  async getOrder(orderAccount: PublicKey): Promise<Order>
}

interface CreateOrderParams {
  wallet: Wallet;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  totalAmount: BN;
  intervalAmount: BN;
  intervalSeconds: number;
  maxSlippage: number;
  startTime?: number;
  endTime?: number;
}

interface ExecuteOrderParams {
  wallet: Wallet;
  orderAccount: PublicKey;
}

interface CancelOrderParams {
  wallet: Wallet;
  orderAccount: PublicKey;
}

interface Order {
  publicKey: PublicKey;
  authority: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  totalAmount: BN;
  remainingAmount: BN;
  intervalAmount: BN;
  intervalSeconds: number;
  maxSlippage: number;
  startTime: number;
  endTime: number;
  nextExecution: number;
  executedIntervals: number;
  status: OrderStatus;
}

enum OrderStatus {
  Active = 0,
  Paused = 1,
  Completed = 2,
  Cancelled = 3,
}
```

## Data Models

### Core Data Types

```typescript
// Token representation
interface TokenInfo {
  mint: PublicKey;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
}

// Pool curve types
enum CurveType {
  Product = 0,
  Stable = 1,
}

// Transaction options
interface TransactionOptions {
  skipPreflight?: boolean;
  maxRetries?: number;
  preflightCommitment?: Commitment;
  commitment?: Commitment;
}

// Wallet interface
interface Wallet {
  publicKey: PublicKey;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}
```

### Pool Data Model

```typescript
interface PoolData {
  // Basic pool information
  poolMint: PublicKey;
  poolAuthority: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  lpMint: PublicKey;
  
  // Pool state
  baseAmount: BN;
  quoteAmount: BN;
  poolTokenSupply: BN;
  
  // Pool configuration
  feeRatio: number;
  ownerTradeFeeNumerator: BN;
  ownerTradeFeeDenominator: BN;
  ownerWithdrawFeeNumerator: BN;
  ownerWithdrawFeeDenominator: BN;
  
  // Pool type and curve
  curve: CurveType;
  
  // Metadata
  version: number;
  isInitialized: boolean;
}
```

### Transaction Result Model

```typescript
interface TransactionResult {
  signature: string;
  confirmationStatus: 'processed' | 'confirmed' | 'finalized';
  blockTime?: number;
  slot: number;
  confirmations?: number;
  error?: string;
}

interface SwapResult extends TransactionResult {
  inputAmount: BN;
  outputAmount: BN;
  priceImpact: number;
  fees: BN;
  route: PublicKey[];
}
```

## Error Handling

### Error Types

```typescript
enum ErrorCode {
  // Connection errors
  RPC_CONNECTION_FAILED = 'RPC_CONNECTION_FAILED',
  RPC_TIMEOUT = 'RPC_TIMEOUT',
  
  // Transaction errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  
  // Pool errors
  POOL_NOT_FOUND = 'POOL_NOT_FOUND',
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  INVALID_POOL_STATE = 'INVALID_POOL_STATE',
  
  // Account errors
  TOKEN_ACCOUNT_NOT_FOUND = 'TOKEN_ACCOUNT_NOT_FOUND',
  INVALID_WALLET = 'INVALID_WALLET',
  
  // Validation errors
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_TOKEN_MINT = 'INVALID_TOKEN_MINT',
  
  // Authorization errors
  UNAUTHORIZED_POOL = 'UNAUTHORIZED_POOL',
  SIGNATURE_VERIFICATION_FAILED = 'SIGNATURE_VERIFICATION_FAILED',
}

class AldrinError extends Error {
  public readonly code: ErrorCode;
  public readonly details: any;
  public readonly timestamp: number;
  
  constructor(code: ErrorCode, message: string, details?: any) {
    super(message);
    this.name = 'AldrinError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
  }
}
```

### Error Handling Patterns

```typescript
// Retry logic for transient errors
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      if (!isRetryableError(error)) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('Unexpected retry loop exit');
}

// Error classification
function isRetryableError(error: any): boolean {
  return error.code === ErrorCode.RPC_TIMEOUT ||
         error.code === ErrorCode.RPC_CONNECTION_FAILED ||
         (error.message && error.message.includes('block height exceeded'));
}
```

## Performance Specifications

### Response Time Targets

| Operation | Target Response Time | Maximum Acceptable |
|-----------|---------------------|-------------------|
| Get Price | < 500ms | 1000ms |
| Load Pool | < 300ms | 800ms |
| Execute Swap | < 2000ms | 5000ms |
| Load Pools | < 1000ms | 3000ms |

### Throughput Specifications

| Metric | Target | Notes |
|--------|--------|-------|
| Concurrent Swaps | 100 TPS | Per SDK instance |
| Price Updates | 10 Hz | Real-time pricing |
| Pool Data Refresh | 1 Hz | Background updates |

### Memory Usage

| Component | Expected Memory | Maximum |
|-----------|----------------|---------|
| TokenSwap Instance | 10-20 MB | 50 MB |
| Pool Cache | 5-10 MB | 25 MB |
| Transaction Queue | 1-5 MB | 10 MB |

### Caching Strategy

```typescript
interface CacheConfig {
  poolDataTTL: number; // 30 seconds
  priceDataTTL: number; // 5 seconds
  tokenInfoTTL: number; // 300 seconds (5 minutes)
  maxCacheSize: number; // 1000 entries
}

class PerformanceOptimizer {
  private cache: Map<string, CacheEntry>;
  
  async getCachedData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }
    
    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.getTTLForKey(key)
    });
    
    return data;
  }
}
```

## Security Considerations

### Key Management

- **Never log private keys**: SDK does not handle private keys directly
- **Wallet abstraction**: Use standardized wallet interfaces
- **Signature verification**: All transactions must be properly signed

### Transaction Security

```typescript
interface SecurityConfig {
  maxSlippage: number; // Default 1%
  transactionTimeout: number; // 30 seconds
  confirmationLevel: 'processed' | 'confirmed' | 'finalized'; // 'confirmed'
  enableSimulation: boolean; // true
}

// Pre-flight transaction validation
async function validateTransaction(transaction: Transaction): Promise<void> {
  // Check transaction size
  if (transaction.serialize().length > 1232) {
    throw new AldrinError(ErrorCode.TRANSACTION_TOO_LARGE, 'Transaction exceeds size limit');
  }
  
  // Simulate transaction
  const simulation = await connection.simulateTransaction(transaction);
  if (simulation.value.err) {
    throw new AldrinError(ErrorCode.TRANSACTION_SIMULATION_FAILED, 'Transaction simulation failed', simulation.value.err);
  }
}
```

### Rate Limiting

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  async checkLimit(key: string, limit: number, window: number): Promise<void> {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < window);
    
    if (recentRequests.length >= limit) {
      throw new AldrinError(ErrorCode.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded');
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
  }
}
```

## Integration Patterns

### Event-Driven Architecture

```typescript
interface SDKEvents {
  'priceUpdate': (token: PublicKey, price: number) => void;
  'poolUpdate': (pool: Pool) => void;
  'transactionSubmitted': (signature: string) => void;
  'transactionConfirmed': (result: TransactionResult) => void;
  'error': (error: AldrinError) => void;
}

class EventEmittingTokenSwap extends TokenSwap {
  private eventEmitter = new EventEmitter();
  
  on<K extends keyof SDKEvents>(event: K, listener: SDKEvents[K]): this {
    this.eventEmitter.on(event, listener);
    return this;
  }
  
  private emit<K extends keyof SDKEvents>(event: K, ...args: Parameters<SDKEvents[K]>): void {
    this.eventEmitter.emit(event, ...args);
  }
}
```

### Middleware Pattern

```typescript
interface Middleware {
  beforeTransaction?(transaction: Transaction): Promise<Transaction>;
  afterTransaction?(result: TransactionResult): Promise<void>;
  onError?(error: AldrinError): Promise<void>;
}

class MiddlewareManager {
  private middlewares: Middleware[] = [];
  
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }
  
  async executeTransaction(transaction: Transaction): Promise<TransactionResult> {
    // Apply before middleware
    for (const middleware of this.middlewares) {
      if (middleware.beforeTransaction) {
        transaction = await middleware.beforeTransaction(transaction);
      }
    }
    
    try {
      const result = await this.sendTransaction(transaction);
      
      // Apply after middleware
      for (const middleware of this.middlewares) {
        if (middleware.afterTransaction) {
          await middleware.afterTransaction(result);
        }
      }
      
      return result;
    } catch (error) {
      // Apply error middleware
      for (const middleware of this.middlewares) {
        if (middleware.onError) {
          await middleware.onError(error);
        }
      }
      throw error;
    }
  }
}
```

### Plugin Architecture

```typescript
interface Plugin {
  name: string;
  version: string;
  initialize(sdk: TokenSwap): Promise<void>;
  destroy?(): Promise<void>;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  
  async loadPlugin(plugin: Plugin, sdk: TokenSwap): Promise<void> {
    await plugin.initialize(sdk);
    this.plugins.set(plugin.name, plugin);
  }
  
  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin && plugin.destroy) {
      await plugin.destroy();
    }
    this.plugins.delete(name);
  }
}
```

## Version Compatibility

### Breaking Changes Policy

- **Major versions** (X.0.0): Breaking API changes
- **Minor versions** (X.Y.0): New features, backward compatible
- **Patch versions** (X.Y.Z): Bug fixes, backward compatible

### Migration Guides

Each major version includes:
- Migration guide with code examples
- Deprecated feature timeline
- Compatibility layer when possible
- Automated migration tools

### Supported Solana Versions

| SDK Version | Solana Web3.js | Solana RPC | Notes |
|-------------|----------------|------------|-------|
| 0.4.x | ^1.95.0 | 1.14+ | Current stable |
| 0.5.x | ^1.98.0 | 1.16+ | Next major release |

This specification serves as the authoritative reference for the Aldrin SDK architecture, APIs, and integration patterns. For implementation details, refer to the source code and examples.