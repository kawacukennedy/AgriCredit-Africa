const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonToken", function () {
  let carbonToken;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const CarbonToken = await ethers.getContractFactory("CarbonToken");
    carbonToken = await CarbonToken.deploy();
    await carbonToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await carbonToken.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await carbonToken.name()).to.equal("AgriCredit Carbon Token");
      expect(await carbonToken.symbol()).to.equal("CARBT");
    });

    it("Should have correct decimals", async function () {
      expect(await carbonToken.decimals()).to.equal(18);
    });
  });

  describe("Minting Carbon Tokens", function () {
    it("Should mint tokens successfully", async function () {
      const carbonAmount = ethers.parseEther("10"); // 10 tons
      const verificationProof = "ipfs://QmTest123";

      await expect(
        carbonToken.mintCarbonTokens(user1.address, carbonAmount, verificationProof)
      ).to.emit(carbonToken, "CarbonOffsetMinted");

      expect(await carbonToken.balanceOf(user1.address)).to.equal(carbonAmount);
      expect(await carbonToken.getCarbonOffset(user1.address)).to.equal(carbonAmount);
      expect(await carbonToken.totalCarbonOffset()).to.equal(carbonAmount);
    });

    it("Should reject minting with zero amount", async function () {
      const verificationProof = "ipfs://QmTest123";

      await expect(
        carbonToken.mintCarbonTokens(user1.address, 0, verificationProof)
      ).to.be.revertedWith("Carbon amount must be > 0");
    });

    it("Should reject minting without verification proof", async function () {
      const carbonAmount = ethers.parseEther("10");

      await expect(
        carbonToken.mintCarbonTokens(user1.address, carbonAmount, "")
      ).to.be.revertedWith("Verification proof required");
    });

    it("Should only allow owner to mint", async function () {
      const carbonAmount = ethers.parseEther("10");
      const verificationProof = "ipfs://QmTest123";

      await expect(
        carbonToken.connect(user1).mintCarbonTokens(user2.address, carbonAmount, verificationProof)
      ).to.be.revertedWithCustomError(carbonToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burning Carbon Tokens", function () {
    beforeEach(async function () {
      const carbonAmount = ethers.parseEther("10");
      const verificationProof = "ipfs://QmTest123";
      await carbonToken.mintCarbonTokens(user1.address, carbonAmount, verificationProof);
    });

    it("Should burn tokens successfully", async function () {
      const burnAmount = ethers.parseEther("5");

      await expect(
        carbonToken.connect(user1).burnCarbonTokens(burnAmount)
      ).to.emit(carbonToken, "CarbonOffsetBurned");

      expect(await carbonToken.balanceOf(user1.address)).to.equal(ethers.parseEther("5"));
      expect(await carbonToken.getCarbonOffset(user1.address)).to.equal(ethers.parseEther("5"));
    });

    it("Should reject burning more than balance", async function () {
      const burnAmount = ethers.parseEther("15");

      await expect(
        carbonToken.connect(user1).burnCarbonTokens(burnAmount)
      ).to.be.revertedWith("Insufficient CARBT balance");
    });
  });

  describe("Carbon Offset Tracking", function () {
    it("Should track multiple users' carbon offsets", async function () {
      const amount1 = ethers.parseEther("5");
      const amount2 = ethers.parseEther("8");
      const proof1 = "ipfs://QmTest1";
      const proof2 = "ipfs://QmTest2";

      await carbonToken.mintCarbonTokens(user1.address, amount1, proof1);
      await carbonToken.mintCarbonTokens(user2.address, amount2, proof2);

      expect(await carbonToken.getCarbonOffset(user1.address)).to.equal(amount1);
      expect(await carbonToken.getCarbonOffset(user2.address)).to.equal(amount2);
      expect(await carbonToken.totalCarbonOffset()).to.equal(amount1 + amount2);
    });

    it("Should update offsets correctly after burning", async function () {
      const mintAmount = ethers.parseEther("10");
      const burnAmount = ethers.parseEther("3");
      const proof = "ipfs://QmTest123";

      await carbonToken.mintCarbonTokens(user1.address, mintAmount, proof);
      await carbonToken.connect(user1).burnCarbonTokens(burnAmount);

      expect(await carbonToken.getCarbonOffset(user1.address)).to.equal(mintAmount - burnAmount);
      expect(await carbonToken.totalCarbonOffset()).to.equal(mintAmount - burnAmount);
    });
  });
});