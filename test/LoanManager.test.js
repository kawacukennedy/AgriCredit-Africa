import { expect } from "chai";
import { ethers } from "hardhat";

describe("LoanManager", function () {
  let loanManager, identityRegistry, mockToken;
  let borrower, lender;

  beforeEach(async function () {
    [, borrower, lender] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("AgriCredit");
    mockToken = await MockToken.deploy();
    await mockToken.waitForDeployment();

    // Deploy IdentityRegistry
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();

    // Deploy LoanManager
    const LoanManager = await ethers.getContractFactory("LoanManager");
    loanManager = await LoanManager.deploy(
      await identityRegistry.getAddress(),
      await mockToken.getAddress()
    );
    await loanManager.waitForDeployment();

    // Setup identity for borrower
    await identityRegistry.createIdentity("did:agricredit:borrower", borrower.address);

    // Mint tokens to loan manager for lending
    await mockToken.mint(await loanManager.getAddress(), ethers.parseEther("10000"));
  });

  describe("Loan Creation", function () {
    it("Should create loan successfully", async function () {
      const amount = ethers.parseEther("1000");
      const interestRate = 850; // 8.5%
      const duration = 365 * 24 * 60 * 60; // 1 year

      await expect(
        loanManager.createLoan(borrower.address, amount, interestRate, duration)
      ).to.emit(loanManager, "LoanCreated");

      const loan = await loanManager.getLoan(1);
      expect(loan.amount).to.equal(amount);
      expect(loan.borrower).to.equal(borrower.address);
      expect(loan.interestRate).to.equal(interestRate);
    });

    it("Should reject loan for unverified borrower", async function () {
      const amount = ethers.parseEther("1000");
      const interestRate = 850;
      const duration = 365 * 24 * 60 * 60;

      await expect(
        loanManager.createLoan(lender.address, amount, interestRate, duration)
      ).to.be.revertedWith("Borrower not verified");
    });

    it("Should transfer funds to borrower", async function () {
      const amount = ethers.parseEther("1000");
      const interestRate = 850;
      const duration = 365 * 24 * 60 * 60;

      const balanceBefore = await mockToken.balanceOf(borrower.address);
      await loanManager.createLoan(borrower.address, amount, interestRate, duration);
      const balanceAfter = await mockToken.balanceOf(borrower.address);

      expect(balanceAfter - balanceBefore).to.equal(amount);
    });
  });

  describe("Loan Repayment", function () {
    let loanId;

    beforeEach(async function () {
      const amount = ethers.parseEther("1000");
      const interestRate = 850;
      const duration = 365 * 24 * 60 * 60;

      await loanManager.createLoan(borrower.address, amount, interestRate, duration);
      loanId = 1;

      // Mint tokens to borrower for repayment
      await mockToken.mint(borrower.address, ethers.parseEther("2000"));
    });

    it("Should accept loan repayment", async function () {
      const repayAmount = ethers.parseEther("500");

      // Approve tokens for repayment
      await mockToken.connect(borrower).approve(await loanManager.getAddress(), repayAmount);

      await expect(
        loanManager.connect(borrower).repayLoan(loanId, repayAmount)
      ).to.emit(loanManager, "LoanRepaid");

      const loan = await loanManager.getLoan(loanId);
      expect(loan.repaidAmount).to.equal(repayAmount);
    });

    it("Should complete loan when fully repaid", async function () {
      const totalOwed = await loanManager.calculateTotalOwed(loanId);

      // Approve and repay full amount
      await mockToken.connect(borrower).approve(await loanManager.getAddress(), totalOwed);
      await loanManager.connect(borrower).repayLoan(loanId, totalOwed);

      const loan = await loanManager.getLoan(loanId);
      expect(loan.isRepaid).to.equal(true);
      expect(loan.isActive).to.equal(false);
    });

    it("Should reject repayment from non-borrower", async function () {
      const repayAmount = ethers.parseEther("500");
      await mockToken.connect(lender).approve(await loanManager.getAddress(), repayAmount);

      await expect(
        loanManager.connect(lender).repayLoan(loanId, repayAmount)
      ).to.be.revertedWith("Not the borrower");
    });
  });

  describe("Loan Calculations", function () {
    it("Should calculate total owed correctly", async function () {
      const amount = ethers.parseEther("1000");
      const interestRate = 1000; // 10%
      const duration = 365 * 24 * 60 * 60; // 1 year

      await loanManager.createLoan(borrower.address, amount, interestRate, duration);

      const totalOwed = await loanManager.calculateTotalOwed(1);
      const expectedInterest = (amount * BigInt(interestRate) * BigInt(duration)) / (BigInt(365 * 24 * 60 * 60) * BigInt(10000));
      const expectedTotal = amount + expectedInterest;

      expect(totalOwed).to.equal(expectedTotal);
    });
  });
});