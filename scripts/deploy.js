const { ethers } = require("hardhat");

async function main() {
  console.log("Starting AgriCredit DApp deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy AgriCredit token
  console.log("Deploying AgriCredit token...");
  const AgriCredit = await ethers.getContractFactory("AgriCredit");
  const agriCredit = await AgriCredit.deploy();
  await agriCredit.waitForDeployment();
  console.log("AgriCredit token deployed to:", await agriCredit.getAddress());

  // Deploy IdentityRegistry
  console.log("Deploying IdentityRegistry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  console.log("IdentityRegistry deployed to:", await identityRegistry.getAddress());

  // Deploy CarbonToken
  console.log("Deploying CarbonToken...");
  const CarbonToken = await ethers.getContractFactory("CarbonToken");
  const carbonToken = await CarbonToken.deploy();
  await carbonToken.waitForDeployment();
  console.log("CarbonToken deployed to:", await carbonToken.getAddress());

  // Deploy LiquidityPool
  console.log("Deploying LiquidityPool...");
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(await carbonToken.getAddress());
  await liquidityPool.waitForDeployment();
  console.log("LiquidityPool deployed to:", await liquidityPool.getAddress());

  // Deploy LoanManager
  console.log("Deploying LoanManager...");
  const LoanManager = await ethers.getContractFactory("LoanManager");
  const loanManager = await LoanManager.deploy(
    await identityRegistry.getAddress(),
    await agriCredit.getAddress()
  );
  await loanManager.waitForDeployment();
  console.log("LoanManager deployed to:", await loanManager.getAddress());

  // Deploy MarketplaceEscrow
  console.log("Deploying MarketplaceEscrow...");
  const MarketplaceEscrow = await ethers.getContractFactory("MarketplaceEscrow");
  const marketplaceEscrow = await MarketplaceEscrow.deploy();
  await marketplaceEscrow.waitForDeployment();
  console.log("MarketplaceEscrow deployed to:", await marketplaceEscrow.getAddress());

  // Deploy GovernanceDAO
  console.log("Deploying GovernanceDAO...");
  const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
  const governanceDAO = await GovernanceDAO.deploy(await agriCredit.getAddress());
  await governanceDAO.waitForDeployment();
  console.log("GovernanceDAO deployed to:", await governanceDAO.getAddress());

  // Deploy NFTFarming
  console.log("Deploying NFTFarming...");
  const NFTFarming = await ethers.getContractFactory("NFTFarming");
  const nftFarming = await NFTFarming.deploy();
  await nftFarming.waitForDeployment();
  console.log("NFTFarming deployed to:", await nftFarming.getAddress());

  // Deploy YieldToken
  console.log("Deploying YieldToken...");
  const YieldToken = await ethers.getContractFactory("YieldToken");
  const yieldToken = await YieldToken.deploy(
    await agriCredit.getAddress(),
    "AgriCredit Yield Token",
    "AYT"
  );
  await yieldToken.waitForDeployment();
  console.log("YieldToken deployed to:", await yieldToken.getAddress());

  console.log("\n=== Deployment Summary ===");
  console.log("AgriCredit Token:", await agriCredit.getAddress());
  console.log("IdentityRegistry:", await identityRegistry.getAddress());
  console.log("CarbonToken:", await carbonToken.getAddress());
  console.log("LiquidityPool:", await liquidityPool.getAddress());
  console.log("LoanManager:", await loanManager.getAddress());
  console.log("MarketplaceEscrow:", await marketplaceEscrow.getAddress());
  console.log("GovernanceDAO:", await governanceDAO.getAddress());
  console.log("NFTFarming:", await nftFarming.getAddress());
  console.log("YieldToken:", await yieldToken.getAddress());

  // Save deployment addresses
  const fs = require("fs");
  const deploymentInfo = {
    network: network.name,
    contracts: {
      AgriCredit: await agriCredit.getAddress(),
      IdentityRegistry: await identityRegistry.getAddress(),
      CarbonToken: await carbonToken.getAddress(),
      LiquidityPool: await liquidityPool.getAddress(),
      LoanManager: await loanManager.getAddress(),
      MarketplaceEscrow: await marketplaceEscrow.getAddress(),
      GovernanceDAO: await governanceDAO.getAddress(),
      NFTFarming: await nftFarming.getAddress(),
      YieldToken: await yieldToken.getAddress(),
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    `deployments/${network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\nDeployment info saved to deployments/${network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });