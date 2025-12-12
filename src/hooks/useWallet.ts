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
      setState(prev => ({ ...prev, error: 'No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.' }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check if the wallet is unlocked and accessible
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

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
      console.warn('Wallet connection error:', error);

      let errorMessage = 'Failed to connect wallet';
      if (error.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (error.code === -32002) {
        errorMessage = 'Connection request already pending';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
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
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            setState({
              address: accounts[0],
              isConnected: true,
              isConnecting: false,
              chainId: parseInt(chainId, 16),
              error: null,
            });
          }
        } catch (error) {
          console.warn('Error checking wallet connection:', error);
        }

        // Listen for account changes
        const handleAccountsChanged = (accounts: string[]) => {
          if (accounts.length > 0) {
            setState(prev => ({ ...prev, address: accounts[0], isConnected: true }));
          } else {
            disconnect();
          }
        };

        // Listen for chain changes
        const handleChainChanged = (chainId: string) => {
          setState(prev => ({ ...prev, chainId: parseInt(chainId, 16) }));
        };

        // Listen for disconnection
        const handleDisconnect = () => {
          disconnect();
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
        window.ethereum.on('disconnect', handleDisconnect);

        return () => {
          if (window.ethereum) {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
            window.ethereum.removeListener('disconnect', handleDisconnect);
          }
        };
      }
    };

    checkConnection();
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
  };
}