'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/store/hooks';
import { loginStart, loginSuccess, loginFailure } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const connectWallet = async () => {
    setIsConnecting(true);
    dispatch(loginStart());

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];

      // Sign a message for authentication
      const message = `Sign this message to authenticate with AgriCredit: ${Date.now()}`;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account],
      });

      // Mock user data - in real app, this would come from backend
      const user = {
        id: '1',
        walletAddress: account,
        did: `did:ethr:${account}`,
        name: 'John Farmer',
        role: 'farmer' as const,
        profileComplete: true,
      };

      dispatch(loginSuccess({ user, token: 'mock-jwt-token' }));
    } catch (error) {
      console.error('Wallet connection failed:', error);
      dispatch(loginFailure('Failed to connect wallet'));
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-agri-green hover:bg-agri-green/90"
    >
      {isConnecting ? 'Connecting...' : t('auth.connectWallet')}
    </Button>
  );
}