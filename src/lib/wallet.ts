import { ethers } from 'ethers';

export interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

export class WalletManager {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connectWallet(): Promise<WalletState> {
    if (!window.ethereum) {
      throw new Error('MetaMask or compatible wallet not found');
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();

      return {
        address,
        balance: ethers.formatEther(balance),
        chainId: Number(network.chainId),
        isConnected: true,
        provider: this.provider,
        signer: this.signer
      };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.signer = null;
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (!window.ethereum) throw new Error('No wallet found');

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        await this.addNetwork(chainId);
      } else {
        throw error;
      }
    }
  }

  private async addNetwork(chainId: number): Promise<void> {
    const networks: { [key: number]: any } = {
      137: {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/']
      },
      42220: {
        chainId: '0xa4ec',
        chainName: 'Celo Mainnet',
        nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
        rpcUrls: ['https://forno.celo.org'],
        blockExplorerUrls: ['https://explorer.celo.org/']
      },
      56: {
        chainId: '0x38',
        chainName: 'BNB Smart Chain',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        blockExplorerUrls: ['https://bscscan.com/']
      }
    };

    const network = networks[chainId];
    if (!network) throw new Error('Network not supported');

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [network],
    });
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }

  async getContract(address: string, abi: any[]): Promise<ethers.Contract> {
    if (!this.provider || !this.signer) {
      throw new Error('Wallet not connected');
    }
    return new ethers.Contract(address, abi, this.signer);
  }
}

// Global wallet manager instance
export const walletManager = new WalletManager();

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}