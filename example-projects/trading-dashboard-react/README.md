# React Trading Dashboard - Aldrin SDK Example

A complete React-based decentralized exchange trading interface using the Aldrin SDK. This example demonstrates modern React patterns, real-time price updates, wallet integration, and comprehensive trading functionality.

## Features

- 🔄 **Real-time Trading**: Live price updates and instant swap execution
- 👛 **Wallet Integration**: Support for multiple Solana wallets
- 📊 **Advanced Charts**: TradingView-style price charts
- 💰 **Portfolio Tracking**: Track balances, P&L, and trading history
- 🌱 **Yield Farming**: Liquidity provision and farming management
- 🎯 **DCA Orders**: Dollar-cost averaging automation
- 📱 **Responsive Design**: Mobile-first responsive interface
- ⚡ **Performance**: Optimized with React Query and virtualization

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS + HeadlessUI
- **Charts**: Lightweight Charts (TradingView)
- **Wallet**: Solana Wallet Adapter
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

## Quick Start

### Prerequisites

```bash
# Ensure you have Node.js 18+ and npm/yarn installed
node --version  # Should be 18+
npm --version   # or yarn --version
```

### Installation

```bash
# Clone and navigate to the project
git clone https://github.com/aldrin-labs/aldrin-sdk.git
cd aldrin-sdk/example-projects/trading-dashboard-react

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Configuration

Create `.env.local` with your configuration:

```bash
# Solana Network
VITE_SOLANA_RPC_ENDPOINT="https://api.mainnet-beta.solana.com"
VITE_SOLANA_NETWORK="mainnet-beta"

# Optional: Premium RPC endpoints
VITE_HELIUS_API_KEY="your-helius-api-key"
VITE_QUICKNODE_ENDPOINT="your-quicknode-endpoint"

# App Configuration
VITE_APP_NAME="Aldrin Trading Dashboard"
VITE_DEFAULT_SLIPPAGE="0.01"
VITE_REFRESH_INTERVAL="5000"

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID="your-ga-id"
```

## Project Structure

```
src/
├── components/           # React components
│   ├── trading/         # Trading-specific components
│   ├── portfolio/       # Portfolio management
│   ├── farming/         # Yield farming interface
│   ├── charts/          # Chart components
│   ├── ui/              # Reusable UI components
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
│   ├── useAldrinSDK.ts  # Main SDK hook
│   ├── useWallet.ts     # Wallet management
│   ├── usePrices.ts     # Price data
│   └── usePool.ts       # Pool data
├── utils/               # Utility functions
│   ├── format.ts        # Number/date formatting
│   ├── validation.ts    # Input validation
│   └── constants.ts     # App constants
├── types/               # TypeScript definitions
│   ├── trading.ts       # Trading types
│   ├── portfolio.ts     # Portfolio types
│   └── api.ts           # API response types
├── stores/              # Zustand stores
│   ├── tradingStore.ts  # Trading state
│   ├── portfolioStore.ts # Portfolio state
│   └── uiStore.ts       # UI state
└── App.tsx              # Main app component
```

## Key Components

### Trading Interface

The main trading component with swap functionality:

```typescript
// src/components/trading/SwapInterface.tsx
import { useState } from 'react';
import { useAldrinSDK } from '../../hooks/useAldrinSDK';
import { TokenSelector } from './TokenSelector';
import { SwapButton } from './SwapButton';

export function SwapInterface() {
  const { tokenSwap } = useAldrinSDK();
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [amount, setAmount] = useState('');

  const handleSwap = async () => {
    if (!fromToken || !toToken || !amount) return;
    
    try {
      const signature = await tokenSwap.swap({
        wallet,
        mintFrom: fromToken.mint,
        mintTo: toToken.mint,
        minIncomeAmount: calculateMinAmount(amount)
      });
      
      console.log('Swap successful:', signature);
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Swap Tokens</h2>
      
      <TokenSelector
        label="From"
        token={fromToken}
        onTokenChange={setFromToken}
        amount={amount}
        onAmountChange={setAmount}
      />
      
      <TokenSelector
        label="To"
        token={toToken}
        onTokenChange={setToToken}
        readonly
      />
      
      <SwapButton
        fromToken={fromToken}
        toToken={toToken}
        amount={amount}
        onSwap={handleSwap}
      />
    </div>
  );
}
```

### Real-time Price Chart

Integration with TradingView lightweight charts:

```typescript
// src/components/charts/PriceChart.tsx
import { useEffect, useRef } from 'react';
import { createChart, IChartApi } from 'lightweight-charts';
import { usePriceHistory } from '../../hooks/usePriceHistory';

export function PriceChart({ tokenPair }: { tokenPair: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi>();
  const { data: priceHistory } = usePriceHistory(tokenPair);

  useEffect(() => {
    if (!chartRef.current) return;

    chart.current = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 400,
      layout: {
        backgroundColor: '#ffffff',
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
    });

    const candlestickSeries = chart.current.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    if (priceHistory) {
      candlestickSeries.setData(priceHistory);
    }

    return () => {
      if (chart.current) {
        chart.current.remove();
      }
    };
  }, [priceHistory]);

  return <div ref={chartRef} className="w-full" />;
}
```

### Portfolio Overview

Track user's portfolio and trading performance:

```typescript
// src/components/portfolio/PortfolioOverview.tsx
import { usePortfolio } from '../../hooks/usePortfolio';
import { formatCurrency, formatPercent } from '../../utils/format';

export function PortfolioOverview() {
  const { portfolio, loading } = usePortfolio();

  if (loading) {
    return <div className="animate-pulse">Loading portfolio...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(portfolio.totalValue)}
        </p>
        <p className={`text-sm ${portfolio.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatPercent(portfolio.change24h)} (24h)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">P&L</h3>
        <p className={`text-2xl font-bold ${portfolio.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(portfolio.pnl)}
        </p>
        <p className="text-sm text-gray-500">All time</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Yield Earned</h3>
        <p className="text-2xl font-bold text-green-600">
          {formatCurrency(portfolio.yieldEarned)}
        </p>
        <p className="text-sm text-gray-500">From farming</p>
      </div>
    </div>
  );
}
```

## Custom Hooks

### Main SDK Hook

Central hook for managing Aldrin SDK instance:

```typescript
// src/hooks/useAldrinSDK.ts
import { useEffect, useState } from 'react';
import { TokenSwap } from '@aldrin_exchange/sdk';
import { useConnection } from '@solana/wallet-adapter-react';
import { EventEmitter } from 'events';

export function useAldrinSDK() {
  const { connection } = useConnection();
  const [tokenSwap, setTokenSwap] = useState<TokenSwap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeSDK() {
      try {
        setLoading(true);
        setError(null);

        // Create RPC event emitter for dynamic switching
        const rpcEventEmitter = new EventEmitter();
        
        // Setup RPC failover
        rpcEventEmitter.on('rpcUrlChangeError', (error, url) => {
          console.warn(`RPC ${url} failed, switching...`);
        });

        const sdk = await TokenSwap.initialize({
          connection,
          rpcEventEmitter
        });

        if (mounted) {
          setTokenSwap(sdk);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeSDK();

    return () => {
      mounted = false;
    };
  }, [connection]);

  return { tokenSwap, loading, error };
}
```

### Price Data Hook

Manage real-time price updates:

```typescript
// src/hooks/usePrices.ts
import { useQuery } from '@tanstack/react-query';
import { useAldrinSDK } from './useAldrinSDK';
import { PublicKey } from '@solana/web3.js';

export function usePrice(mintFrom: PublicKey, mintTo: PublicKey) {
  const { tokenSwap } = useAldrinSDK();

  return useQuery({
    queryKey: ['price', mintFrom.toBase58(), mintTo.toBase58()],
    queryFn: async () => {
      if (!tokenSwap) throw new Error('SDK not initialized');
      return tokenSwap.getPrice({ mintFrom, mintTo });
    },
    enabled: !!tokenSwap && !!mintFrom && !!mintTo,
    refetchInterval: 5000, // Update every 5 seconds
    staleTime: 3000, // Consider stale after 3 seconds
  });
}

export function usePriceWithImpact(
  mintFrom: PublicKey,
  mintTo: PublicKey,
  amount: string
) {
  const { tokenSwap } = useAldrinSDK();

  return useQuery({
    queryKey: ['priceImpact', mintFrom.toBase58(), mintTo.toBase58(), amount],
    queryFn: async () => {
      if (!tokenSwap) throw new Error('SDK not initialized');
      const amountBN = new BN(amount);
      return tokenSwap.getPriceWithImpact({ mintFrom, mintTo, amount: amountBN });
    },
    enabled: !!tokenSwap && !!mintFrom && !!mintTo && !!amount,
    staleTime: 1000,
  });
}
```

## State Management

### Trading Store

Zustand store for trading state:

```typescript
// src/stores/tradingStore.ts
import { create } from 'zustand';
import { PublicKey } from '@solana/web3.js';

interface TradingState {
  fromToken: Token | null;
  toToken: Token | null;
  amount: string;
  slippage: number;
  setFromToken: (token: Token | null) => void;
  setToToken: (token: Token | null) => void;
  setAmount: (amount: string) => void;
  setSlippage: (slippage: number) => void;
  swapTokens: () => void;
}

export const useTradingStore = create<TradingState>((set, get) => ({
  fromToken: null,
  toToken: null,
  amount: '',
  slippage: 0.01,
  
  setFromToken: (token) => set({ fromToken: token }),
  setToToken: (token) => set({ toToken: token }),
  setAmount: (amount) => set({ amount }),
  setSlippage: (slippage) => set({ slippage }),
  
  swapTokens: () => {
    const { fromToken, toToken } = get();
    set({ fromToken: toToken, toToken: fromToken });
  },
}));
```

## Deployment

### Build for Production

```bash
# Build the project
npm run build

# Preview the build
npm run preview

# Build with environment-specific config
npm run build:staging
npm run build:production
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Vercel Deployment

```json
{
  "name": "aldrin-trading-dashboard",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## Testing

### Unit Tests

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### E2E Tests

```bash
# Run Playwright tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

### Example Test

```typescript
// src/components/trading/SwapInterface.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SwapInterface } from './SwapInterface';
import { TestWrapper } from '../../test/TestWrapper';

describe('SwapInterface', () => {
  it('should render swap form', () => {
    render(
      <TestWrapper>
        <SwapInterface />
      </TestWrapper>
    );

    expect(screen.getByText('Swap Tokens')).toBeInTheDocument();
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });

  it('should handle token selection', async () => {
    render(
      <TestWrapper>
        <SwapInterface />
      </TestWrapper>
    );

    const fromTokenButton = screen.getByRole('button', { name: /select from token/i });
    fireEvent.click(fromTokenButton);

    // Mock token selection
    const usdcOption = await screen.findByText('USDC');
    fireEvent.click(usdcOption);

    expect(screen.getByDisplayValue('USDC')).toBeInTheDocument();
  });
});
```

## Performance Optimizations

- **React Query**: Efficient data fetching and caching
- **Virtual Scrolling**: Handle large token lists efficiently
- **Lazy Loading**: Code-split components and routes
- **Memoization**: Prevent unnecessary re-renders
- **Bundle Analysis**: Monitor and optimize bundle size

## Security Considerations

- **Private Key Safety**: Never store private keys in the app
- **Input Validation**: Validate all user inputs
- **RPC Security**: Use trusted RPC endpoints
- **Transaction Simulation**: Always simulate before execution
- **Error Handling**: Don't expose sensitive error details

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This example is licensed under the Apache License 2.0.