import '@testing-library/jest-dom';

// Mock hardhat runtime environment for tests
global.hre = {
  ethers: {
    getContractFactory: jest.fn(),
    getSigners: jest.fn(),
  },
};

// Mock ethers for contract tests
jest.mock('hardhat', () => ({
  ethers: {
    getContractFactory: jest.fn(),
    getSigners: jest.fn(),
  },
}));

// Mock environment variables
process.env.NODE_ENV = 'test';