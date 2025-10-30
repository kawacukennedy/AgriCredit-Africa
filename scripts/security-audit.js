const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

class SecurityAuditor {
  constructor() {
    this.issues = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: []
    };
    this.contracts = {};
  }

  logIssue(severity, contract, issue, recommendation, location = "") {
    const issueData = {
      contract,
      issue,
      recommendation,
      location,
      timestamp: new Date().toISOString()
    };

    this.issues[severity].push(issueData);
    console.log(`[${severity.toUpperCase()}] ${contract}: ${issue}`);
  }

  async auditContract(contractName, contractAddress, abi) {
    console.log(`\n🔍 Auditing ${contractName}...`);

    try {
      const contract = new ethers.Contract(contractAddress, abi, ethers.provider);

      // Check for common vulnerabilities
      await this.checkOwnership(contractName, contract);
      await this.checkAccessControl(contractName, contract);
      await this.checkReentrancy(contractName, contract);
      await this.checkIntegerOverflow(contractName, contract);
      await this.checkUninitializedStorage(contractName, contract);
      await this.checkFrontRunning(contractName, contract);
      await this.checkDenialOfService(contractName, contract);

      // Check contract balance
      const balance = await ethers.provider.getBalance(contractAddress);
      if (balance > 0) {
        console.log(`💰 Contract holds ${ethers.formatEther(balance)} ETH`);
      }

    } catch (error) {
      this.logIssue('high', contractName, 'Contract interaction failed', 'Verify contract deployment and ABI', error.message);
    }
  }

  async checkOwnership(contractName, contract) {
    try {
      // Check for owner function
      const owner = await contract.owner();
      console.log(`👤 Owner: ${owner}`);

      // Check if owner is zero address
      if (owner === ethers.ZeroAddress) {
        this.logIssue('medium', contractName, 'Owner is zero address', 'Consider setting a valid owner address');
      }
    } catch (error) {
      // Owner function might not exist, which is fine for some contracts
    }
  }

  async checkAccessControl(contractName, contract) {
    // Check for common access control patterns
    const functions = [
      'transferOwnership',
      'renounceOwnership',
      'grantRole',
      'revokeRole',
      'setAdmin',
      'setAuthority'
    ];

    for (const func of functions) {
      try {
        await contract[func].estimateGas();
        console.log(`🔑 Access control function found: ${func}`);
      } catch (error) {
        // Function doesn't exist or not accessible
      }
    }
  }

  async checkReentrancy(contractName, contract) {
    // Check for functions that might be vulnerable to reentrancy
    const suspiciousFunctions = [
      'withdraw',
      'claim',
      'transfer',
      'send',
      'call'
    ];

    for (const func of suspiciousFunctions) {
      try {
        const code = await ethers.provider.getCode(await contract.getAddress());
        if (code.includes(func)) {
          this.logIssue('high', contractName,
            `Potential reentrancy vulnerability in ${func}`,
            'Implement checks-effects-interactions pattern and use ReentrancyGuard',
            func);
        }
      } catch (error) {
        // Function might not exist
      }
    }
  }

  async checkIntegerOverflow(contractName, contract) {
    // Check for arithmetic operations that might overflow
    try {
      const code = await ethers.provider.getCode(await contract.getAddress());

      // Look for arithmetic operations
      const arithmeticOps = ['ADD', 'MUL', 'SUB', 'DIV'];
      let hasArithmetic = false;

      for (const op of arithmeticOps) {
        if (code.includes(op)) {
          hasArithmetic = true;
          break;
        }
      }

      if (hasArithmetic) {
        this.logIssue('medium', contractName,
          'Contract contains arithmetic operations',
          'Use SafeMath library or Solidity 0.8+ built-in overflow checks',
          'Arithmetic operations');
      }
    } catch (error) {
      // Code reading failed
    }
  }

  async checkUninitializedStorage(contractName, contract) {
    // Check for potential uninitialized storage variables
    try {
      // This is a basic check - in practice, this would require source code analysis
      const code = await ethers.provider.getCode(await contract.getAddress());

      // Look for storage operations
      if (code.includes('SSTORE') || code.includes('SLOAD')) {
        console.log(`💾 Contract uses storage operations`);
      }
    } catch (error) {
      // Code reading failed
    }
  }

  async checkFrontRunning(contractName, contract) {
    // Check for functions that might be vulnerable to front-running
    const vulnerableFunctions = [
      'setPrice',
      'updateRate',
      'placeOrder',
      'bid'
    ];

    for (const func of vulnerableFunctions) {
      try {
        await contract[func].estimateGas();
        this.logIssue('medium', contractName,
          `Function ${func} might be vulnerable to front-running`,
          'Consider using commit-reveal schemes or time-weighted average prices',
          func);
      } catch (error) {
        // Function doesn't exist
      }
    }
  }

  async checkDenialOfService(contractName, contract) {
    // Check for potential DoS vulnerabilities
    try {
      // Check for loops that might be unbounded
      const code = await ethers.provider.getCode(await contract.getAddress());

      if (code.includes('JUMP') && code.includes('JUMPI')) {
        this.logIssue('low', contractName,
          'Contract contains loops',
          'Ensure loops are bounded and cannot be exploited for DoS',
          'Loop operations');
      }
    } catch (error) {
      // Code reading failed
    }
  }

  async checkContractInteractions(contractName, contract) {
    // Check for external contract calls
    try {
      const code = await ethers.provider.getCode(await contract.getAddress());

      if (code.includes('CALL') || code.includes('DELEGATECALL') || code.includes('STATICCALL')) {
        console.log(`🔗 Contract makes external calls`);
        this.logIssue('info', contractName,
          'Contract makes external calls',
          'Ensure proper error handling and gas limits for external calls',
          'External calls');
      }
    } catch (error) {
      // Code reading failed
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        critical: this.issues.critical.length,
        high: this.issues.high.length,
        medium: this.issues.medium.length,
        low: this.issues.low.length,
        info: this.issues.info.length,
        total: Object.values(this.issues).flat().length
      },
      issues: this.issues
    };

    return report;
  }

  printSummary() {
    const summary = this.generateReport().summary;

    console.log('\n📊 Security Audit Summary:');
    console.log('========================');
    console.log(`🔴 Critical: ${summary.critical}`);
    console.log(`🟠 High: ${summary.high}`);
    console.log(`🟡 Medium: ${summary.medium}`);
    console.log(`🟢 Low: ${summary.low}`);
    console.log(`ℹ️  Info: ${summary.info}`);
    console.log(`📈 Total Issues: ${summary.total}`);

    if (summary.critical > 0 || summary.high > 0) {
      console.log('\n⚠️  ACTION REQUIRED: Critical and high-severity issues must be addressed before deployment!');
    } else if (summary.medium > 0) {
      console.log('\n⚡ RECOMMENDED: Review medium-severity issues before deployment.');
    } else {
      console.log('\n✅ PASSED: No critical or high-severity issues found.');
    }
  }
}

async function main() {
  const network = process.argv[2] || "localhost";
  const auditor = new SecurityAuditor();

  console.log(`🔒 Starting security audit for ${network} deployment...`);

  // Load deployment configuration
  const deploymentPath = path.join(__dirname, "../deployments", `${network}-deployment.json`);

  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ Deployment configuration not found: ${deploymentPath}`);
    console.log("Please run deployment first: npx hardhat run scripts/deploy.js --network", network);
    process.exit(1);
  }

  const deploymentConfig = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  // Load contract ABIs
  const contractsDir = path.join(__dirname, "../contracts");

  for (const [contractName, config] of Object.entries(deploymentConfig.contracts)) {
    const abiPath = path.join(contractsDir, `${contractName}.json`);

    if (fs.existsSync(abiPath)) {
      try {
        const contractData = JSON.parse(fs.readFileSync(abiPath, "utf8"));
        const abi = contractData.abi || contractData;

        await auditor.auditContract(contractName, config.address, abi);
      } catch (error) {
        console.error(`Failed to load ABI for ${contractName}:`, error.message);
      }
    } else {
      auditor.logIssue('info', contractName, 'ABI file not found', 'Ensure contract artifacts are generated', abiPath);
    }
  }

  // Generate and save report
  const report = auditor.generateReport();
  const reportPath = path.join(__dirname, "../reports", `security-audit-${network}-${Date.now()}.json`);

  // Create reports directory
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n📄 Security audit report saved to: ${reportPath}`);

  // Print summary
  auditor.printSummary();

  // Exit with appropriate code
  const hasCriticalIssues = report.summary.critical > 0 || report.summary.high > 0;
  process.exit(hasCriticalIssues ? 1 : 0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Security audit failed:", error);
    process.exit(1);
  });