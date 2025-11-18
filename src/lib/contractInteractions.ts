// Contract interaction utilities for AgriCredit DApp

import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESSES,
  IDENTITY_REGISTRY_ABI,
  LOAN_MANAGER_ABI,
  MARKETPLACE_ESCROW_ABI,
  GOVERNANCE_DAO_ABI,
  CARBON_TOKEN_ABI,
  LIQUIDITY_POOL_ABI,
  YIELD_TOKEN_ABI,
  NFT_FARMING_ABI,
  AGRI_CREDIT_ABI,
  AI_PREDICTOR_ABI,
  DYNAMIC_NFT_ABI,
  CROSS_CHAIN_GOVERNANCE_ABI,
  ADVANCED_INSURANCE_ABI,
  YIELD_VAULT_ABI,
  DECENTRALIZED_ORACLE_ABI,
  PARAMETRIC_INSURANCE_ABI
} from './contracts';

export class ContractInteractions {
  private provider: ethers.BrowserProvider | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  private async getSigner(): Promise<ethers.Signer> {
    if (!this.provider) {
      throw new Error('Web3 provider not available. Please connect your wallet.');
    }
    return await this.provider.getSigner();
  }

  private async ensureConnection(): Promise<void> {
    if (!this.provider) {
      throw new Error('Web3 provider not available. Please connect your wallet.');
    }

    try {
      await this.provider.getNetwork();
    } catch (error) {
      throw new Error('Unable to connect to blockchain network. Please check your connection.');
    }
  }

  // Identity Registry Contract
  async getIdentityRegistryContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.IdentityRegistry, IDENTITY_REGISTRY_ABI, signer);
  }

  async createIdentity(did: string, userAddress: string) {
    const contract = await this.getIdentityRegistryContract();
    const tx = await contract.createIdentity(did, userAddress);
    return await tx.wait();
  }

  async getIdentity(userAddress: string) {
    const contract = await this.getIdentityRegistryContract();
    return await contract.getIdentity(userAddress);
  }

  async isIdentityVerified(userAddress: string): Promise<boolean> {
    const contract = await this.getIdentityRegistryContract();
    return await contract.isIdentityVerified(userAddress);
  }

  // Loan Manager Contract
  async getLoanManagerContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.LoanManager, LOAN_MANAGER_ABI, signer);
  }

  async createLoan(borrower: string, amount: string, interestRate: number, duration: number) {
    const contract = await this.getLoanManagerContract();
    const tx = await contract.createLoan(borrower, ethers.parseEther(amount), interestRate * 100, duration);
    return await tx.wait();
  }

  async repayLoan(loanId: number, amount: string) {
    const contract = await this.getLoanManagerContract();
    const tx = await contract.repayLoan(loanId, ethers.parseEther(amount));
    return await tx.wait();
  }

  async getLoan(loanId: number) {
    const contract = await this.getLoanManagerContract();
    return await contract.getLoan(loanId);
  }

  async getUserLoans(userAddress: string) {
    const contract = await this.getLoanManagerContract();
    return await contract.getUserLoans(userAddress);
  }

  async calculateTotalOwed(loanId: number) {
    const contract = await this.getLoanManagerContract();
    const total = await contract.calculateTotalOwed(loanId);
    return ethers.formatEther(total);
  }

  // Marketplace Escrow Contract
  async getMarketplaceEscrowContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.MarketplaceEscrow, MARKETPLACE_ESCROW_ABI, signer);
  }

  async createEscrow(seller: string, amount: string, tokenAddress: string) {
    const contract = await this.getMarketplaceEscrowContract();
    const tx = await contract.createEscrow(seller, ethers.parseEther(amount), tokenAddress);
    return await tx.wait();
  }

  async fundEscrow(escrowId: number) {
    const contract = await this.getMarketplaceEscrowContract();
    const tx = await contract.fundEscrow(escrowId);
    return await tx.wait();
  }

  async confirmDelivery(escrowId: number, proof: string) {
    const contract = await this.getMarketplaceEscrowContract();
    const tx = await contract.confirmDelivery(escrowId, proof);
    return await tx.wait();
  }

  async completeEscrow(escrowId: number) {
    const contract = await this.getMarketplaceEscrowContract();
    const tx = await contract.completeEscrow(escrowId);
    return await tx.wait();
  }

  // Governance DAO Contract
  async getGovernanceDAOContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.GovernanceDAO, GOVERNANCE_DAO_ABI, signer);
  }

  async propose(targets: string[], values: string[], calldatas: string[], description: string) {
    const contract = await this.getGovernanceDAOContract();
    const tx = await contract.propose(targets, values.map(v => ethers.parseEther(v)), calldatas, description);
    return await tx.wait();
  }

  async vote(proposalId: number, support: boolean) {
    const contract = await this.getGovernanceDAOContract();
    const tx = await contract.vote(proposalId, support);
    return await tx.wait();
  }

  async executeProposal(proposalId: number) {
    const contract = await this.getGovernanceDAOContract();
    const tx = await contract.executeProposal(proposalId);
    return await tx.wait();
  }

  async getProposal(proposalId: number) {
    const contract = await this.getGovernanceDAOContract();
    return await contract.getProposal(proposalId);
  }

  async getVotes(account: string) {
    const contract = await this.getGovernanceDAOContract();
    const votes = await contract.getVotes(account);
    return ethers.formatEther(votes);
  }

  async lockTokens(amount: string, duration: number) {
    const contract = await this.getGovernanceDAOContract();
    const tx = await contract.lockTokens(ethers.parseEther(amount), duration);
    return await tx.wait();
  }

  async getTokenLocks(account: string) {
    const contract = await this.getGovernanceDAOContract();
    return await contract.getTokenLocks(account);
  }

  // Carbon Token Contract
  async getCarbonTokenContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.CarbonToken, CARBON_TOKEN_ABI, signer);
  }

  async mintCarbonCredit(farmer: string, co2Amount: string, methodology: string, location: string, aiConfidence: number, aiProof: string) {
    const contract = await this.getCarbonTokenContract();
    const tx = await contract.mintCarbonCredit(farmer, ethers.parseEther(co2Amount), methodology, location, aiConfidence, aiProof);
    return await tx.wait();
  }

  async retireCarbonCredits(creditId: number) {
    const contract = await this.getCarbonTokenContract();
    const tx = await contract.retireCarbonCredits(creditId);
    return await tx.wait();
  }

  async burnCarbonTokens(amount: string) {
    const contract = await this.getCarbonTokenContract();
    const tx = await contract.burnCarbonTokens(ethers.parseEther(amount));
    return await tx.wait();
  }

  async stakeTokens(amount: string) {
    const contract = await this.getCarbonTokenContract();
    const tx = await contract.stakeTokens(ethers.parseEther(amount));
    return await tx.wait();
  }

  async unstakeTokens(amount: string) {
    const contract = await this.getCarbonTokenContract();
    const tx = await contract.unstakeTokens(ethers.parseEther(amount));
    return await tx.wait();
  }

  async claimStakingRewards() {
    const contract = await this.getCarbonTokenContract();
    const tx = await contract.claimRewards();
    return await tx.wait();
  }

  async getStakingInfo(userAddress: string) {
    const contract = await this.getCarbonTokenContract();
    return await contract.getStakingInfo(userAddress);
  }

  async initiateBridge(amount: string, targetChainId: number, targetContract: string) {
    const contract = await this.getCarbonTokenContract();
    const tx = await contract.initiateBridge(ethers.parseEther(amount), targetChainId, targetContract);
    return await tx.wait();
  }

  async approveBridgeRequest(bridgeId: number) {
    const contract = await this.getCarbonTokenContract();
    const tx = await contract.approveBridgeRequest(bridgeId);
    return await tx.wait();
  }

  async getBridgeValidators() {
    const contract = await this.getCarbonTokenContract();
    return await contract.getBridgeValidators();
  }

  // Carbon Marketplace functions using MarketplaceEscrow
  async listCarbonTokens(amount: string, price: string) {
    // First approve the marketplace escrow to transfer tokens
    const carbonContract = await this.getCarbonTokenContract();
    const escrowAddress = CONTRACT_ADDRESSES.MarketplaceEscrow;

    // Approve escrow contract to transfer tokens
    const approveTx = await carbonContract.approve(escrowAddress, ethers.parseEther(amount));
    await approveTx.wait();

    // Create escrow listing
    const escrowContract = await this.getMarketplaceEscrowContract();
    const signer = await this.getSigner();
    const tx = await escrowContract.createEscrow(
      await signer.getAddress(),
      ethers.parseEther(amount),
      CONTRACT_ADDRESSES.CarbonToken
    );
    return await tx.wait();
  }

  async buyCarbonTokens(escrowId: number, amount: string) {
    const escrowContract = await this.getMarketplaceEscrowContract();
    const tx = await escrowContract.fundEscrow(escrowId);
    return await tx.wait();
  }

  async getCarbonListings() {
    // This would require events or a separate marketplace contract
    // For now, return mock data structure
    return [];
  }

  // Liquidity Pool Contract
  async getLiquidityPoolContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.LiquidityPool, LIQUIDITY_POOL_ABI, signer);
  }

  async addLiquidity(tokenAddress: string, amount: string) {
    const contract = await this.getLiquidityPoolContract();
    const tx = await contract.addLiquidity(tokenAddress, ethers.parseEther(amount));
    return await tx.wait();
  }

  async removeLiquidity(tokenAddress: string, amount: string) {
    const contract = await this.getLiquidityPoolContract();
    const tx = await contract.removeLiquidity(tokenAddress, ethers.parseEther(amount));
    return await tx.wait();
  }

  async getPoolInfo(tokenAddress: string) {
    const contract = await this.getLiquidityPoolContract();
    return await contract.getPoolInfo(tokenAddress);
  }

  // Yield Token Contract
  async getYieldTokenContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.YieldToken, YIELD_TOKEN_ABI, signer);
  }

  async deposit(amount: string) {
    await this.ensureConnection();
    try {
      const contract = await this.getYieldTokenContract();
      const tx = await contract.deposit(ethers.parseEther(amount));
      return await tx.wait();
    } catch (error) {
      console.error('Deposit failed:', error);
      throw new Error('Failed to deposit tokens. Please try again.');
    }
  }

  async withdraw(amount: string) {
    const contract = await this.getYieldTokenContract();
    const tx = await contract.withdraw(ethers.parseEther(amount));
    return await tx.wait();
  }

  async claimYield() {
    await this.ensureConnection();
    try {
      const contract = await this.getYieldTokenContract();
      const tx = await contract.claimYield();
      return await tx.wait();
    } catch (error) {
      console.error('Claim yield failed:', error);
      throw new Error('Failed to claim yield. Please try again.');
    }
  }

  async getPosition(userAddress: string) {
    await this.ensureConnection();
    try {
      const contract = await this.getYieldTokenContract();
      return await contract.getPosition(userAddress);
    } catch (error) {
      console.error('Get position failed:', error);
      // Return mock data as fallback
      return {
        amount: BigInt('0'),
        depositTime: BigInt(Math.floor(Date.now() / 1000)),
        lastClaimTime: BigInt(Math.floor(Date.now() / 1000)),
        pendingYield: BigInt('0'),
        totalAccumulated: BigInt('0')
      };
    }
  }

  // NFT Farming Contract
  async getNFTFarmingContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.NFTFarming, NFT_FARMING_ABI, signer);
  }

  async mintFarmNFT(farmer: string, farmName: string, location: string, size: number, cropType: string, expectedYield: number, metadataURI: string, initialSupplyChainData: string = "") {
    const contract = await this.getNFTFarmingContract();
    const tx = await contract.mintFarmNFT(farmer, farmName, location, size, cropType, expectedYield, metadataURI, initialSupplyChainData);
    return await tx.wait();
  }

  async recordHarvest(tokenId: number, actualYield: number, harvestProof: string = "") {
    const contract = await this.getNFTFarmingContract();
    const tx = await contract.recordHarvest(tokenId, actualYield, harvestProof);
    return await tx.wait();
  }

  async stakeNFT(tokenId: number) {
    const contract = await this.getNFTFarmingContract();
    const tx = await contract.stakeNFT(tokenId);
    return await tx.wait();
  }

  async unstakeNFT(tokenId: number) {
    const contract = await this.getNFTFarmingContract();
    const tx = await contract.unstakeNFT(tokenId);
    return await tx.wait();
  }

  async claimStakingRewards() {
    const contract = await this.getNFTFarmingContract();
    const tx = await contract.claimStakingRewards();
    return await tx.wait();
  }

  async getStakingInfo(staker: string) {
    const contract = await this.getNFTFarmingContract();
    return await contract.getStakingInfo(staker);
  }

  async initiateCrossChainTransfer(tokenId: number, to: string, destinationChain: string) {
    const contract = await this.getNFTFarmingContract();
    const tx = await contract.initiateCrossChainTransfer(tokenId, to, destinationChain);
    return await tx.wait();
  }

  async approveCrossChainTransfer(tokenId: number, recipient: string) {
    const contract = await this.getNFTFarmingContract();
    const tx = await contract.approveCrossChainTransfer(tokenId, recipient);
    return await tx.wait();
  }

  async getFarmNFT(tokenId: number) {
    const contract = await this.getNFTFarmingContract();
    return await contract.getFarmNFT(tokenId);
  }

  async getFarmerNFTs(farmer: string) {
    const contract = await this.getNFTFarmingContract();
    return await contract.getFarmerNFTs(farmer);
  }

  // Chainlink Oracle Integration
  async getPriceFeed(priceFeedAddress: string) {
    // Simplified Chainlink price feed integration
    await this.ensureConnection();
    try {
      // This is a placeholder for Chainlink price feed integration
      // In a real implementation, you would:
      // 1. Use Chainlink price feed contracts
      // 2. Call latestRoundData() to get price data

      // Mock price feeds for common agricultural commodities
      const mockPrices: { [key: string]: number } = {
        '0x1234567890123456789012345678901234567890': 1850.50, // Corn price per bushel
        '0x2345678901234567890123456789012345678901': 420.75,  // Wheat price per bushel
        '0x3456789012345678901234567890123456789012': 1250.25, // Soybean price per bushel
        '0x4567890123456789012345678901234567890123': 0.85,    // USD/NGN exchange rate
        '0x5678901234567890123456789012345678901234': 1.08     // EUR/USD exchange rate
      };

      const price = mockPrices[priceFeedAddress] || 1000 + Math.random() * 100;

      return {
        price: price,
        timestamp: Math.floor(Date.now() / 1000),
        roundId: Math.floor(Math.random() * 1000000)
      };
    } catch (error) {
      console.error('Price feed fetch failed:', error);
      throw new Error('Failed to fetch price data from oracle.');
    }
  }

  async getWeatherData(location: string) {
    // Simplified weather oracle integration
    await this.ensureConnection();
    try {
      // This is a placeholder for weather oracle integration
      // In a real implementation, you would:
      // 1. Use Chainlink Functions or external APIs
      // 2. Fetch weather data for agricultural planning

      // Mock weather data
      return {
        location: location,
        temperature: 24 + Math.random() * 10, // 24-34°C
        humidity: 50 + Math.random() * 30,    // 50-80%
        rainfall: Math.random() * 20,         // 0-20mm
        windSpeed: Math.random() * 15,        // 0-15 km/h
        timestamp: Math.floor(Date.now() / 1000)
      };
    } catch (error) {
      console.error('Weather data fetch failed:', error);
      throw new Error('Failed to fetch weather data from oracle.');
    }
  }

  async getCropYieldData(cropType: string, region: string) {
    // Simplified agricultural data oracle
    await this.ensureConnection();
    try {
      // This is a placeholder for agricultural data oracle
      // In a real implementation, you would:
      // 1. Use specialized agricultural oracles
      // 2. Fetch yield data, pest alerts, etc.

      // Mock crop yield data
      const baseYields: { [key: string]: number } = {
        'corn': 8.5,
        'wheat': 3.2,
        'rice': 6.8,
        'soybean': 3.8,
        'cassava': 25.0
      };

      const baseYield = baseYields[cropType.toLowerCase()] || 5.0;
      const actualYield = baseYield * (0.8 + Math.random() * 0.4); // ±20% variation

      return {
        cropType: cropType,
        region: region,
        averageYield: baseYield,
        predictedYield: actualYield,
        unit: 'tons/hectare',
        confidence: 0.85,
        timestamp: Math.floor(Date.now() / 1000)
      };
    } catch (error) {
      console.error('Crop yield data fetch failed:', error);
      throw new Error('Failed to fetch crop yield data from oracle.');
    }
  }

  // DeFi Integrations
  async swapTokens(
    fromToken: string,
    toToken: string,
    amount: string,
    minAmountOut: string,
    deadline: number = Math.floor(Date.now() / 1000) + 3600
  ) {
    // Simplified Uniswap-like swap (would need actual DEX contract)
    await this.ensureConnection();
    try {
      // This is a placeholder for DEX integration
      // In a real implementation, you would:
      // 1. Approve the DEX router to spend tokens
      // 2. Call swapExactTokensForTokens on Uniswap V3 router

      console.log(`Swapping ${amount} ${fromToken} to ${toToken} with min output ${minAmountOut}`);

      // Mock implementation - in reality would interact with DEX
      return {
        success: true,
        txHash: "0x" + Math.random().toString(16).substr(2, 64),
        amountOut: minAmountOut
      };
    } catch (error) {
      console.error('Token swap failed:', error);
      throw new Error('Failed to execute token swap. Please try again.');
    }
  }

  async provideLiquidity(
    tokenA: string,
    tokenB: string,
    amountA: string,
    amountB: string,
    slippage: number = 0.5
  ) {
    // Simplified liquidity provision (would need actual AMM contract)
    await this.ensureConnection();
    try {
      // This is a placeholder for AMM liquidity provision
      // In a real implementation, you would:
      // 1. Approve tokens to the AMM contract
      // 2. Call addLiquidity on the AMM contract

      console.log(`Providing liquidity: ${amountA} ${tokenA} + ${amountB} ${tokenB}`);

      // Mock implementation
      return {
        success: true,
        txHash: "0x" + Math.random().toString(16).substr(2, 64),
        lpTokens: "1000" // Mock LP tokens received
      };
    } catch (error) {
      console.error('Liquidity provision failed:', error);
      throw new Error('Failed to provide liquidity. Please try again.');
    }
  }

  async stakeTokens(
    tokenAddress: string,
    amount: string,
    lockPeriod: number = 30 // days
  ) {
    // Simplified staking (would need actual staking contract)
    await this.ensureConnection();
    try {
      // This is a placeholder for staking functionality
      // In a real implementation, you would:
      // 1. Approve tokens to the staking contract
      // 2. Call stake function with lock period

      console.log(`Staking ${amount} tokens for ${lockPeriod} days`);

      // Mock implementation
      return {
        success: true,
        txHash: "0x" + Math.random().toString(16).substr(2, 64),
        stakingId: Math.floor(Math.random() * 10000),
        apy: "12.5" // Mock APY
      };
    } catch (error) {
      console.error('Staking failed:', error);
      throw new Error('Failed to stake tokens. Please try again.');
    }
  }

  async lendTokens(
    tokenAddress: string,
    amount: string,
    interestRate: number = 8 // 8% APY
  ) {
    // Simplified lending (Aave-like functionality)
    await this.ensureConnection();
    try {
      // This is a placeholder for lending protocol integration
      // In a real implementation, you would:
      // 1. Approve tokens to the lending contract
      // 2. Call deposit function

      console.log(`Lending ${amount} tokens at ${interestRate}% APY`);

      // Mock implementation
      return {
        success: true,
        txHash: "0x" + Math.random().toString(16).substr(2, 64),
        lendingId: Math.floor(Math.random() * 10000),
        interestEarned: "0" // Will accumulate over time
      };
    } catch (error) {
      console.error('Lending failed:', error);
      throw new Error('Failed to lend tokens. Please try again.');
    }
  }

  async borrowTokens(
    tokenAddress: string,
    amount: string,
    collateralToken: string,
    collateralAmount: string
  ) {
    // Simplified borrowing (Aave-like functionality)
    await this.ensureConnection();
    try {
      // This is a placeholder for borrowing from lending protocol
      // In a real implementation, you would:
      // 1. Approve collateral to the lending contract
      // 2. Call borrow function

      console.log(`Borrowing ${amount} tokens with ${collateralAmount} ${collateralToken} collateral`);

      // Mock implementation
      return {
        success: true,
        txHash: "0x" + Math.random().toString(16).substr(2, 64),
        loanId: Math.floor(Math.random() * 10000),
        interestRate: "8.5",
        liquidationPrice: "0.85" // Mock liquidation price
      };
    } catch (error) {
      console.error('Borrowing failed:', error);
      throw new Error('Failed to borrow tokens. Please try again.');
    }
  }

  // AgriCredit Token Contract
  async getAgriCreditContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.AgriCredit, AGRI_CREDIT_ABI, signer);
  }

  async getAgriCreditBalance(address: string) {
    const contract = await this.getAgriCreditContract();
    const balance = await contract.balanceOf(address);
    return ethers.formatEther(balance);
  }

  async transferAgriCredit(to: string, amount: string) {
    const contract = await this.getAgriCreditContract();
    const tx = await contract.transfer(to, ethers.parseEther(amount));
    return await tx.wait();
  }

  // ============ NEW ENHANCED CONTRACTS ============

  // AI Predictor Contract
  async getAIPredictorContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.AIPredictor, AI_PREDICTOR_ABI, signer);
  }

  async predictCreditScore(userAddress: string, userData: string) {
    const contract = await this.getAIPredictorContract();
    const tx = await contract.predictCreditScore(userAddress, ethers.toUtf8Bytes(userData), { value: ethers.parseEther("0.01") });
    return await tx.wait();
  }

  async predictYield(farmSize: number, cropType: string, location: string, plantingDate: number) {
    const contract = await this.getAIPredictorContract();
    const tx = await contract.predictYield(farmSize, cropType, location, plantingDate, { value: ethers.parseEther("0.01") });
    return await tx.wait();
  }

  async getRiskProfile(userAddress: string) {
    const contract = await this.getAIPredictorContract();
    return await contract.getRiskProfile(userAddress);
  }

  // Dynamic NFT Contract
  async getDynamicNFTContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.DynamicNFT, DYNAMIC_NFT_ABI, signer);
  }

  async mintDynamicNFT(to: string, baseURI: string, initialYield: number, cropType: string) {
    const contract = await this.getDynamicNFTContract();
    const tx = await contract.mintDynamicNFT(to, baseURI, initialYield, cropType);
    return await tx.wait();
  }

  async updateNFTAttributes(tokenId: number) {
    const contract = await this.getDynamicNFTContract();
    const tx = await contract.updateNFTAttributes(tokenId);
    return await tx.wait();
  }

  async evolveNFT(tokenId: number) {
    const contract = await this.getDynamicNFTContract();
    const tx = await contract.evolveNFT(tokenId);
    return await tx.wait();
  }

  async getNFTAttributes(tokenId: number) {
    const contract = await this.getDynamicNFTContract();
    return await contract.getNFTAttributes(tokenId);
  }

  // Cross-Chain Governance Contract
  async getCrossChainGovernanceContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.CrossChainGovernance, CROSS_CHAIN_GOVERNANCE_ABI, signer);
  }

  async createCrossChainProposal(description: string, callData: string, targetContract: string, value: string) {
    const contract = await this.getCrossChainGovernanceContract();
    const tx = await contract.createCrossChainProposal(description, callData, targetContract, ethers.parseEther(value));
    return await tx.wait();
  }

  async submitCrossChainVote(message: any) {
    const contract = await this.getCrossChainGovernanceContract();
    const tx = await contract.submitCrossChainVote(message);
    return await tx.wait();
  }

  // Advanced Insurance Contract
  async getAdvancedInsuranceContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.AdvancedInsurance, ADVANCED_INSURANCE_ABI, signer);
  }

  async createCatastropheBond(catastropheType: string, region: string, coverageAmount: string, premium: string, triggerThreshold: number, maturityDays: number) {
    const contract = await this.getAdvancedInsuranceContract();
    const tx = await contract.createCatastropheBond(catastropheType, region, ethers.parseEther(coverageAmount), ethers.parseEther(premium), triggerThreshold, maturityDays);
    return await tx.wait();
  }

  async investInCatastropheBond(bondId: number, amount: string) {
    const contract = await this.getAdvancedInsuranceContract();
    const tx = await contract.investInCatastropheBond(bondId, ethers.parseEther(amount));
    return await tx.wait();
  }

  async createParametricOption(underlyingAsset: string, strikePrice: number, premium: string, notionalAmount: string, isCall: boolean, expirationDays: number) {
    const contract = await this.getAdvancedInsuranceContract();
    const tx = await contract.createParametricOption(underlyingAsset, strikePrice, ethers.parseEther(premium), ethers.parseEther(notionalAmount), isCall, expirationDays);
    return await tx.wait();
  }

  // Yield Vault Contract
  async getYieldVaultContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.YieldVault, YIELD_VAULT_ABI, signer);
  }

  async createYieldStrategy(name: string, description: string, allocationPercentages: number[], protocols: string[], minDeposit: string, lockPeriod: number, apy: number) {
    const contract = await this.getYieldVaultContract();
    const tx = await contract.createStrategy(name, description, allocationPercentages, protocols, ethers.parseEther(minDeposit), lockPeriod, apy);
    return await tx.wait();
  }

  async depositToYieldVault(strategyId: number, amount: string, autoCompound: boolean) {
    const contract = await this.getYieldVaultContract();
    const tx = await contract.deposit(strategyId, ethers.parseEther(amount), autoCompound);
    return await tx.wait();
  }

  async claimYieldVaultRewards(strategyId: number) {
    const contract = await this.getYieldVaultContract();
    const tx = await contract.claimRewards(strategyId);
    return await tx.wait();
  }

  async getYieldVaultPosition(strategyId: number, userAddress: string) {
    const contract = await this.getYieldVaultContract();
    return await contract.getUserPosition(strategyId, userAddress);
  }

  // Decentralized Oracle Contract
  async getDecentralizedOracleContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.DecentralizedOracle, DECENTRALIZED_ORACLE_ABI, signer);
  }

  async registerOracleNode() {
    const contract = await this.getDecentralizedOracleContract();
    const tx = await contract.registerOracleNode({ value: ethers.parseEther("1000") });
    return await tx.wait();
  }

  async submitOracleData(dataType: number, location: string, parameters: string, value: number, confidence: number) {
    const contract = await this.getDecentralizedOracleContract();
    const tx = await contract.submitData(dataType, location, parameters, value, confidence);
    return await tx.wait();
  }

  async getOracleData(dataType: number, location: string, parameters: string) {
    const contract = await this.getDecentralizedOracleContract();
    return await contract.getLatestData(dataType, location, parameters);
  }

  // Parametric Insurance Contract
  async getParametricInsuranceContract() {
    if (!this.provider) throw new Error('Provider not available');
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESSES.ParametricInsurance, PARAMETRIC_INSURANCE_ABI, signer);
  }

  async createParametricPolicy(riskType: string, coverageAmount: string, premium: string, triggerValue: number, expiryDate: number) {
    const contract = await this.getParametricInsuranceContract();
    const tx = await contract.createPolicy(riskType, ethers.parseEther(coverageAmount), ethers.parseEther(premium), triggerValue, expiryDate);
    return await tx.wait();
  }

  async triggerInsurancePayout(policyId: number) {
    const contract = await this.getParametricInsuranceContract();
    const tx = await contract.triggerPayout(policyId);
    return await tx.wait();
  }
}

// Export singleton instance
export const contractInteractions = new ContractInteractions();