'use client';

import { useState, useEffect, useCallback } from 'react';
import { walletManager, WalletState } from '@/lib/wallet';

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    isConnected: false,
    provider: null,
    signer: null
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const state = await walletManager.connectWallet();
      setWalletState(state);

      // Listen for account changes
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    await walletManager.disconnectWallet();
    setWalletState({
      address: null,
      balance: null,
      chainId: null,
      isConnected: false,
      provider: null,
      signer: null
    });

    // Remove listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
  }, []);

  const switchNetwork = useCallback(async (chainId: number) => {
    try {
      await walletManager.switchNetwork(chainId);
      // Chain change will trigger handleChainChanged
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      // Reconnect with new account
      connectWallet();
    }
  }, [connectWallet, disconnectWallet]);

  const handleChainChanged = useCallback(() => {
    // Reload the page to avoid state inconsistencies
    window.location.reload();
  }, []);

  // Check if wallet was previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (err) {
          console.error('Failed to check wallet connection:', err);
        }
      }
    };

    checkConnection();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [connectWallet, handleAccountsChanged, handleChainChanged]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isConnecting,
    error
  };
}