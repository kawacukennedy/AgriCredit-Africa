import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    error: null,
  });

  const connect = async () => {
    if (!window.ethereum) {
      setState(prev => ({ ...prev, error: 'MetaMask not installed' }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      setState({
        address: accounts[0],
        isConnected: true,
        isConnecting: false,
        chainId: parseInt(chainId, 16),
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  };

  const disconnect = () => {
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      error: null,
    });
  };

  const switchNetwork = async (chainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        // Add network logic here
      }
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          window.ethereum.request({ method: 'eth_chainId' }).then((chainId: string) => {
            setState({
              address: accounts[0],
              isConnected: true,
              isConnecting: false,
              chainId: parseInt(chainId, 16),
              error: null,
            });
          });
        }
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setState(prev => ({ ...prev, address: accounts[0] }));
        } else {
          disconnect();
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        setState(prev => ({ ...prev, chainId: parseInt(chainId, 16) }));
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
  };
}