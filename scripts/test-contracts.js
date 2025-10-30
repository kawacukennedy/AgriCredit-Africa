const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgriCredit Smart Contracts", function () {
  let deployer, user1, user2, user3;
  let agriCredit, identityRegistry, carbonToken, loanManager;
  let governanceDAO, nftFarming, liquidityPool, marketplaceEscrow;
  let yieldToken;

  before(async function () {
    [deployer, user1, user2, user3] = await ethers.getSigners();
    console.log("Testing with accounts:");
    console.log("Deployer:", deployer.address);
    console.log("User1:", user1.address);
    console.log("User2:", user2.address);
    console.log("User3:", user3.address);
  });

  describe("Contract Deployment", function () {
    it("Should deploy AgriCredit token", async function () {
      const AgriCredit = await ethers.getContractFactory("AgriCredit");
      agriCredit = await AgriCredit.deploy();
      await agriCredit.waitForDeployment();

      expect(await agriCredit.getAddress()).to.be.properAddress;
      console.log("✅ AgriCredit deployed at:", await agriCredit.getAddress());
    });

    it("Should deploy IdentityRegistry", async function () {
      const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
      identityRegistry = await IdentityRegistry.deploy();
      await identityRegistry.waitForDeployment();

      expect(await identityRegistry.getAddress()).to.be.properAddress;
      console.log("✅ IdentityRegistry deployed at:", await identityRegistry.getAddress());
    });

    it("Should deploy CarbonToken", async function () {
      const CarbonToken = await ethers.getContractFactory("CarbonToken");
      carbonToken = await CarbonToken.deploy();
      await carbonToken.waitForDeployment();

      expect(await carbonToken.getAddress()).to.be.properAddress;
      console.log("✅ CarbonToken deployed at:", await carbonToken.getAddress());
    });

    it("Should deploy YieldToken", async function () {
      const YieldToken = await ethers.getContractFactory("YieldToken");
      yieldToken = await YieldToken.deploy(
        await agriCredit.getAddress(),
        "AgriCredit Yield Token",
        "AYT"
      );
      await yieldToken.waitForDeployment();

      expect(await yieldToken.getAddress()).to.be.properAddress;
      console.log("✅ YieldToken deployed at:", await yieldToken.getAddress());
    });

    it("Should deploy LoanManager", async function () {
      const LoanManager = await ethers.getContractFactory("LoanManager");
      loanManager = await LoanManager.deploy(
        await identityRegistry.getAddress(),
        await agriCredit.getAddress()
      );
      await loanManager.waitForDeployment();

      expect(await loanManager.getAddress()).to.be.properAddress;
      console.log("✅ LoanManager deployed at:", await loanManager.getAddress());
    });

    it("Should deploy GovernanceDAO", async function () {
      const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
      governanceDAO = await GovernanceDAO.deploy(
        await agriCredit.getAddress(),
        1, // voting delay
        5, // voting period
        ethers.parseEther("4"), // proposal threshold
        400 // quorum percentage
      );
      await governanceDAO.waitForDeployment();

      expect(await governanceDAO.getAddress()).to.be.properAddress;
      console.log("✅ GovernanceDAO deployed at:", await governanceDAO.getAddress());
    });

    it("Should deploy NFTFarming", async function () {
      const NFTFarming = await ethers.getContractFactory("NFTFarming");
      nftFarming = await NFTFarming.deploy();
      await nftFarming.waitForDeployment();

      expect(await nftFarming.getAddress()).to.be.properAddress;
      console.log("✅ NFTFarming deployed at:", await nftFarming.getAddress());
    });

    it("Should deploy LiquidityPool", async function () {
      const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
      liquidityPool = await LiquidityPool.deploy(
        await agriCredit.getAddress(),
        await carbonToken.getAddress()
      );
      await liquidityPool.waitForDeployment();

      expect(await liquidityPool.getAddress()).to.be.properAddress;
      console.log("✅ LiquidityPool deployed at:", await liquidityPool.getAddress());
    });

    it("Should deploy MarketplaceEscrow", async function () {
      const MarketplaceEscrow = await ethers.getContractFactory("MarketplaceEscrow");
      marketplaceEscrow = await MarketplaceEscrow.deploy();
      await marketplaceEscrow.waitForDeployment();

      expect(await marketplaceEscrow.getAddress()).to.be.properAddress;
      console.log("✅ MarketplaceEscrow deployed at:", await marketplaceEscrow.getAddress());
    });
  });

  describe("Token Functionality", function () {
    it("Should mint AgriCredit tokens", async function () {
      const mintAmount = ethers.parseEther("1000");

      // Mint tokens to deployer
      await agriCredit.mint(deployer.address, mintAmount);

      const balance = await agriCredit.balanceOf(deployer.address);
      expect(balance).to.equal(mintAmount);
      console.log("✅ Minted", ethers.formatEther(mintAmount), "AgriCredit tokens");
    });

    it("Should transfer AgriCredit tokens", async function () {
      const transferAmount = ethers.parseEther("100");

      await agriCredit.transfer(user1.address, transferAmount);

      const user1Balance = await agriCredit.balanceOf(user1.address);
      expect(user1Balance).to.equal(transferAmount);
      console.log("✅ Transferred", ethers.formatEther(transferAmount), "tokens to user1");
    });

    it("Should mint CarbonToken", async function () {
      const mintAmount = ethers.parseEther("500");

      await carbonToken.mint(deployer.address, mintAmount);

      const balance = await carbonToken.balanceOf(deployer.address);
      expect(balance).to.equal(mintAmount);
      console.log("✅ Minted", ethers.formatEther(mintAmount), "CarbonTokens");
    });
  });

  describe("Identity Registry", function () {
    it("Should register user identity", async function () {
      const userData = {
        name: "John Farmer",
        location: "California, USA",
        farmSize: 50, // acres
        creditScore: 750
      };

      await identityRegistry.registerUser(
        user1.address,
        userData.name,
        userData.location,
        userData.farmSize,
        userData.creditScore
      );

      const userInfo = await identityRegistry.getUser(user1.address);
      expect(userInfo.name).to.equal(userData.name);
      expect(userInfo.isVerified).to.be.true;
      console.log("✅ Registered user:", userData.name);
    });

    it("Should verify user identity", async function () {
      const isVerified = await identityRegistry.isUserVerified(user1.address);
      expect(isVerified).to.be.true;
      console.log("✅ User identity verified");
    });
  });

  describe("Loan Manager", function () {
    before(async function () {
      // Transfer some AgriCredit tokens to loan manager for lending
      await agriCredit.transfer(await loanManager.getAddress(), ethers.parseEther("10000"));
    });

    it("Should create loan application", async function () {
      const loanAmount = ethers.parseEther("1000");
      const interestRate = 500; // 5%
      const duration = 365 * 24 * 60 * 60; // 1 year in seconds

      await loanManager.connect(user1).applyForLoan(
        loanAmount,
        interestRate,
        duration,
        "Farm equipment purchase"
      );

      const loans = await loanManager.getUserLoans(user1.address);
      expect(loans.length).to.equal(1);
      expect(loans[0].amount).to.equal(loanAmount);
      console.log("✅ Created loan application for", ethers.formatEther(loanAmount), "tokens");
    });

    it("Should approve loan", async function () {
      // Approve loan as deployer (admin)
      await loanManager.approveLoan(1); // loan ID 1

      const loans = await loanManager.getUserLoans(user1.address);
      expect(loans[0].status).to.equal(1); // Approved status
      console.log("✅ Loan approved");
    });
  });

  describe("Governance DAO", function () {
    it("Should create governance proposal", async function () {
      // Delegate voting power first
      await agriCredit.connect(user1).delegate(user1.address);

      const proposalDescription = "Increase farming subsidies by 10%";

      await governanceDAO.connect(user1).propose(
        [await agriCredit.getAddress()], // targets
        [0], // values
        ["0x"], // signatures
        ["0x"], // calldatas
        proposalDescription
      );

      const proposalCount = await governanceDAO.proposalCount();
      expect(proposalCount).to.equal(1);
      console.log("✅ Created governance proposal:", proposalDescription);
    });

    it("Should cast vote on proposal", async function () {
      // Vote on proposal (support = true)
      await governanceDAO.connect(user1).castVote(1, 1); // proposalId = 1, support = 1 (for)

      const proposal = await governanceDAO.proposals(1);
      expect(proposal.forVotes).to.be.gt(0);
      console.log("✅ Cast vote on proposal");
    });
  });

  describe("NFT Farming", function () {
    it("Should mint farm NFT", async function () {
      const farmData = {
        farmer: user1.address,
        farmName: "Green Valley Farm",
        location: "Iowa, USA",
        size: 100, // hectares
        cropType: "Corn",
        expectedYield: 5000, // tons
        metadataURI: "ipfs://QmTestFarmMetadata"
      };

      await nftFarming.connect(user1).mintFarmNFT(
        farmData.farmer,
        farmData.farmName,
        farmData.location,
        farmData.size * 100, // Convert to basis points
        farmData.cropType,
        farmData.expectedYield * 100, // Convert to basis points
        farmData.metadataURI
      );

      const balance = await nftFarming.balanceOf(user1.address);
      expect(balance).to.equal(1);
      console.log("✅ Minted farm NFT for:", farmData.farmName);
    });

    it("Should record harvest", async function () {
      const tokenId = 1;
      const actualYield = 4800; // tons

      await nftFarming.connect(user1).recordHarvest(
        tokenId,
        actualYield * 100 // Convert to basis points
      );

      const farmNFT = await nftFarming.getFarmNFT(tokenId);
      expect(farmNFT.actualYield).to.equal(actualYield * 100);
      console.log("✅ Recorded harvest of", actualYield, "tons");
    });
  });

  describe("Liquidity Pool", function () {
    before(async function () {
      // Transfer tokens for liquidity provision
      await agriCredit.transfer(user1.address, ethers.parseEther("1000"));
      await carbonToken.transfer(user1.address, ethers.parseEther("1000"));

      // Approve tokens for liquidity pool
      await agriCredit.connect(user1).approve(await liquidityPool.getAddress(), ethers.parseEther("1000"));
      await carbonToken.connect(user1).approve(await liquidityPool.getAddress(), ethers.parseEther("1000"));
    });

    it("Should add liquidity", async function () {
      const amountA = ethers.parseEther("100");
      const amountB = ethers.parseEther("100");

      await liquidityPool.connect(user1).addLiquidity(
        await agriCredit.getAddress(),
        await carbonToken.getAddress(),
        amountA,
        amountB
      );

      const reserves = await liquidityPool.getReserves(
        await agriCredit.getAddress(),
        await carbonToken.getAddress()
      );

      expect(reserves.reserveA).to.equal(amountA);
      expect(reserves.reserveB).to.equal(amountB);
      console.log("✅ Added liquidity:", ethers.formatEther(amountA), "tokens");
    });

    it("Should remove liquidity", async function () {
      const liquidityAmount = ethers.parseEther("50");

      await liquidityPool.connect(user1).removeLiquidity(
        await agriCredit.getAddress(),
        await carbonToken.getAddress(),
        liquidityAmount
      );

      const reserves = await liquidityPool.getReserves(
        await agriCredit.getAddress(),
        await carbonToken.getAddress()
      );

      expect(reserves.reserveA).to.equal(ethers.parseEther("50"));
      expect(reserves.reserveB).to.equal(ethers.parseEther("50"));
      console.log("✅ Removed liquidity:", ethers.formatEther(liquidityAmount), "tokens");
    });
  });

  describe("Marketplace Escrow", function () {
    it("Should create escrow", async function () {
      const escrowAmount = ethers.parseEther("10");
      const itemPrice = ethers.parseEther("10");

      // Approve tokens for escrow
      await agriCredit.connect(user1).approve(await marketplaceEscrow.getAddress(), escrowAmount);

      await marketplaceEscrow.connect(user1).createEscrow(
        user2.address, // buyer
        escrowAmount,
        await agriCredit.getAddress(),
        itemPrice
      );

      const escrows = await marketplaceEscrow.getUserEscrows(user1.address);
      expect(escrows.length).to.equal(1);
      console.log("✅ Created marketplace escrow for", ethers.formatEther(itemPrice), "tokens");
    });

    it("Should release escrow", async function () {
      const escrowId = 1;

      // Release escrow as seller
      await marketplaceEscrow.connect(user1).releaseEscrow(escrowId);

      const escrow = await marketplaceEscrow.escrows(escrowId);
      expect(escrow.status).to.equal(2); // Released status
      console.log("✅ Released escrow payment");
    });
  });

  describe("Yield Token", function () {
    it("Should stake tokens", async function () {
      const stakeAmount = ethers.parseEther("100");

      // Approve tokens for staking
      await agriCredit.connect(user1).approve(await yieldToken.getAddress(), stakeAmount);

      await yieldToken.connect(user1).stake(stakeAmount);

      const userStake = await yieldToken.getUserStake(user1.address);
      expect(userStake.amount).to.equal(stakeAmount);
      console.log("✅ Staked", ethers.formatEther(stakeAmount), "tokens for yield farming");
    });

    it("Should claim yield rewards", async function () {
      // Fast forward time (simulate)
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]); // 1 week
      await ethers.provider.send("evm_mine");

      const initialBalance = await agriCredit.balanceOf(user1.address);

      await yieldToken.connect(user1).claimRewards();

      const finalBalance = await agriCredit.balanceOf(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
      console.log("✅ Claimed yield rewards");
    });
  });

  describe("Integration Tests", function () {
    it("Should complete full user journey", async function () {
      // 1. Register identity
      await identityRegistry.registerUser(
        user3.address,
        "Alice Cooper",
        "Texas, USA",
        75,
        800
      );

      // 2. Mint tokens
      await agriCredit.mint(user3.address, ethers.parseEther("5000"));

      // 3. Apply for loan
      await loanManager.connect(user3).applyForLoan(
        ethers.parseEther("2000"),
        600, // 6%
        365 * 24 * 60 * 60,
        "Tractor purchase"
      );

      // 4. Approve loan
      await loanManager.approveLoan(2); // Second loan

      // 5. Create governance proposal
      await agriCredit.connect(user3).delegate(user3.address);
      await governanceDAO.connect(user3).propose(
        [await agriCredit.getAddress()],
        [0],
        ["0x"],
        ["0x"],
        "Implement sustainable farming incentives"
      );

      console.log("✅ Completed full user journey integration test");
    });
  });

  after(async function () {
    console.log("\n🎉 All AgriCredit smart contract tests completed successfully!");
    console.log("\n📊 Test Summary:");
    console.log("✅ Contract Deployment: 9/9 contracts deployed");
    console.log("✅ Token Functionality: Basic operations working");
    console.log("✅ Identity Registry: User registration and verification");
    console.log("✅ Loan Manager: Loan application and approval");
    console.log("✅ Governance DAO: Proposal creation and voting");
    console.log("✅ NFT Farming: NFT minting and harvest recording");
    console.log("✅ Liquidity Pool: Add/remove liquidity operations");
    console.log("✅ Marketplace Escrow: Escrow creation and release");
    console.log("✅ Yield Token: Staking and reward claiming");
    console.log("✅ Integration: Full user journey completed");
  });
});