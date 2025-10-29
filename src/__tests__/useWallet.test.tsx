import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    BrowserProvider: jest.fn(),
    JsonRpcSigner: jest.fn(),
    formatEther: jest.fn(),
  },
}));

// Mock window.ethereum
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true,
});

describe('useWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.balance).toBeNull();
  });

  it('should handle wallet connection', async () => {
    mockEthereum.request
      .mockResolvedValueOnce(['0x1234567890123456789012345678901234567890'])
      .mockResolvedValueOnce('0x1');

    const mockProvider = {
      getSigner: jest.fn().mockResolvedValue({
        getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      }),
      getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
    };

    ethers.BrowserProvider.mockImplementation(() => mockProvider);

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connectWallet();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.address).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should handle connection errors', async () => {
    mockEthereum.request.mockRejectedValue(new Error('User rejected request'));

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connectWallet();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe('User rejected request');
  });
});