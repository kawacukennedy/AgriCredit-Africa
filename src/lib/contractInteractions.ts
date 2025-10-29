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
  AGRI_CREDIT_ABI
} from './contracts';

export class ContractInteractions {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
    }
  }

  // Identity Registry Contract
  getIdentityRegistryContract() {
    if (!this.provider) throw new Error('Provider not available');
    return new ethers.Contract(CONTRACT_ADDRESSES.IdentityRegistry, IDENTITY_REGISTRY_ABI, this.signer || this.provider);
  }

  async createIdentity(did: string, userAddress: string) {
    const contract = this.getIdentityRegistryContract();
    const tx = await contract.createIdentity(did, userAddress);
    return await tx.wait();
  }

  async getIdentity(userAddress: string) {
    const contract = this.getIdentityRegistryContract();
    return await contract.getIdentity(userAddress);
  }

  async isIdentityVerified(userAddress: string): Promise<boolean> {
    const contract = this.getIdentityRegistryContract();
    return await contract.isIdentityVerified(userAddress);
  }

  // Loan Manager Contract
  getLoanManagerContract() {
    if (!this.provider) throw new Error('Provider not available');
    return new ethers.Contract(CONTRACT_ADDRESSES.LoanManager, LOAN_MANAGER_ABI, this.signer || this.provider);
  }

  async createLoan(borrower: string, amount: string, interestRate: number, duration: number) {
    const contract = this.getLoanManagerContract();
    const tx = await contract.createLoan(borrower, ethers.utils.parseEther(amount), interestRate * 100, duration);
    return await tx.wait();
  }

  async repayLoan(loanId: number, amount: string) {
    const contract = this.getLoanManagerContract();
    const tx = await contract.repayLoan(loanId, ethers.utils.parseEther(amount));
    return await tx.wait();
  }

  async getLoan(loanId: number) {
    const contract = this.getLoanManagerContract();
    return await contract.getLoan(loanId);
  }

  async getUserLoans(userAddress: string) {
    const contract = this.getLoanManagerContract();
    return await contract.getUserLoans(userAddress);
  }

  async calculateTotalOwed(loanId: number) {
    const contract = this.getLoanManagerContract();
    const total = await contract.calculateTotalOwed(loanId);
    return ethers.utils.formatEther(total);
  }

  // Marketplace Escrow Contract
  getMarketplaceEscrowContract() {
    if (!this.provider) throw new Error('Provider not available');
    return new ethers.Contract(CONTRACT_ADDRESSES.MarketplaceEscrow, MARKETPLACE_ESCROW_ABI, this.signer || this.provider);
  }

  async createEscrow(seller: string, amount: string, tokenAddress: string) {
    const contract = this.getMarketplaceEscrowContract();
    const tx = await contract.createEscrow(seller, ethers.utils.parseEther(amount), tokenAddress);
    return await tx.wait();
  }

  async fundEscrow(escrowId: number) {
    const contract = this.getMarketplaceEscrowContract();
    const tx = await contract.fundEscrow(escrowId);
    return await tx.wait();
  }

  async confirmDelivery(escrowId: number, proof: string) {
    const contract = this.getMarketplaceEscrowContract();
    const tx = await contract.confirmDelivery(escrowId, proof);
    return await tx.wait();
  }

  async completeEscrow(escrowId: number) {
    const contract = this.getMarketplaceEscrowContract();
    const tx = await contract.completeEscrow(escrowId);
    return await tx.wait();
  }

  // Governance DAO Contract
  getGovernanceDAOContract() {
    if (!this.provider) throw new Error('Provider not available');
    return new ethers.Contract(CONTRACT_ADDRESSES.GovernanceDAO, GOVERNANCE_DAO_ABI, this.signer || this.provider);
  }

  async propose(description: string) {
    const contract = this.getGovernanceDAOContract();
    const tx = await contract.propose(description);
    return await tx.wait();
  }

  async vote(proposalId: number, support: boolean) {
    const contract = this.getGovernanceDAOContract();
    const tx = await contract.vote(proposalId, support);
    return await tx.wait();
  }

  async executeProposal(proposalId: number) {
    const contract = this.getGovernanceDAOContract();
    const tx = await contract.executeProposal(proposalId);
    return await tx.wait();
  }

  async getProposal(proposalId: number) {
    const contract = this.getGovernanceDAOContract();
    return await contract.getProposal(proposalId);
  }

  // Carbon Token Contract
  getCarbonTokenContract() {
    if (!this.provider) throw new Error('Provider not available');
    return new ethers.Contract(CONTRACT_ADDRESSES.CarbonToken, CARBON_TOKEN_ABI, this.signer || this.provider);
  }

  async mintCarbonTokens(to: string, carbonAmount: string, verificationProof: string) {
    const contract = this.getCarbonTokenContract();
    const tx = await contract.mintCarbonTokens(to, ethers.utils.parseEther(carbonAmount), verificationProof);
    return await tx.wait();
  }

  async burnCarbonTokens(amount: string) {
    const contract = this.getCarbonTokenContract();
    const tx = await contract.burnCarbonTokens(ethers.utils.parseEther(amount));
    return await tx.wait();
  }

  async getCarbonOffset(userAddress: string) {
    const contract = this.getCarbonTokenContract();
    const offset = await contract.getCarbonOffset(userAddress);
    return ethers.utils.formatEther(offset);
  }

  // Liquidity Pool Contract
  getLiquidityPoolContract() {
    if (!this.provider) throw new Error('Provider not available');
    return new ethers.Contract(CONTRACT_ADDRESSES.LiquidityPool, LIQUIDITY_POOL_ABI, this.signer || this.provider);
  }

  async addLiquidity(tokenAddress: string, amount: string) {
    const contract = this.getLiquidityPoolContract();
    const tx = await contract.addLiquidity(tokenAddress, ethers.utils.parseEther(amount));
    return await tx.wait();
  }

  async removeLiquidity(tokenAddress: string, amount: string) {
    const contract = this.getLiquidityPoolContract();
    const tx = await contract.removeLiquidity(tokenAddress, ethers.utils.parseEther(amount));
    return await tx.wait();
  }

  async getPoolInfo(tokenAddress: string) {
    const contract = this.getLiquidityPoolContract();
    return await contract.getPoolInfo(tokenAddress);
  }

  // Yield Token Contract
  getYieldTokenContract() {
    if (!this.provider) throw new Error('Provider not available');
    return new ethers.Contract(CONTRACT_ADDRESSES.YieldToken, YIELD_TOKEN_ABI, this.signer || this.provider);
  }

  async deposit(amount: string) {
    const contract = this.getYieldTokenContract();
    const tx = await contract.deposit(ethers.utils.parseEther(amount));
    return await tx.wait();
  }

  async withdraw(amount: string) {
    const contract = this.getYieldTokenContract();
    const tx = await contract.withdraw(ethers.utils.parseEther(amount));
    return await tx.wait();
  }

  async claimYield() {
    const contract = this.getYieldTokenContract();
    const tx = await contract.claimYield();
    return await tx.wait();
  }

  async getPosition(userAddress: string) {
    const contract = this.getYieldTokenContract();
    return await contract.getPosition(userAddress);
  }

  // NFT Farming Contract
  getNFTFarmingContract() {
    if (!this.provider) throw new Error('Provider not available');
    return new ethers.Contract(CONTRACT_ADDRESSES.NFTFarming, NFT_FARMING_ABI, this.signer || this.provider);
  }

  async mintFarmNFT(farmer: string, farmName: string, location: string, size: number, cropType: string, expectedYield: number, metadataURI: string) {
    const contract = this.getNFTFarmingContract();
    const tx = await contract.mintFarmNFT(farmer, farmName, location, size, cropType, expectedYield, metadataURI);
    return await tx.wait();
  }

  async recordHarvest(tokenId: number, actualYield: number) {
    const contract = this.getNFTFarmingContract();
    const tx = await contract.recordHarvest(tokenId, actualYield);
    return await tx.wait();
  }

  async getFarmNFT(tokenId: number) {
    const contract = this.getNFTFarmingContract();
    return await contract.getFarmNFT(tokenId);
  }

  async getFarmerNFTs(farmer: string) {
    const contract = this.getNFTFarmingContract();
    return await contract.getFarmerNFTs(farmer);
  }

  // AgriCredit Token Contract
  getAgriCreditContract() {
    if (!this.provider) throw new Error('Provider not available');
    return new ethers.Contract(CONTRACT_ADDRESSES.AgriCredit, AGRI_CREDIT_ABI, this.signer || this.provider);
  }

  async getAgriCreditBalance(address: string) {
    const contract = this.getAgriCreditContract();
    const balance = await contract.balanceOf(address);
    return ethers.utils.formatEther(balance);
  }

  async transferAgriCredit(to: string, amount: string) {
    const contract = this.getAgriCreditContract();
    const tx = await contract.transfer(to, ethers.utils.parseEther(amount));
    return await tx.wait();
  }
}

// Export singleton instance
export const contractInteractions = new ContractInteractions();