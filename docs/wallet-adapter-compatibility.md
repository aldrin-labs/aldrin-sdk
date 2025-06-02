# Wallet Adapter Compatibility

This document explains the changes made to support wallet adapter compatibility in the Aldrin SDK.

## Overview

The Aldrin SDK has been updated to support the Solana Wallet Adapter standard, making it easier to integrate with various wallet providers. The changes include:

1. Extended `Wallet` interface with optional WalletAdapter properties
2. Improved `wrapWallet` function to better handle different wallet implementations

## Extended Wallet Interface

The `Wallet` interface has been extended with optional properties that are part of the WalletAdapter standard:

```typescript
export interface Wallet {
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  publicKey: PublicKey;
  // Optional properties for WalletAdapter compatibility
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  connected?: boolean;
  sendTransaction?: (transaction: Transaction, connection: Connection) => Promise<string>;
}
```

These optional properties allow the Wallet interface to be compatible with the WalletAdapter standard while maintaining backward compatibility with existing code.

## Type Compatibility

The SDK now uses the standard `GetProgramAccountsFilter` type from @solana/web3.js, ensuring full compatibility with the Solana ecosystem. All type definitions are re-exported from the main web3.js package for consistency.

## Improved wrapWallet Function

The `wrapWallet` function has been improved to better handle different wallet implementations:

```typescript
export function wrapWallet(wallet: Wallet | BaseWallet): WalletAdapter {
  // If the wallet already has all the WalletAdapter properties, return it directly
  if (
    'connect' in wallet && 
    'disconnect' in wallet && 
    'connected' in wallet && 
    'sendTransaction' in wallet &&
    typeof wallet.connect === 'function' &&
    typeof wallet.disconnect === 'function' &&
    typeof wallet.sendTransaction === 'function'
  ) {
    return wallet as WalletAdapter;
  }
  
  // Create a WalletAdapter from the wallet, using any existing optional properties
  return {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction.bind(wallet),
    signAllTransactions: wallet.signAllTransactions.bind(wallet),
    connect: 'connect' in wallet && typeof wallet.connect === 'function' 
      ? wallet.connect.bind(wallet) 
      : async () => {},
    disconnect: 'disconnect' in wallet && typeof wallet.disconnect === 'function'
      ? wallet.disconnect.bind(wallet)
      : async () => {},
    connected: 'connected' in wallet && typeof wallet.connected === 'boolean'
      ? wallet.connected
      : wallet.publicKey !== null,
    sendTransaction: 'sendTransaction' in wallet && typeof wallet.sendTransaction === 'function'
      ? wallet.sendTransaction.bind(wallet)
      : async (transaction: Transaction, connection: Connection) => {
          const signed = await wallet.signTransaction(transaction);
          return connection.sendRawTransaction(signed.serialize());
        }
  };
}
```

This improved function checks if the wallet already has all the WalletAdapter properties and returns it directly if it does. Otherwise, it creates a WalletAdapter from the wallet, using any existing optional properties.

## Usage

When using the Aldrin SDK with a wallet, you can now pass either a basic Wallet or a WalletAdapter-compatible wallet:

```typescript
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
const poolClient = new PoolClient();
await poolClient.swap({
  pool,
  wallet, // or walletAdapter
  // other parameters...
});
```

The SDK will automatically handle the conversion between Wallet and WalletAdapter as needed.
