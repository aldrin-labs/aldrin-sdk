# Aldrin SDK Example Projects

This directory contains complete example projects demonstrating how to use the Aldrin SDK in various real-world scenarios across different platforms.

## Available Examples

### Web Applications
- **[trading-dashboard-react/](./trading-dashboard-react/)** - React-based DEX trading interface
- **[nextjs-dex-app/](./nextjs-dex-app/)** - Next.js full-stack trading application
- **[vue-portfolio-tracker/](./vue-portfolio-tracker/)** - Vue.js portfolio tracking dashboard

### Node.js Applications
- **[cli-trading-bot/](./cli-trading-bot/)** - Command-line trading bot with strategies
- **[dca-automation-service/](./dca-automation-service/)** - Dollar-cost averaging automation
- **[liquidity-provider-bot/](./liquidity-provider-bot/)** - Automated liquidity provision

### Mobile Applications
- **[react-native-wallet/](./react-native-wallet/)** - React Native wallet integration
- **[flutter-dex-interface/](./flutter-dex-interface/)** - Flutter mobile trading app

### Rust Integration
- **[rust-swap-calculator/](./rust-swap-calculator/)** - High-performance swap calculations
- **[anchor-program-integration/](./anchor-program-integration/)** - Custom Anchor program using SDK

### Specialized Use Cases
- **[market-maker-bot/](./market-maker-bot/)** - Market making strategies
- **[arbitrage-detector/](./arbitrage-detector/)** - Cross-DEX arbitrage opportunities
- **[yield-farming-optimizer/](./yield-farming-optimizer/)** - Automated yield optimization
- **[price-alert-service/](./price-alert-service/)** - Real-time price monitoring

### Development Tools
- **[sdk-testing-framework/](./sdk-testing-framework/)** - Comprehensive testing utilities
- **[performance-benchmarks/](./performance-benchmarks/)** - Performance testing suite
- **[integration-test-suite/](./integration-test-suite/)** - End-to-end integration tests

## Quick Start

Each example project includes:
- **README.md** - Setup and usage instructions
- **package.json** - Dependencies and scripts
- **Environment setup** - Configuration templates
- **Deployment guides** - Platform-specific deployment instructions
- **Docker support** - Containerized deployment options

## Running Examples

### Prerequisites
```bash
# Clone the repository
git clone https://github.com/aldrin-labs/aldrin-sdk.git
cd aldrin-sdk/example-projects

# Install SDK globally (optional)
npm install -g @aldrin_exchange/sdk
```

### Basic Setup
```bash
# Navigate to any example
cd trading-dashboard-react

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your environment
nano .env

# Run the example
npm start
```

## Environment Configuration

### Common Environment Variables
```bash
# Solana Network Configuration
SOLANA_RPC_ENDPOINT="https://api.mainnet-beta.solana.com"
SOLANA_NETWORK="mainnet-beta" # or "devnet", "testnet"

# Wallet Configuration (for automation examples)
WALLET_PRIVATE_KEY="your-base58-private-key"
WALLET_PATH="/path/to/keypair.json"

# API Keys (if using premium RPC)
HELIUS_API_KEY="your-helius-api-key"
QUICKNODE_API_KEY="your-quicknode-api-key"

# Trading Configuration
DEFAULT_SLIPPAGE="0.01" # 1%
MAX_TRANSACTION_RETRY="3"
CONFIRMATION_LEVEL="confirmed"

# Application-Specific
PORT="3000"
DATABASE_URL="your-database-connection"
REDIS_URL="your-redis-connection"
```

## Platform-Specific Examples

### React/Next.js Web Apps
- Modern React hooks integration
- Real-time price updates with WebSockets
- Wallet adapter integration
- Mobile-responsive design
- TypeScript throughout

### Node.js Services
- Express.js API servers
- Background job processing
- Database integration
- Monitoring and logging
- Docker containerization

### Mobile Applications
- React Native with Expo
- Flutter integration patterns
- Mobile wallet connectivity
- Offline capability
- Push notifications

### Rust Applications
- High-performance calculations
- Anchor program integration
- Cross-language FFI bindings
- WASM compilation
- Parallel processing

## Development Patterns

### Common Patterns Demonstrated

1. **Connection Management**
   - RPC endpoint switching
   - Connection pooling
   - Automatic retry logic
   - Health monitoring

2. **Error Handling**
   - Graceful error recovery
   - User-friendly error messages
   - Logging and monitoring
   - Circuit breaker patterns

3. **Performance Optimization**
   - Caching strategies
   - Batch operations
   - Lazy loading
   - Memory management

4. **Security Best Practices**
   - Private key management
   - Transaction validation
   - Rate limiting
   - Input sanitization

## Testing

Each example includes comprehensive tests:

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance
```

## Deployment

### Docker Support
```bash
# Build image
docker build -t aldrin-example .

# Run container
docker run -p 3000:3000 aldrin-example
```

### Cloud Deployment
- **AWS**: ECS, Lambda, Elastic Beanstalk guides
- **Google Cloud**: Cloud Run, App Engine deployment
- **Vercel**: Serverless Next.js deployment
- **Heroku**: Simple web app deployment

## Contributing

### Adding New Examples

1. Create a new directory with descriptive name
2. Include complete project setup
3. Add comprehensive README
4. Provide environment templates
5. Include Docker configuration
6. Add to this main README

### Example Structure
```
new-example/
├── README.md                 # Setup and usage guide
├── package.json             # Dependencies and scripts
├── .env.example            # Environment template
├── Dockerfile              # Container configuration
├── docker-compose.yml      # Multi-service setup
├── src/                    # Source code
├── tests/                  # Test files
├── docs/                   # Additional documentation
└── deploy/                 # Deployment scripts
```

## Support

For questions and support:
- [GitHub Issues](https://github.com/aldrin-labs/aldrin-sdk/issues)
- [Discord Community](https://discord.gg/aldrin)
- [Documentation](https://github.com/aldrin-labs/aldrin-sdk/tree/main/docs)

## License

All examples are licensed under the Apache License 2.0, same as the main SDK.