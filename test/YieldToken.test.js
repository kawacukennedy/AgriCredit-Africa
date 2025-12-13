import { expect } from "chai";
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("YieldToken", function () {
  let yieldToken, mockToken;
  let owner, user1, user2;
  const TOKEN_NAME = "Yield Token";
  const TOKEN_SYMBOL = "YIELD";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock underlying token
    const MockToken = await ethers.getContractFactory("AgriCredit");
    mockToken = await MockToken.deploy();
    await mockToken.waitForDeployment();

    // Deploy YieldToken
    const YieldToken = await ethers.getContractFactory("YieldToken");
    yieldToken = await YieldToken.deploy(
      await mockToken.getAddress(),
      TOKEN_NAME,
      TOKEN_SYMBOL
    );
    await yieldToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await yieldToken.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await yieldToken.name()).to.equal(TOKEN_NAME);
      expect(await yieldToken.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should set underlying token correctly", async function () {
      expect(await yieldToken.underlyingToken()).to.equal(await mockToken.getAddress());
    });
  });

  describe("Deposits", function () {
    beforeEach(async function () {
      // Mint tokens to users
      await mockToken.mint(user1.address, ethers.parseEther("1000"));
      await mockToken.mint(user2.address, ethers.parseEther("1000"));

      // Approve YieldToken contract
      await mockToken.connect(user1).approve(await yieldToken.getAddress(), ethers.parseEther("1000"));
      await mockToken.connect(user2).approve(await yieldToken.getAddress(), ethers.parseEther("1000"));
    });

    it("Should deposit tokens successfully", async function () {
      const depositAmount = ethers.parseEther("100");

      await expect(
        yieldToken.connect(user1).deposit(depositAmount)
      ).to.emit(yieldToken, "Deposited");

      expect(await yieldToken.balanceOf(user1.address)).to.equal(depositAmount);
      expect(await yieldToken.totalStaked()).to.equal(depositAmount);

      const position = await yieldToken.getPosition(user1.address);
      expect(position.amount).to.equal(depositAmount);
      expect(position.depositTime).to.equal(await time.latest());
      expect(position.lastClaimTime).to.equal(await time.latest());
    });

    it("Should reject zero deposit", async function () {
      await expect(
        yieldToken.connect(user1).deposit(0)
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should handle multiple deposits", async function () {
      const deposit1 = ethers.parseEther("50");
      const deposit2 = ethers.parseEther("30");

      await yieldToken.connect(user1).deposit(deposit1);
      await yieldToken.connect(user1).deposit(deposit2);

      expect(await yieldToken.balanceOf(user1.address)).to.equal(deposit1 + deposit2);
      expect(await yieldToken.totalStaked()).to.equal(deposit1 + deposit2);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      // Setup deposits
      await mockToken.mint(user1.address, ethers.parseEther("1000"));
      await mockToken.connect(user1).approve(await yieldToken.getAddress(), ethers.parseEther("1000"));
      await yieldToken.connect(user1).deposit(ethers.parseEther("100"));
    });

    it("Should withdraw tokens successfully", async function () {
      const withdrawAmount = ethers.parseEther("50");

      const balanceBefore = await mockToken.balanceOf(user1.address);

      await expect(
        yieldToken.connect(user1).withdraw(withdrawAmount)
      ).to.emit(yieldToken, "Withdrawn");

      const balanceAfter = await mockToken.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(withdrawAmount);
      expect(await yieldToken.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
      expect(await yieldToken.totalStaked()).to.equal(ethers.parseEther("50"));
    });

    it("Should reject withdrawal of more than balance", async function () {
      await expect(
        yieldToken.connect(user1).withdraw(ethers.parseEther("150"))
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should reject zero withdrawal", async function () {
      await expect(
        yieldToken.connect(user1).withdraw(0)
      ).to.be.revertedWith("Amount must be > 0");
    });
  });

  describe("Yield Calculation and Claiming", function () {
    beforeEach(async function () {
      // Setup deposits
      await mockToken.mint(user1.address, ethers.parseEther("1000"));
      await mockToken.connect(user1).approve(await yieldToken.getAddress(), ethers.parseEther("1000"));
      await yieldToken.connect(user1).deposit(ethers.parseEther("100"));
    });

    it("Should calculate pending yield correctly", async function () {
      // Advance time by 1 year
      await time.increase(365 * 24 * 60 * 60);

      const pendingYield = await yieldToken.calculatePendingYield(user1.address);
      // Expected: 100 * 5% * 1 year = 5 tokens
      const expectedYield = ethers.parseEther("5");
      expect(pendingYield).to.be.closeTo(expectedYield, ethers.parseEther("0.1")); // Allow small rounding difference
    });

    it("Should claim yield successfully", async function () {
      // Advance time
      await time.increase(365 * 24 * 60 * 60);

      const balanceBefore = await yieldToken.balanceOf(user1.address);

      await expect(
        yieldToken.connect(user1).claimYield()
      ).to.emit(yieldToken, "YieldClaimed");

      const balanceAfter = await yieldToken.balanceOf(user1.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should accumulate yield over multiple claims", async function () {
      // First period
      await time.increase(182.5 * 24 * 60 * 60); // 6 months
      await yieldToken.connect(user1).claimYield();

      // Second period
      await time.increase(182.5 * 24 * 60 * 60); // Another 6 months
      await yieldToken.connect(user1).claimYield();

      const position = await yieldToken.getPosition(user1.address);
      // Should have accumulated approximately 5 tokens total
      expect(position.totalAccumulated).to.be.closeTo(ethers.parseEther("5"), ethers.parseEther("0.2"));
    });
  });

  describe("Position Management", function () {
    beforeEach(async function () {
      await mockToken.mint(user1.address, ethers.parseEther("1000"));
      await mockToken.connect(user1).approve(await yieldToken.getAddress(), ethers.parseEther("1000"));
    });

    it("Should return correct position data", async function () {
      await yieldToken.connect(user1).deposit(ethers.parseEther("100"));

      const position = await yieldToken.getPosition(user1.address);
      expect(position.amount).to.equal(ethers.parseEther("100"));
      expect(position.pendingYield).to.equal(0);
      expect(position.totalAccumulated).to.equal(0);
    });

    it("Should update position after yield accumulation", async function () {
      await yieldToken.connect(user1).deposit(ethers.parseEther("100"));
      await time.increase(365 * 24 * 60 * 60);

      const position = await yieldToken.getPosition(user1.address);
      expect(position.amount).to.equal(ethers.parseEther("100"));
      expect(position.pendingYield).to.be.greaterThan(0);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner emergency withdraw", async function () {
      // Fund contract with tokens
      await mockToken.mint(await yieldToken.getAddress(), ethers.parseEther("1000"));

      const balanceBefore = await mockToken.balanceOf(owner.address);
      await yieldToken.emergencyWithdraw();
      const balanceAfter = await mockToken.balanceOf(owner.address);

      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1000"));
    });

    it("Should reject emergency withdraw from non-owner", async function () {
      await expect(
        yieldToken.connect(user1).emergencyWithdraw()
      ).to.be.revertedWithCustomError(yieldToken, "OwnableUnauthorizedAccount");
    });
  });
});