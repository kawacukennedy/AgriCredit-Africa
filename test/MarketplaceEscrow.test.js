import { expect } from "chai";
const { ethers } = require("hardhat");

describe("MarketplaceEscrow", function () {
  let marketplaceEscrow, mockToken;
  let owner, buyer, seller;

  beforeEach(async function () {
    [owner, buyer, seller] = await ethers.getSigners();

    // Deploy mock token
    const MockToken = await ethers.getContractFactory("AgriCredit");
    mockToken = await MockToken.deploy();
    await mockToken.waitForDeployment();

    // Deploy MarketplaceEscrow
    const MarketplaceEscrow = await ethers.getContractFactory("MarketplaceEscrow");
    marketplaceEscrow = await MarketplaceEscrow.deploy();
    await marketplaceEscrow.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await marketplaceEscrow.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct next escrow ID", async function () {
      expect(await marketplaceEscrow.nextEscrowId()).to.equal(1);
    });
  });

  describe("Escrow Creation", function () {
    it("Should create escrow successfully", async function () {
      const amount = ethers.parseEther("100");

      await expect(
        marketplaceEscrow.connect(buyer).createEscrow(seller.address, amount, await mockToken.getAddress())
      ).to.emit(marketplaceEscrow, "EscrowCreated");

      expect(await marketplaceEscrow.nextEscrowId()).to.equal(2);

      const escrow = await marketplaceEscrow.getEscrow(1);
      expect(escrow.buyer).to.equal(buyer.address);
      expect(escrow.seller).to.equal(seller.address);
      expect(escrow.amount).to.equal(amount);
      expect(escrow.token).to.equal(await mockToken.getAddress());
      expect(escrow.status).to.equal(0); // Created
    });

    it("Should reject zero amount", async function () {
      await expect(
        marketplaceEscrow.connect(buyer).createEscrow(seller.address, 0, await mockToken.getAddress())
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should increment escrow IDs correctly", async function () {
      await marketplaceEscrow.connect(buyer).createEscrow(seller.address, ethers.parseEther("50"), await mockToken.getAddress());
      await marketplaceEscrow.connect(buyer).createEscrow(seller.address, ethers.parseEther("75"), await mockToken.getAddress());

      expect(await marketplaceEscrow.nextEscrowId()).to.equal(3);
    });
  });

  describe("Escrow Funding", function () {
    beforeEach(async function () {
      // Create escrow
      await marketplaceEscrow.connect(buyer).createEscrow(seller.address, ethers.parseEther("100"), await mockToken.getAddress());

      // Mint tokens to buyer and approve escrow contract
      await mockToken.mint(buyer.address, ethers.parseEther("200"));
      await mockToken.connect(buyer).approve(await marketplaceEscrow.getAddress(), ethers.parseEther("200"));
    });

    it("Should fund escrow successfully", async function () {
      await expect(
        marketplaceEscrow.connect(buyer).fundEscrow(1)
      ).to.emit(marketplaceEscrow, "EscrowFunded");

      const escrow = await marketplaceEscrow.getEscrow(1);
      expect(escrow.status).to.equal(1); // Funded

      expect(await mockToken.balanceOf(await marketplaceEscrow.getAddress())).to.equal(ethers.parseEther("100"));
      expect(await mockToken.balanceOf(buyer.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should reject funding by non-buyer", async function () {
      await expect(
        marketplaceEscrow.connect(seller).fundEscrow(1)
      ).to.be.revertedWith("Only buyer can fund");
    });

    it("Should reject funding already funded escrow", async function () {
      await marketplaceEscrow.connect(buyer).fundEscrow(1);

      await expect(
        marketplaceEscrow.connect(buyer).fundEscrow(1)
      ).to.be.revertedWith("Escrow not in created state");
    });
  });

  describe("Delivery Confirmation", function () {
    beforeEach(async function () {
      // Create and fund escrow
      await marketplaceEscrow.connect(buyer).createEscrow(seller.address, ethers.parseEther("100"), await mockToken.getAddress());
      await mockToken.mint(buyer.address, ethers.parseEther("200"));
      await mockToken.connect(buyer).approve(await marketplaceEscrow.getAddress(), ethers.parseEther("200"));
      await marketplaceEscrow.connect(buyer).fundEscrow(1);
    });

    it("Should confirm delivery successfully", async function () {
      const proof = "ipfs://QmDeliveryProof123";

      await expect(
        marketplaceEscrow.confirmDelivery(1, proof)
      ).to.emit(marketplaceEscrow, "DeliveryConfirmed");

      const escrow = await marketplaceEscrow.getEscrow(1);
      expect(escrow.status).to.equal(2); // Delivered
      expect(escrow.deliveryProof).to.equal(proof);
      expect(escrow.deliveredAt).to.be.greaterThan(0);
    });

    it("Should only allow owner to confirm delivery", async function () {
      await expect(
        marketplaceEscrow.connect(buyer).confirmDelivery(1, "proof")
      ).to.be.revertedWithCustomError(marketplaceEscrow, "OwnableUnauthorizedAccount");
    });

    it("Should reject delivery confirmation for unfunded escrow", async function () {
      // Create another escrow but don't fund it
      await marketplaceEscrow.connect(buyer).createEscrow(seller.address, ethers.parseEther("50"), await mockToken.getAddress());

      await expect(
        marketplaceEscrow.confirmDelivery(2, "proof")
      ).to.be.revertedWith("Escrow not funded");
    });
  });

  describe("Escrow Completion", function () {
    beforeEach(async function () {
      // Create, fund, and confirm delivery
      await marketplaceEscrow.connect(buyer).createEscrow(seller.address, ethers.parseEther("100"), await mockToken.getAddress());
      await mockToken.mint(buyer.address, ethers.parseEther("200"));
      await mockToken.connect(buyer).approve(await marketplaceEscrow.getAddress(), ethers.parseEther("200"));
      await marketplaceEscrow.connect(buyer).fundEscrow(1);
      await marketplaceEscrow.confirmDelivery(1, "ipfs://proof");
    });

    it("Should complete escrow successfully", async function () {
      const sellerBalanceBefore = await mockToken.balanceOf(seller.address);

      await expect(
        marketplaceEscrow.connect(seller).completeEscrow(1)
      ).to.emit(marketplaceEscrow, "EscrowCompleted");

      const sellerBalanceAfter = await mockToken.balanceOf(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(ethers.parseEther("100"));

      const escrow = await marketplaceEscrow.getEscrow(1);
      expect(escrow.status).to.equal(3); // Completed

      expect(await mockToken.balanceOf(await marketplaceEscrow.getAddress())).to.equal(0);
    });

    it("Should only allow seller to complete escrow", async function () {
      await expect(
        marketplaceEscrow.connect(buyer).completeEscrow(1)
      ).to.be.revertedWith("Only seller can complete");
    });

    it("Should reject completion of non-delivered escrow", async function () {
      // Create and fund another escrow but don't confirm delivery
      await marketplaceEscrow.connect(buyer).createEscrow(seller.address, ethers.parseEther("50"), await mockToken.getAddress());
      await mockToken.connect(buyer).approve(await marketplaceEscrow.getAddress(), ethers.parseEther("50"));
      await marketplaceEscrow.connect(buyer).fundEscrow(2);

      await expect(
        marketplaceEscrow.connect(seller).completeEscrow(2)
      ).to.be.revertedWith("Delivery not confirmed");
    });
  });

  describe("Escrow Cancellation", function () {
    it("Should cancel unfunded escrow", async function () {
      await marketplaceEscrow.connect(buyer).createEscrow(seller.address, ethers.parseEther("100"), await mockToken.getAddress());

      await expect(
        marketplaceEscrow.connect(buyer).cancelEscrow(1)
      ).to.emit(marketplaceEscrow, "EscrowCancelled");

      const escrow = await marketplaceEscrow.getEscrow(1);
      expect(escrow.status).to.equal(4); // Cancelled
    });

    it("Should cancel funded escrow and refund buyer", async function () {
      // Create and fund escrow
      await marketplaceEscrow.connect(buyer).createEscrow(seller.address, ethers.parseEther("100"), await mockToken.getAddress());
      await mockToken.mint(buyer.address, ethers.parseEther("200"));
      await mockToken.connect(buyer).approve(await marketplaceEscrow.getAddress(), ethers.parseEther("200"));
      await marketplaceEscrow.connect(buyer).fundEscrow(1);

      const buyerBalanceBefore = await mockToken.balanceOf(buyer.address);

      await expect(
        marketplaceEscrow.connect(buyer).cancelEscrow(1)
      ).to.emit(marketplaceEscrow, "EscrowCancelled");

      const buyerBalanceAfter = await mockToken.balanceOf(buyer.address);
      expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(ethers.parseEther("100"));

      const escrow = await marketplaceEscrow.getEscrow(1);
      expect(escrow.status).to.equal(4); // Cancelled
    });

    it("Should allow seller to cancel escrow", async function () {
      await marketplaceEscrow.connect(buyer).createEscrow(seller.address, ethers.parseEther("100"), await mockToken.getAddress());

      await expect(
        marketplaceEscrow.connect(seller).cancelEscrow(1)
      ).to.emit(marketplaceEscrow, "EscrowCancelled");
    });

    it("Should allow owner to cancel any escrow", async function () {
      await marketplaceEscrow.connect(buyer).createEscrow(seller.address, ethers.parseEther("100"), await mockToken.getAddress());

      await expect(
        marketplaceEscrow.cancelEscrow(1)
      ).to.emit(marketplaceEscrow, "EscrowCancelled");
    });

    it("Should reject cancellation of completed escrow", async function () {
      // Complete a full escrow cycle
      await marketplaceEscrow.connect(buyer).createEscrow(seller.address, ethers.parseEther("100"), await mockToken.getAddress());
      await mockToken.mint(buyer.address, ethers.parseEther("200"));
      await mockToken.connect(buyer).approve(await marketplaceEscrow.getAddress(), ethers.parseEther("200"));
      await marketplaceEscrow.connect(buyer).fundEscrow(1);
      await marketplaceEscrow.confirmDelivery(1, "proof");
      await marketplaceEscrow.connect(seller).completeEscrow(1);

      await expect(
        marketplaceEscrow.connect(buyer).cancelEscrow(1)
      ).to.be.revertedWith("Cannot cancel completed escrow");
    });
  });

  describe("Query Functions", function () {
    it("Should return correct escrow data", async function () {
      await marketplaceEscrow.connect(buyer).createEscrow(seller.address, ethers.parseEther("150"), await mockToken.getAddress());

      const escrow = await marketplaceEscrow.getEscrow(1);
      expect(escrow.id).to.equal(1);
      expect(escrow.buyer).to.equal(buyer.address);
      expect(escrow.seller).to.equal(seller.address);
      expect(escrow.amount).to.equal(ethers.parseEther("150"));
      expect(escrow.status).to.equal(0); // Created
      expect(escrow.createdAt).to.be.greaterThan(0);
    });
  });
});