import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting AgriCredit smart contract deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("📤 Deploying contracts with account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Create deployments directory
  const deploymentsDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Deployment configuration
  const deploymentConfig = {
    network: network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  try {
    // 1. Deploy AgriCredit Token
    console.log("\n1️⃣  Deploying AgriCredit Token...");
    const AgriCredit = await ethers.getContractFactory("AgriCredit");
    const agriCredit = await AgriCredit.deploy();
    await agriCredit.waitForDeployment();
    const agriCreditAddress = await agriCredit.getAddress();

    console.log("✅ AgriCredit deployed to:", agriCreditAddress);
    deploymentConfig.contracts.AgriCredit = {
      address: agriCreditAddress,
      deploymentTx: agriCredit.deploymentTransaction().hash,
      verified: false
    };

    // 2. Deploy IdentityRegistry
    console.log("\n2️⃣  Deploying IdentityRegistry...");
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    const identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();
    const identityRegistryAddress = await identityRegistry.getAddress();

    console.log("✅ IdentityRegistry deployed to:", identityRegistryAddress);
    deploymentConfig.contracts.IdentityRegistry = {
      address: identityRegistryAddress,
      deploymentTx: identityRegistry.deploymentTransaction().hash,
      verified: false
    };

    // 3. Deploy CarbonToken
    console.log("\n3️⃣  Deploying CarbonToken...");
    const CarbonToken = await ethers.getContractFactory("CarbonToken");
    const carbonToken = await CarbonToken.deploy();
    await carbonToken.waitForDeployment();
    const carbonTokenAddress = await carbonToken.getAddress();

    console.log("✅ CarbonToken deployed to:", carbonTokenAddress);
    deploymentConfig.contracts.CarbonToken = {
      address: carbonTokenAddress,
      deploymentTx: carbonToken.deploymentTransaction().hash,
      verified: false
    };

    // 4. Deploy YieldToken
    console.log("\n4️⃣  Deploying YieldToken...");
    const YieldToken = await ethers.getContractFactory("YieldToken");
    const yieldToken = await YieldToken.deploy(
      agriCreditAddress,
      "AgriCredit Yield Token",
      "AYT"
    );
    await yieldToken.waitForDeployment();
    const yieldTokenAddress = await yieldToken.getAddress();

    console.log("✅ YieldToken deployed to:", yieldTokenAddress);
    deploymentConfig.contracts.YieldToken = {
      address: yieldTokenAddress,
      deploymentTx: yieldToken.deploymentTransaction().hash,
      verified: false
    };

    // 5. Deploy LoanManager
    console.log("\n5️⃣  Deploying LoanManager...");
    const LoanManager = await ethers.getContractFactory("LoanManager");
    const loanManager = await LoanManager.deploy(
      identityRegistryAddress,
      agriCreditAddress
    );
    await loanManager.waitForDeployment();
    const loanManagerAddress = await loanManager.getAddress();

    console.log("✅ LoanManager deployed to:", loanManagerAddress);
    deploymentConfig.contracts.LoanManager = {
      address: loanManagerAddress,
      deploymentTx: loanManager.deploymentTransaction().hash,
      verified: false
    };

    // 6. Deploy GovernanceDAO
    console.log("\n6️⃣  Deploying GovernanceDAO...");
    const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
    const governanceDAO = await GovernanceDAO.deploy(
      agriCreditAddress,
      1, // voting delay (1 block)
      5, // voting period (5 blocks)
      ethers.parseEther("4"), // proposal threshold (4 tokens)
      400 // quorum (4% of total supply)
    );
    await governanceDAO.waitForDeployment();
    const governanceDAOAddress = await governanceDAO.getAddress();

    console.log("✅ GovernanceDAO deployed to:", governanceDAOAddress);
    deploymentConfig.contracts.GovernanceDAO = {
      address: governanceDAOAddress,
      deploymentTx: governanceDAO.deploymentTransaction().hash,
      verified: false
    };

    // 7. Deploy NFTFarming
    console.log("\n7️⃣  Deploying NFTFarming...");
    const NFTFarming = await ethers.getContractFactory("NFTFarming");
    const nftFarming = await NFTFarming.deploy();
    await nftFarming.waitForDeployment();
    const nftFarmingAddress = await nftFarming.getAddress();

    console.log("✅ NFTFarming deployed to:", nftFarmingAddress);
    deploymentConfig.contracts.NFTFarming = {
      address: nftFarmingAddress,
      deploymentTx: nftFarming.deploymentTransaction().hash,
      verified: false
    };

    // 8. Deploy LiquidityPool
    console.log("\n8️⃣  Deploying LiquidityPool...");
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const liquidityPool = await LiquidityPool.deploy(
      agriCreditAddress,
      carbonTokenAddress
    );
    await liquidityPool.waitForDeployment();
    const liquidityPoolAddress = await liquidityPool.getAddress();

    console.log("✅ LiquidityPool deployed to:", liquidityPoolAddress);
    deploymentConfig.contracts.LiquidityPool = {
      address: liquidityPoolAddress,
      deploymentTx: liquidityPool.deploymentTransaction().hash,
      verified: false
    };

    // 9. Deploy MarketplaceEscrow
    console.log("\n9️⃣  Deploying MarketplaceEscrow...");
    const MarketplaceEscrow = await ethers.getContractFactory("MarketplaceEscrow");
    const marketplaceEscrow = await MarketplaceEscrow.deploy();
    await marketplaceEscrow.waitForDeployment();
    const marketplaceEscrowAddress = await marketplaceEscrow.getAddress();

    console.log("✅ MarketplaceEscrow deployed to:", marketplaceEscrowAddress);
    deploymentConfig.contracts.MarketplaceEscrow = {
      address: marketplaceEscrowAddress,
      deploymentTx: marketplaceEscrow.deploymentTransaction().hash,
      verified: false
    };

    // Save deployment configuration
    const configPath = path.join(deploymentsDir, `${network.name}-deployment.json`);
    fs.writeFileSync(configPath, JSON.stringify(deploymentConfig, null, 2));

    console.log(`\n✅ Deployment completed successfully!`);
    console.log(`📄 Configuration saved to: ${configPath}`);

    // Display summary
    console.log("\n📋 Deployment Summary:");
    Object.entries(deploymentConfig.contracts).forEach(([name, config]) => {
      console.log(`  ${name}: ${config.address}`);
    });

    // Verify contracts on Etherscan (if on mainnet or testnets)
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("\n🔍 Starting contract verification...");
      await verifyContracts(deploymentConfig);
    }

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

async function verifyContracts(deploymentConfig) {
  const { run } = require("hardhat");

  for (const [contractName, config] of Object.entries(deploymentConfig.contracts)) {
    try {
      console.log(`Verifying ${contractName}...`);

      let constructorArgs = [];

      // Set constructor arguments based on contract
      switch (contractName) {
        case 'LoanManager':
          constructorArgs = [
            deploymentConfig.contracts.IdentityRegistry.address,
            deploymentConfig.contracts.AgriCredit.address
          ];
          break;
        case 'GovernanceDAO':
          constructorArgs = [
            deploymentConfig.contracts.AgriCredit.address,
            1, 5, ethers.parseEther("4"), 400
          ];
          break;
        case 'YieldToken':
          constructorArgs = [
            deploymentConfig.contracts.AgriCredit.address,
            "AgriCredit Yield Token",
            "AYT"
          ];
          break;
        case 'LiquidityPool':
          constructorArgs = [
            deploymentConfig.contracts.AgriCredit.address,
            deploymentConfig.contracts.CarbonToken.address
          ];
          break;
        default:
          constructorArgs = [];
      }

      await run("verify:verify", {
        address: config.address,
        constructorArguments: constructorArgs,
      });

      console.log(`✅ ${contractName} verified successfully`);
      config.verified = true;

    } catch (error) {
      console.log(`⚠️  ${contractName} verification failed:`, error.message);
    }
  }

  // Update deployment config with verification status
  const configPath = path.join(process.cwd(), "deployments", `${deploymentConfig.network}-deployment.json`);
  fs.writeFileSync(configPath, JSON.stringify(deploymentConfig, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });