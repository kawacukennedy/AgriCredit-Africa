const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IdentityRegistry", function () {
  let identityRegistry;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();
  });

  describe("Identity Creation", function () {
    it("Should create identity successfully", async function () {
      const did = "did:agricredit:123456";
      await identityRegistry.createIdentity(did, user1.address);

      const identity = await identityRegistry.getIdentity(user1.address);
      expect(identity.did).to.equal(did);
      expect(identity.wallet).to.equal(user1.address);
      expect(identity.reputationScore).to.equal(500);
      expect(identity.isVerified).to.equal(true);
    });

    it("Should prevent duplicate identities", async function () {
      const did = "did:agricredit:123456";
      await identityRegistry.createIdentity(did, user1.address);

      await expect(
        identityRegistry.createIdentity(did, user2.address)
      ).to.be.revertedWith("DID already registered");
    });

    it("Should prevent duplicate wallet identities", async function () {
      const did1 = "did:agricredit:123456";
      const did2 = "did:agricredit:789012";

      await identityRegistry.createIdentity(did1, user1.address);

      await expect(
        identityRegistry.createIdentity(did2, user1.address)
      ).to.be.revertedWith("Identity already exists");
    });
  });

  describe("Reputation Management", function () {
    beforeEach(async function () {
      const did = "did:agricredit:123456";
      await identityRegistry.createIdentity(did, user1.address);
    });

    it("Should update reputation score", async function () {
      await identityRegistry.updateReputation(user1.address, 750);

      const score = await identityRegistry.getReputationScore(user1.address);
      expect(score).to.equal(750);
    });

    it("Should reject invalid reputation scores", async function () {
      await expect(
        identityRegistry.updateReputation(user1.address, 1500)
      ).to.be.revertedWith("Score must be <= 1000");
    });

    it("Should check identity verification", async function () {
      expect(await identityRegistry.isIdentityVerified(user1.address)).to.equal(true);
      expect(await identityRegistry.isIdentityVerified(user2.address)).to.equal(false);
    });
  });
});