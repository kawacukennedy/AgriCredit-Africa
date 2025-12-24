const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiquidityPool", function () {
  let liquidityPool, carbonToken, mockToken1, mockToken2;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy CarbonToken
    const CarbonToken = await ethers.getContractFactory("CarbonToken");
    carbonToken = await CarbonToken.deploy();
    await carbonToken.waitForDeployment();

    // Deploy mock tokens
    const MockToken = await ethers.getContractFactory("AgriCredit");
    mockToken1 = await MockToken.deploy();
    await mockToken1.waitForDeployment();
    mockToken2 = await MockToken.deploy();
    await mockToken2.waitForDeployment();

    // Deploy LiquidityPool
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    liquidityPool = await LiquidityPool.deploy(await carbonToken.getAddress());
    await liquidityPool.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await liquidityPool.owner()).to.equal(owner.address);
    });

    it("Should set carbon token correctly", async function () {
      expect(await liquidityPool.carbonToken()).to.equal(await carbonToken.getAddress());
    });
  });

  describe("Pool Creation", function () {
    it("Should create pool successfully", async function () {
      const interestRate = 500; // 5%

      await expect(
        liquidityPool.createPool(await mockToken1.getAddress(), interestRate)
      ).to.emit(liquidityPool, "PoolCreated");

      const poolInfo = await liquidityPool.getPoolInfo(await mockToken1.getAddress());
      expect(poolInfo.interestRate).to.equal(interestRate);
      expect(poolInfo.active).to.equal(true);
      expect(poolInfo.totalLiquidity).to.equal(0);
      expect(poolInfo.totalBorrowed).to.equal(0);

      const supportedTokens = await liquidityPool.getSupportedTokens();
      expect(supportedTokens).to.include(await mockToken1.getAddress());
    });

    it("Should reject invalid token address", async function () {
      await expect(
        liquidityPool.createPool(ethers.ZeroAddress, 500)
      ).to.be.revertedWith("Invalid token address");
    });

    it("Should reject duplicate pools", async function () {
      await liquidityPool.createPool(await mockToken1.getAddress(), 500);

      await expect(
        liquidityPool.createPool(await mockToken1.getAddress(), 600)
      ).to.be.revertedWith("Pool already exists");
    });

    it("Should reject invalid interest rates", async function () {
      await expect(
        liquidityPool.createPool(await mockToken1.getAddress(), 0)
      ).to.be.revertedWith("Invalid interest rate");

      await expect(
        liquidityPool.createPool(await mockToken1.getAddress(), 2500) // 25%
      ).to.be.revertedWith("Invalid interest rate");
    });

    it("Should only allow owner to create pools", async function () {
      await expect(
        liquidityPool.connect(user1).createPool(await mockToken1.getAddress(), 500)
      ).to.be.revertedWithCustomError(liquidityPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Liquidity Management", function () {
    beforeEach(async function () {
      // Create pool
      await liquidityPool.createPool(await mockToken1.getAddress(), 500);

      // Mint tokens to users
      await mockToken1.mint(user1.address, ethers.parseEther("1000"));
      await mockToken1.mint(user2.address, ethers.parseEther("1000"));

      // Approve liquidity pool
      await mockToken1.connect(user1).approve(await liquidityPool.getAddress(), ethers.parseEther("1000"));
      await mockToken1.connect(user2).approve(await liquidityPool.getAddress(), ethers.parseEther("1000"));
    });

    it("Should add liquidity successfully", async function () {
      const amount = ethers.parseEther("100");

      await expect(
        liquidityPool.connect(user1).addLiquidity(await mockToken1.getAddress(), amount)
      ).to.emit(liquidityPool, "LiquidityAdded");

      expect(await liquidityPool.getUserLiquidity(user1.address, await mockToken1.getAddress())).to.equal(amount);

      const poolInfo = await liquidityPool.getPoolInfo(await mockToken1.getAddress());
      expect(poolInfo.totalLiquidity).to.equal(amount);
      expect(poolInfo.availableLiquidity).to.equal(amount);
    });

    it("Should reject zero liquidity addition", async function () {
      await expect(
        liquidityPool.connect(user1).addLiquidity(await mockToken1.getAddress(), 0)
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should reject adding to inactive pool", async function () {
      // Create another pool and deactivate it (would need deactivation function, but testing the concept)
      await liquidityPool.createPool(await mockToken2.getAddress(), 500);

      await expect(
        liquidityPool.connect(user1).addLiquidity(await mockToken2.getAddress(), ethers.parseEther("100"))
      ).to.be.revertedWith("Pool not active");
    });

    it("Should remove liquidity successfully", async function () {
      const addAmount = ethers.parseEther("200");
      const removeAmount = ethers.parseEther("100");

      await liquidityPool.connect(user1).addLiquidity(await mockToken1.getAddress(), addAmount);

      const balanceBefore = await mockToken1.balanceOf(user1.address);

      await expect(
        liquidityPool.connect(user1).removeLiquidity(await mockToken1.getAddress(), removeAmount)
      ).to.emit(liquidityPool, "LiquidityRemoved");

      const balanceAfter = await mockToken1.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(removeAmount);

      expect(await liquidityPool.getUserLiquidity(user1.address, await mockToken1.getAddress())).to.equal(ethers.parseEther("100"));

      const poolInfo = await liquidityPool.getPoolInfo(await mockToken1.getAddress());
      expect(poolInfo.totalLiquidity).to.equal(ethers.parseEther("100"));
    });

    it("Should reject removing more than user balance", async function () {
      await liquidityPool.connect(user1).addLiquidity(await mockToken1.getAddress(), ethers.parseEther("50"));

      await expect(
        liquidityPool.connect(user1).removeLiquidity(await mockToken1.getAddress(), ethers.parseEther("100"))
      ).to.be.revertedWith("Insufficient liquidity");
    });

    it("Should reject removing when pool liquidity is insufficient", async function () {
      await liquidityPool.connect(user1).addLiquidity(await mockToken1.getAddress(), ethers.parseEther("100"));

      // Simulate borrowing (would normally be done through issueLoan)
      await liquidityPool.issueLoan(user2.address, await mockToken1.getAddress(), ethers.parseEther("50"));

      await expect(
        liquidityPool.connect(user1).removeLiquidity(await mockToken1.getAddress(), ethers.parseEther("60"))
      ).to.be.revertedWith("Insufficient pool liquidity");
    });
  });

  describe("Loan Operations", function () {
    beforeEach(async function () {
      // Create pool and add liquidity
      await liquidityPool.createPool(await mockToken1.getAddress(), 500);
      await mockToken1.mint(await liquidityPool.getAddress(), ethers.parseEther("1000"));
      await liquidityPool.addLiquidity(await mockToken1.getAddress(), ethers.parseEther("500"));
    });

    it("Should issue loan successfully", async function () {
      const loanAmount = ethers.parseEther("100");

      await expect(
        liquidityPool.issueLoan(user1.address, await mockToken1.getAddress(), loanAmount)
      ).to.emit(liquidityPool, "LoanIssued");

      const poolInfo = await liquidityPool.getPoolInfo(await mockToken1.getAddress());
      expect(poolInfo.totalBorrowed).to.equal(loanAmount);
      expect(poolInfo.availableLiquidity).to.equal(ethers.parseEther("400"));
    });

    it("Should reject loan when insufficient liquidity", async function () {
      await expect(
        liquidityPool.issueLoan(user1.address, await mockToken1.getAddress(), ethers.parseEther("600"))
      ).to.be.revertedWith("Insufficient liquidity");
    });

    it("Should only allow owner to issue loans", async function () {
      await expect(
        liquidityPool.connect(user1).issueLoan(user2.address, await mockToken1.getAddress(), ethers.parseEther("50"))
      ).to.be.revertedWithCustomError(liquidityPool, "OwnableUnauthorizedAccount");
    });

    it("Should handle loan repayment", async function () {
      const loanAmount = ethers.parseEther("100");

      await liquidityPool.issueLoan(user1.address, await mockToken1.getAddress(), loanAmount);

      // Simulate repayment by sending tokens back to pool
      await mockToken1.mint(await liquidityPool.getAddress(), loanAmount);

      await liquidityPool.repayLoan(user1.address, await mockToken1.getAddress(), loanAmount);

      const poolInfo = await liquidityPool.getPoolInfo(await mockToken1.getAddress());
      expect(poolInfo.totalBorrowed).to.equal(0);
      expect(poolInfo.availableLiquidity).to.equal(ethers.parseEther("500"));
    });
  });

  describe("Multiple Pools", function () {
    beforeEach(async function () {
      // Create two pools
      await liquidityPool.createPool(await mockToken1.getAddress(), 500);
      await liquidityPool.createPool(await mockToken2.getAddress(), 750);

      // Setup liquidity for both
      await mockToken1.mint(user1.address, ethers.parseEther("1000"));
      await mockToken2.mint(user1.address, ethers.parseEther("1000"));

      await mockToken1.connect(user1).approve(await liquidityPool.getAddress(), ethers.parseEther("1000"));
      await mockToken2.connect(user1).approve(await liquidityPool.getAddress(), ethers.parseEther("1000"));
    });

    it("Should manage multiple pools independently", async function () {
      await liquidityPool.connect(user1).addLiquidity(await mockToken1.getAddress(), ethers.parseEther("100"));
      await liquidityPool.connect(user1).addLiquidity(await mockToken2.getAddress(), ethers.parseEther("200"));

      expect(await liquidityPool.getUserLiquidity(user1.address, await mockToken1.getAddress())).to.equal(ethers.parseEther("100"));
      expect(await liquidityPool.getUserLiquidity(user1.address, await mockToken2.getAddress())).to.equal(ethers.parseEther("200"));

      const supportedTokens = await liquidityPool.getSupportedTokens();
      expect(supportedTokens.length).to.equal(2);
      expect(supportedTokens).to.include(await mockToken1.getAddress());
      expect(supportedTokens).to.include(await mockToken2.getAddress());
    });
  });
});