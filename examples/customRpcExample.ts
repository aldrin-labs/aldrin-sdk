import { Connection } from '@solana/web3.js';
import { EventEmitter } from 'events';
import { TokenSwap } from '../src';

/**
 * Example showing how to use dynamic RPC endpoint switching with the Aldrin SDK
 */

async function customRpcExample() {
  // Method 1: Using environment variable
  // Set SOLANA_RPC_ENDPOINT before running your application
  // export SOLANA_RPC_ENDPOINT="https://your-custom-rpc-endpoint.com"
  
  // Method 2: Using custom connection
  const customConnection = new Connection('https://your-custom-rpc-endpoint.com');
  
  // Initialize TokenSwap with custom connection
  await TokenSwap.initialize({ 
    connection: customConnection, 
  });
  
  console.log('TokenSwap initialized with custom RPC endpoint');
  
  // Method 3: Default behavior (uses environment variable or fallback)
  await TokenSwap.initialize();
  
  console.log('TokenSwap initialized with default/environment RPC endpoint');
}

/**
 * Example showing dynamic RPC endpoint switching using events
 */
async function dynamicRpcExample() {
  // Create an EventEmitter for RPC URL changes
  const rpcEventEmitter = new EventEmitter();
  
  // Initialize TokenSwap with event emitter for dynamic RPC switching
  const tokenSwap = await TokenSwap.initialize({
    rpcEventEmitter: rpcEventEmitter,
  });
  
  console.log('TokenSwap initialized with event-driven RPC switching');
  
  // Listen for successful RPC URL changes
  rpcEventEmitter.on('rpcUrlChangeSuccess', (newUrl) => {
    console.log(`Successfully switched to RPC endpoint: ${newUrl}`);
  });
  
  // Listen for RPC URL change errors
  rpcEventEmitter.on('rpcUrlChangeError', (error, attemptedUrl) => {
    console.error(`Failed to switch to RPC endpoint ${attemptedUrl}:`, error);
  });
  
  // Simulate switching to different RPC endpoints
  console.log('Switching to Helius RPC...');
  rpcEventEmitter.emit('rpcUrlChange', 'https://your-helius-endpoint.com');
  
  // Wait a bit before next switch
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('Switching to QuickNode RPC...');
  rpcEventEmitter.emit('rpcUrlChange', 'https://your-quicknode-endpoint.com');
  
  // Wait a bit before next switch
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('Switching back to default RPC...');
  rpcEventEmitter.emit('rpcUrlChange', 'https://api.mainnet-beta.solana.com');
  
  return tokenSwap;
}

// Example usage
if (require.main === module) {
  customRpcExample()
    .then(() => dynamicRpcExample())
    .catch(console.error);
}

export { customRpcExample, dynamicRpcExample };
