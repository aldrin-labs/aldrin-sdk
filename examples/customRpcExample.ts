import { Connection } from '@solana/web3.js';
import { TokenSwap } from '../src';

/**
 * Example showing how to use a custom RPC endpoint with the Aldrin SDK
 */

async function customRpcExample() {
  // Method 1: Using environment variable
  // Set SOLANA_RPC_ENDPOINT before running your application
  // export SOLANA_RPC_ENDPOINT="https://your-custom-rpc-endpoint.com"
  
  // Method 2: Using custom connection
  const customConnection = new Connection('https://your-custom-rpc-endpoint.com');
  
  // Initialize TokenSwap with custom connection
  const tokenSwap = await TokenSwap.initialize({ 
    connection: customConnection 
  });
  
  console.log('TokenSwap initialized with custom RPC endpoint');
  
  // Method 3: Default behavior (uses environment variable or fallback)
  const defaultTokenSwap = await TokenSwap.initialize();
  
  console.log('TokenSwap initialized with default/environment RPC endpoint');
}

// Example usage
if (require.main === module) {
  customRpcExample().catch(console.error);
}

export { customRpcExample };