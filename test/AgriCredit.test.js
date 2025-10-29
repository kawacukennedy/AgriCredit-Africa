import { expect } from "chai";
import { ethers } from "hardhat";

describe("AgriCredit", function () {
  let agriCredit;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const AgriCredit = await ethers.getContractFactory("AgriCredit");
    agriCredit = await AgriCredit.deploy();
    await agriCredit.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await agriCredit.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await agriCredit.name()).to.equal("AgriCredit Token");
      expect(await agriCredit.symbol()).to.equal("AGRC");
    });

    it("Should mint initial supply to owner", async function () {
      const initialSupply = ethers.parseEther("1000000"); // 1 million tokens
      expect(await agriCredit.balanceOf(owner.address)).to.equal(initialSupply);
      expect(await agriCredit.totalSupply()).to.equal(initialSupply);
    });

    it("Should have correct decimals", async function () {
      expect(await agriCredit.decimals()).to.equal(18);
    });
  });

  describe("Minting", function () {
    it("Should mint tokens successfully", async function () {
      const mintAmount = ethers.parseEther("50000");

      await expect(
        agriCredit.mint(user1.address, mintAmount)
      ).to.emit(agriCredit, "Transfer");

      expect(await agriCredit.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await agriCredit.totalSupply()).to.equal(ethers.parseEther("1050000")); // Initial + minted
    });

    it("Should only allow owner to mint", async function () {
      const mintAmount = ethers.parseEther("10000");

      await expect(
        agriCredit.connect(user1).mint(user2.address, mintAmount)
      ).to.be.revertedWithCustomError(agriCredit, "OwnableUnauthorizedAccount");
    });

    it("Should mint to multiple addresses", async function () {
      const amount1 = ethers.parseEther("25000");
      const amount2 = ethers.parseEther("35000");

      await agriCredit.mint(user1.address, amount1);
      await agriCredit.mint(user2.address, amount2);

      expect(await agriCredit.balanceOf(user1.address)).to.equal(amount1);
      expect(await agriCredit.balanceOf(user2.address)).to.equal(amount2);
      expect(await agriCredit.totalSupply()).to.equal(ethers.parseEther("1070000"));
    });
  });

  describe("ERC20 Functionality", function () {
    beforeEach(async function () {
      // Mint tokens to users for testing transfers
      await agriCredit.mint(user1.address, ethers.parseEther("10000"));
      await agriCredit.mint(user2.address, ethers.parseEther("5000"));
    });

    it("Should transfer tokens successfully", async function () {
      const transferAmount = ethers.parseEther("2500");

      await expect(
        agriCredit.connect(user1).transfer(user2.address, transferAmount)
      ).to.emit(agriCredit, "Transfer");

      expect(await agriCredit.balanceOf(user1.address)).to.equal(ethers.parseEther("7500"));
      expect(await agriCredit.balanceOf(user2.address)).to.equal(ethers.parseEther("7500"));
    });

    it("Should reject transfer of insufficient balance", async function () {
      const transferAmount = ethers.parseEther("15000"); // More than user1 has

      await expect(
        agriCredit.connect(user1).transfer(user2.address, transferAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should handle approve and transferFrom", async function () {
      const approveAmount = ethers.parseEther("3000");
      const transferAmount = ethers.parseEther("2000");

      // Approve user2 to spend user1's tokens
      await expect(
        agriCredit.connect(user1).approve(user2.address, approveAmount)
      ).to.emit(agriCredit, "Approval");

      expect(await agriCredit.allowance(user1.address, user2.address)).to.equal(approveAmount);

      // Transfer from user1 to owner using user2's allowance
      await expect(
        agriCredit.connect(user2).transferFrom(user1.address, owner.address, transferAmount)
      ).to.emit(agriCredit, "Transfer");

      expect(await agriCredit.balanceOf(user1.address)).to.equal(ethers.parseEther("8000"));
      expect(await agriCredit.balanceOf(owner.address)).to.equal(ethers.parseEther("10002000")); // Initial + transferred
      expect(await agriCredit.allowance(user1.address, user2.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should reject transferFrom without sufficient allowance", async function () {
      const transferAmount = ethers.parseEther("2000");

      // Try to transfer without approval
      await expect(
        agriCredit.connect(user2).transferFrom(user1.address, owner.address, transferAmount)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should reject transfer to zero address", async function () {
      const transferAmount = ethers.parseEther("1000");

      await expect(
        agriCredit.connect(user1).transfer(ethers.ZeroAddress, transferAmount)
      ).to.be.revertedWith("ERC20: transfer to the zero address");
    });
  });

  describe("Total Supply", function () {
    it("Should maintain correct total supply", async function () {
      const initialSupply = await agriCredit.totalSupply();

      // Mint more tokens
      await agriCredit.mint(user1.address, ethers.parseEther("10000"));
      expect(await agriCredit.totalSupply()).to.equal(initialSupply + ethers.parseEther("10000"));

      // Transfer tokens (should not change total supply)
      await agriCredit.connect(user1).transfer(user2.address, ethers.parseEther("5000"));
      expect(await agriCredit.totalSupply()).to.equal(initialSupply + ethers.parseEther("10000"));
    });
  });
});