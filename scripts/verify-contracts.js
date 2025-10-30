const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = process.argv[2] || "localhost";

  console.log(`🔍 Verifying contracts on ${network}...`);

  // Load deployment configuration
  const deploymentPath = path.join(__dirname, "../deployments", `${network}-deployment.json`);

  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ Deployment configuration not found: ${deploymentPath}`);
    console.log("Please run deployment first: npx hardhat run scripts/deploy.js --network", network);
    process.exit(1);
  }

  const deploymentConfig = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  console.log(`📋 Verifying ${Object.keys(deploymentConfig.contracts).length} contracts...`);

  let verifiedCount = 0;
  let failedCount = 0;

  for (const [contractName, config] of Object.entries(deploymentConfig.contracts)) {
    if (config.verified) {
      console.log(`⏭️  ${contractName} already verified`);
      continue;
    }

    try {
      console.log(`\n🔍 Verifying ${contractName}...`);

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
      verifiedCount++;

    } catch (error) {
      console.log(`❌ ${contractName} verification failed:`, error.message);
      failedCount++;
    }
  }

  // Update deployment config with verification status
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentConfig, null, 2));

  console.log(`\n📊 Verification Summary:`);
  console.log(`✅ Verified: ${verifiedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📄 Updated configuration saved to: ${deploymentPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification script failed:", error);
    process.exit(1);
  });