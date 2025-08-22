# CLI Trading Bot - Aldrin SDK Example

A comprehensive command-line trading bot built with the Aldrin SDK. This example demonstrates automated trading strategies, portfolio management, and risk controls in a Node.js environment.

## Features

- 🤖 **Automated Trading**: Multiple trading strategies (DCA, Grid, Arbitrage)
- 📊 **Portfolio Management**: Balance tracking and rebalancing
- ⚠️ **Risk Management**: Stop-loss, position sizing, drawdown protection
- 📈 **Market Analysis**: Technical indicators and signal generation
- 🔔 **Notifications**: Slack, Discord, and email alerts
- 📝 **Comprehensive Logging**: Detailed trade logs and performance metrics
- ⚙️ **Configuration**: YAML-based strategy configuration
- 🔄 **Hot Reloading**: Update strategies without restart
- 📊 **Backtesting**: Historical strategy performance testing

## Quick Start

### Installation

```bash
# Clone and navigate to the project
git clone https://github.com/aldrin-labs/aldrin-sdk.git
cd aldrin-sdk/example-projects/cli-trading-bot

# Install dependencies
npm install

# Copy configuration templates
cp config/strategies.example.yaml config/strategies.yaml
cp .env.example .env

# Generate or import wallet keypair
npm run wallet:create
# or
npm run wallet:import path/to/keypair.json

# Start the bot
npm start
```

### Environment Setup

```bash
# Solana Configuration
SOLANA_RPC_ENDPOINT="https://api.mainnet-beta.solana.com"
SOLANA_NETWORK="mainnet-beta"
WALLET_KEYPAIR_PATH="./wallet-keypair.json"

# Trading Configuration
DEFAULT_SLIPPAGE="0.01"
MAX_POSITION_SIZE="1000"
RISK_PER_TRADE="0.02"

# Notifications
DISCORD_WEBHOOK_URL="your-discord-webhook"
SLACK_WEBHOOK_URL="your-slack-webhook"
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## Command Line Interface

### Basic Commands

```bash
# Start trading bot with default strategy
npm start

# Start with specific strategy
npm run trade -- --strategy=grid

# Start in paper trading mode
npm run trade -- --paper

# View portfolio
npm run portfolio

# Show trading history
npm run history

# Stop all strategies gracefully
npm run stop

# Check bot status
npm run status
```

### Strategy Management

```bash
# List available strategies
npm run strategies:list

# Create new strategy
npm run strategies:create --name=my-strategy

# Backtest strategy
npm run backtest -- --strategy=dca --days=30

# Validate strategy config
npm run strategies:validate
```

### Portfolio Commands

```bash
# View current balances
npm run portfolio:balance

# Rebalance portfolio
npm run portfolio:rebalance

# Set stop-losses
npm run portfolio:stop-loss

# View performance metrics
npm run portfolio:metrics
```

## Trading Strategies

### 1. Dollar-Cost Averaging (DCA)

Automatically purchases tokens at regular intervals:

```yaml
# config/strategies.yaml
dca_strategy:
  type: "dca"
  enabled: true
  tokens:
    - symbol: "SOL"
      allocation: 50  # 50% of capital
      interval: 3600  # 1 hour
      amount: 10      # $10 per purchase
  risk_management:
    max_drawdown: 20
    stop_loss: false
```

### 2. Grid Trading

Places buy and sell orders at multiple price levels:

```yaml
grid_strategy:
  type: "grid"
  enabled: true
  token_pair: "SOL/USDC"
  grid_size: 10
  price_range:
    lower: 80
    upper: 120
  order_size: 100
  risk_management:
    max_open_orders: 20
    grid_reset_threshold: 15
```

### 3. Arbitrage

Identifies and exploits price differences:

```yaml
arbitrage_strategy:
  type: "arbitrage"
  enabled: true
  min_profit_threshold: 0.5  # 0.5%
  max_trade_size: 1000
  exchanges:
    - "aldrin"
    - "orca"
    - "raydium"
  tokens:
    - "SOL"
    - "USDC"
    - "RIN"
```

### 4. Technical Analysis

Uses indicators for buy/sell signals:

```yaml
technical_strategy:
  type: "technical"
  enabled: true
  token: "SOL"
  indicators:
    - type: "rsi"
      period: 14
      overbought: 70
      oversold: 30
    - type: "macd"
      fast: 12
      slow: 26
      signal: 9
  position_sizing: "kelly"
```

## Project Structure

```
src/
├── bot.ts                  # Main bot entry point
├── commands/               # CLI commands
│   ├── trade.ts           # Trading commands
│   ├── portfolio.ts       # Portfolio commands
│   ├── strategies.ts      # Strategy management
│   └── wallet.ts          # Wallet operations
├── strategies/             # Trading strategies
│   ├── base/              # Base strategy classes
│   ├── dca.ts             # Dollar-cost averaging
│   ├── grid.ts            # Grid trading
│   ├── arbitrage.ts       # Arbitrage trading
│   └── technical.ts       # Technical analysis
├── utils/                  # Utility functions
│   ├── logger.ts          # Logging system
│   ├── notifications.ts   # Alert system
│   ├── config.ts          # Configuration loader
│   ├── metrics.ts         # Performance tracking
│   └── risk.ts            # Risk management
├── types/                  # TypeScript definitions
│   ├── strategy.ts        # Strategy interfaces
│   ├── config.ts          # Configuration types
│   └── trading.ts         # Trading types
└── indicators/             # Technical indicators
    ├── rsi.ts             # Relative Strength Index
    ├── macd.ts            # MACD
    ├── bollinger.ts       # Bollinger Bands
    └── sma.ts             # Simple Moving Average
```

## Implementation Examples

### Main Bot Class

```typescript
// src/bot.ts
import { TokenSwap } from '@aldrin_exchange/sdk';
import { Connection, Keypair } from '@solana/web3.js';
import { StrategyManager } from './strategies/StrategyManager';
import { RiskManager } from './utils/risk';
import { Logger } from './utils/logger';
import { NotificationService } from './utils/notifications';

export class TradingBot {
  private tokenSwap: TokenSwap;
  private strategyManager: StrategyManager;
  private riskManager: RiskManager;
  private logger: Logger;
  private notifications: NotificationService;
  private running = false;

  constructor(
    private wallet: Keypair,
    private config: BotConfig
  ) {
    this.logger = new Logger(config.logging);
    this.notifications = new NotificationService(config.notifications);
    this.riskManager = new RiskManager(config.risk);
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing trading bot...');
      
      const connection = new Connection(process.env.SOLANA_RPC_ENDPOINT!);
      this.tokenSwap = await TokenSwap.initialize({ connection });
      
      this.strategyManager = new StrategyManager(
        this.tokenSwap,
        this.wallet,
        this.config.strategies
      );

      await this.strategyManager.initialize();
      
      this.logger.info('Trading bot initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize bot:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    this.running = true;
    this.logger.info('Starting trading bot...');
    
    await this.notifications.send({
      type: 'info',
      message: 'Trading bot started',
      details: { strategies: this.strategyManager.getActiveStrategies() }
    });

    // Main trading loop
    while (this.running) {
      try {
        await this.executeTradingCycle();
        await this.sleep(this.config.cycle_interval || 60000);
      } catch (error) {
        this.logger.error('Error in trading cycle:', error);
        await this.handleError(error);
      }
    }
  }

  private async executeTradingCycle(): Promise<void> {
    // Risk checks
    if (!await this.riskManager.canTrade()) {
      this.logger.warn('Risk limits exceeded, skipping cycle');
      return;
    }

    // Execute strategies
    const signals = await this.strategyManager.generateSignals();
    
    for (const signal of signals) {
      if (await this.riskManager.validateTrade(signal)) {
        await this.executeSignal(signal);
      }
    }

    // Update metrics
    await this.updateMetrics();
  }

  private async executeSignal(signal: TradeSignal): Promise<void> {
    try {
      this.logger.info(`Executing ${signal.type} signal`, {
        token: signal.token,
        amount: signal.amount,
        strategy: signal.strategy
      });

      const signature = await this.tokenSwap.swap({
        wallet: this.wallet,
        mintFrom: signal.fromToken,
        mintTo: signal.toToken,
        minIncomeAmount: signal.minAmount,
      });

      this.logger.info('Trade executed successfully', { signature });
      
      await this.notifications.send({
        type: 'success',
        message: `Trade executed: ${signal.type}`,
        details: { signature, signal }
      });

    } catch (error) {
      this.logger.error('Failed to execute signal:', error);
      await this.notifications.send({
        type: 'error',
        message: 'Trade execution failed',
        details: { error: error.message, signal }
      });
    }
  }

  stop(): void {
    this.running = false;
    this.logger.info('Stopping trading bot...');
  }
}
```

### DCA Strategy Implementation

```typescript
// src/strategies/dca.ts
import { BaseStrategy } from './base/BaseStrategy';
import { TradeSignal, DCAConfig } from '../types';
import BN from 'bn.js';

export class DCAStrategy extends BaseStrategy {
  private lastExecutionTimes = new Map<string, number>();

  constructor(private config: DCAConfig) {
    super('DCA Strategy');
  }

  async generateSignals(): Promise<TradeSignal[]> {
    const signals: TradeSignal[] = [];
    const now = Date.now();

    for (const tokenConfig of this.config.tokens) {
      const lastExecution = this.lastExecutionTimes.get(tokenConfig.symbol) || 0;
      const timeSinceLastExecution = now - lastExecution;

      if (timeSinceLastExecution >= tokenConfig.interval * 1000) {
        const signal: TradeSignal = {
          type: 'buy',
          strategy: this.name,
          token: tokenConfig.symbol,
          fromToken: this.getUSDCMint(),
          toToken: this.getTokenMint(tokenConfig.symbol),
          amount: new BN(tokenConfig.amount * 1e6), // USDC decimals
          minAmount: this.calculateMinAmount(tokenConfig.amount, tokenConfig.symbol),
          timestamp: now,
          confidence: 1.0, // DCA has fixed confidence
        };

        signals.push(signal);
        this.lastExecutionTimes.set(tokenConfig.symbol, now);
      }
    }

    return signals;
  }

  async validateSignal(signal: TradeSignal): Promise<boolean> {
    // Check if we have enough balance
    const balance = await this.getTokenBalance(signal.fromToken);
    
    if (balance.lt(signal.amount)) {
      this.logger.warn(`Insufficient balance for DCA order`, {
        required: signal.amount.toString(),
        available: balance.toString()
      });
      return false;
    }

    // Check maximum allocation
    const tokenConfig = this.config.tokens.find(t => t.symbol === signal.token);
    if (tokenConfig) {
      const currentAllocation = await this.getCurrentAllocation(signal.token);
      if (currentAllocation >= tokenConfig.allocation) {
        this.logger.info(`Maximum allocation reached for ${signal.token}`);
        return false;
      }
    }

    return true;
  }

  private calculateMinAmount(amount: number, token: string): BN {
    const slippage = this.config.slippage || 0.01;
    const price = this.getTokenPrice(token);
    const expectedTokens = amount / price;
    const minTokens = expectedTokens * (1 - slippage);
    
    return new BN(minTokens * 1e9); // SOL decimals
  }
}
```

### Risk Management System

```typescript
// src/utils/risk.ts
export class RiskManager {
  constructor(private config: RiskConfig) {}

  async canTrade(): Promise<boolean> {
    // Check daily loss limits
    const todayPnL = await this.getTodayPnL();
    if (todayPnL < -this.config.max_daily_loss) {
      return false;
    }

    // Check maximum drawdown
    const currentDrawdown = await this.getCurrentDrawdown();
    if (currentDrawdown > this.config.max_drawdown) {
      return false;
    }

    // Check open positions limit
    const openPositions = await this.getOpenPositions();
    if (openPositions.length >= this.config.max_open_positions) {
      return false;
    }

    return true;
  }

  async validateTrade(signal: TradeSignal): Promise<boolean> {
    // Position sizing check
    const portfolioValue = await this.getPortfolioValue();
    const maxTradeSize = portfolioValue * this.config.max_position_size;
    
    if (signal.amount.gt(new BN(maxTradeSize))) {
      return false;
    }

    // Risk per trade check
    const riskAmount = portfolioValue * this.config.risk_per_trade;
    const estimatedRisk = await this.calculateTradeRisk(signal);
    
    if (estimatedRisk > riskAmount) {
      return false;
    }

    return true;
  }

  private async calculateTradeRisk(signal: TradeSignal): BN {
    // Calculate potential loss based on stop-loss level
    const currentPrice = await this.getTokenPrice(signal.token);
    const stopLossPrice = currentPrice * (1 - this.config.stop_loss_pct);
    const potentialLoss = (currentPrice - stopLossPrice) * signal.amount.toNumber();
    
    return new BN(potentialLoss);
  }
}
```

## Configuration

### Strategy Configuration

```yaml
# config/strategies.yaml
strategies:
  dca:
    enabled: true
    tokens:
      - symbol: "SOL"
        allocation: 40
        interval: 3600  # 1 hour
        amount: 10      # USD
      - symbol: "RIN"
        allocation: 30
        interval: 7200  # 2 hours
        amount: 5       # USD
    slippage: 0.01

  grid:
    enabled: false
    token_pair: "SOL/USDC"
    grid_size: 10
    price_range:
      lower: 80
      upper: 120
    order_size: 50
    rebalance_threshold: 5

risk_management:
  max_daily_loss: 100        # USD
  max_drawdown: 0.20         # 20%
  max_position_size: 0.10    # 10% of portfolio
  risk_per_trade: 0.02       # 2% of portfolio
  stop_loss_pct: 0.05        # 5%
  max_open_positions: 10

notifications:
  discord:
    enabled: true
    webhook_url: "${DISCORD_WEBHOOK_URL}"
    trade_alerts: true
    error_alerts: true
  
  email:
    enabled: false
    smtp_host: "${SMTP_HOST}"
    smtp_user: "${SMTP_USER}"
    smtp_pass: "${SMTP_PASS}"
    to_address: "trader@example.com"

logging:
  level: "info"
  file_path: "./logs/trading.log"
  max_files: 30
  max_size: "10MB"
```

## Monitoring and Alerts

### Discord Notifications

```typescript
// src/utils/notifications.ts
export class NotificationService {
  private discordWebhook?: string;
  private slackWebhook?: string;

  constructor(config: NotificationConfig) {
    this.discordWebhook = config.discord?.webhook_url;
    this.slackWebhook = config.slack?.webhook_url;
  }

  async send(notification: Notification): Promise<void> {
    const promises = [];

    if (this.discordWebhook) {
      promises.push(this.sendDiscord(notification));
    }

    if (this.slackWebhook) {
      promises.push(this.sendSlack(notification));
    }

    await Promise.allSettled(promises);
  }

  private async sendDiscord(notification: Notification): Promise<void> {
    const embed = {
      title: notification.type.toUpperCase(),
      description: notification.message,
      color: this.getColorForType(notification.type),
      timestamp: new Date().toISOString(),
      fields: notification.details ? [
        {
          name: "Details",
          value: "```json\n" + JSON.stringify(notification.details, null, 2) + "\n```"
        }
      ] : undefined
    };

    await fetch(this.discordWebhook!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  }
}
```

## Deployment and Operations

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S trader -u 1001
USER trader

# Start the bot
CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  trading-bot:
    build: .
    container_name: aldrin-trading-bot
    environment:
      - NODE_ENV=production
      - SOLANA_RPC_ENDPOINT=${SOLANA_RPC_ENDPOINT}
      - WALLET_KEYPAIR_PATH=/app/wallet/keypair.json
    volumes:
      - ./wallet:/app/wallet:ro
      - ./logs:/app/logs
      - ./config:/app/config:ro
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  monitoring:
    image: grafana/grafana:latest
    container_name: trading-bot-monitoring
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  grafana-data:
```

### Systemd Service

```ini
# /etc/systemd/system/aldrin-trading-bot.service
[Unit]
Description=Aldrin Trading Bot
After=network.target

[Service]
Type=simple
User=trader
WorkingDirectory=/home/trader/aldrin-trading-bot
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## Performance Monitoring

### Metrics Collection

```typescript
// src/utils/metrics.ts
export class MetricsCollector {
  private trades: Trade[] = [];
  private profits: number[] = [];

  recordTrade(trade: Trade): void {
    this.trades.push(trade);
    this.profits.push(trade.profit);
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return {
      totalTrades: this.trades.length,
      winRate: this.calculateWinRate(),
      totalProfit: this.profits.reduce((sum, profit) => sum + profit, 0),
      averageProfit: this.profits.reduce((sum, profit) => sum + profit, 0) / this.profits.length,
      maxDrawdown: this.calculateMaxDrawdown(),
      sharpeRatio: this.calculateSharpeRatio(),
    };
  }

  private calculateWinRate(): number {
    const winningTrades = this.profits.filter(profit => profit > 0).length;
    return winningTrades / this.profits.length;
  }

  private calculateMaxDrawdown(): number {
    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 0;

    for (const profit of this.profits) {
      cumulative += profit;
      peak = Math.max(peak, cumulative);
      const drawdown = (peak - cumulative) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }
}
```

## Testing

### Strategy Backtesting

```bash
# Backtest DCA strategy for 30 days
npm run backtest -- --strategy=dca --days=30

# Backtest all strategies
npm run backtest:all

# Generate backtest report
npm run backtest:report
```

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- strategies

# Run with coverage
npm run test:coverage
```

## Security Best Practices

- **Private Key Protection**: Store keypairs securely, never in code
- **Environment Variables**: Use `.env` files for sensitive config
- **Network Security**: Use VPNs and secure connections
- **Rate Limiting**: Implement proper rate limiting for API calls
- **Error Handling**: Don't expose sensitive information in logs
- **Access Control**: Limit bot permissions and capabilities

## License

This example is licensed under the Apache License 2.0.