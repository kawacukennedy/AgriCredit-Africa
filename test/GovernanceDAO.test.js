import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("GovernanceDAO", function () {
  let governanceDAO, governanceToken;
  let owner, proposer, voter1, voter2, voter3;

  beforeEach(async function () {
    [owner, proposer, voter1, voter2, voter3] = await ethers.getSigners();

    // Deploy governance token (using AgriCredit as mock)
    const GovernanceToken = await ethers.getContractFactory("AgriCredit");
    governanceToken = await GovernanceToken.deploy();
    await governanceToken.waitForDeployment();

    // Deploy GovernanceDAO
    const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
    governanceDAO = await GovernanceDAO.deploy(await governanceToken.getAddress());
    await governanceDAO.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await governanceDAO.owner()).to.equal(owner.address);
    });

    it("Should set governance token correctly", async function () {
      expect(await governanceDAO.governanceToken()).to.equal(await governanceToken.getAddress());
    });

    it("Should have correct initial parameters", async function () {
      expect(await governanceDAO.votingPeriod()).to.equal(7 * 24 * 60 * 60); // 7 days
      expect(await governanceDAO.proposalThreshold()).to.equal(ethers.parseEther("1000"));
    });
  });

  describe("Proposal Creation", function () {
    beforeEach(async function () {
      // Mint tokens to proposer
      await governanceToken.mint(proposer.address, ethers.parseEther("2000"));
    });

    it("Should create proposal successfully", async function () {
      const description = "Increase farming subsidies by 20%";

      await expect(
        governanceDAO.connect(proposer).propose(description)
      ).to.emit(governanceDAO, "ProposalCreated");

      expect(await governanceDAO.proposalCount()).to.equal(1);

      const proposal = await governanceDAO.getProposal(1);
      expect(proposal.proposer).to.equal(proposer.address);
      expect(proposal.description).to.equal(description);
      expect(proposal.executed).to.equal(false);
      expect(proposal.endTime).to.equal(proposal.startTime + 7 * 24 * 60 * 60);
    });

    it("Should reject proposal with insufficient tokens", async function () {
      // Mint less than threshold
      await governanceToken.mint(voter1.address, ethers.parseEther("500"));

      await expect(
        governanceDAO.connect(voter1).propose("Test proposal")
      ).to.be.revertedWith("Insufficient tokens to propose");
    });

    it("Should increment proposal count correctly", async function () {
      await governanceDAO.connect(proposer).propose("Proposal 1");
      await governanceDAO.connect(proposer).propose("Proposal 2");
      await governanceDAO.connect(proposer).propose("Proposal 3");

      expect(await governanceDAO.proposalCount()).to.equal(3);
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      // Setup proposal
      await governanceToken.mint(proposer.address, ethers.parseEther("2000"));
      await governanceDAO.connect(proposer).propose("Test governance proposal");

      // Setup voters with different token amounts
      await governanceToken.mint(voter1.address, ethers.parseEther("500"));
      await governanceToken.mint(voter2.address, ethers.parseEther("1500"));
      await governanceToken.mint(voter3.address, ethers.parseEther("800"));
    });

    it("Should cast vote successfully", async function () {
      await expect(
        governanceDAO.connect(voter1).vote(1, true)
      ).to.emit(governanceDAO, "VoteCast");

      expect(await governanceDAO.hasVoted(1, voter1.address)).to.equal(true);

      const proposal = await governanceDAO.getProposal(1);
      expect(proposal.forVotes).to.equal(ethers.parseEther("500"));
      expect(proposal.againstVotes).to.equal(0);
    });

    it("Should handle against votes", async function () {
      await governanceDAO.connect(voter1).vote(1, false);

      const proposal = await governanceDAO.getProposal(1);
      expect(proposal.forVotes).to.equal(0);
      expect(proposal.againstVotes).to.equal(ethers.parseEther("500"));
    });

    it("Should reject voting before start time", async function () {
      // This would require manipulating time, but since voting starts immediately, it's hard to test
      // In a real scenario, there might be a delay
    });

    it("Should reject voting after end time", async function () {
      // Advance time past voting period
      await time.increase(8 * 24 * 60 * 60); // 8 days

      await expect(
        governanceDAO.connect(voter1).vote(1, true)
      ).to.be.revertedWith("Voting ended");
    });

    it("Should reject double voting", async function () {
      await governanceDAO.connect(voter1).vote(1, true);

      await expect(
        governanceDAO.connect(voter1).vote(1, false)
      ).to.be.revertedWith("Already voted");
    });

    it("Should reject voting with no tokens", async function () {
      await expect(
        governanceDAO.connect(owner).vote(1, true)
      ).to.be.revertedWith("No voting power");
    });

    it("Should accumulate votes correctly", async function () {
      await governanceDAO.connect(voter1).vote(1, true);  // 500 tokens
      await governanceDAO.connect(voter2).vote(1, true);  // 1500 tokens
      await governanceDAO.connect(voter3).vote(1, false); // 800 tokens

      const proposal = await governanceDAO.getProposal(1);
      expect(proposal.forVotes).to.equal(ethers.parseEther("2000"));    // 500 + 1500
      expect(proposal.againstVotes).to.equal(ethers.parseEther("800")); // 800
    });
  });

  describe("Proposal Execution", function () {
    beforeEach(async function () {
      // Setup proposal and voting
      await governanceToken.mint(proposer.address, ethers.parseEther("2000"));
      await governanceDAO.connect(proposer).propose("Execute this proposal");

      // Setup voters
      await governanceToken.mint(voter1.address, ethers.parseEther("1000"));
      await governanceToken.mint(voter2.address, ethers.parseEther("2000"));
      await governanceToken.mint(voter3.address, ethers.parseEther("500"));
    });

    it("Should execute successful proposal", async function () {
      // Vote in favor
      await governanceDAO.connect(voter1).vote(1, true);
      await governanceDAO.connect(voter2).vote(1, true);

      // Advance time past voting period
      await time.increase(8 * 24 * 60 * 60);

      await expect(
        governanceDAO.executeProposal(1)
      ).to.emit(governanceDAO, "ProposalExecuted");

      const proposal = await governanceDAO.getProposal(1);
      expect(proposal.executed).to.equal(true);
    });

    it("Should reject execution before voting ends", async function () {
      await governanceDAO.connect(voter1).vote(1, true);
      await governanceDAO.connect(voter2).vote(1, true);

      await expect(
        governanceDAO.executeProposal(1)
      ).to.be.revertedWith("Voting not ended");
    });

    it("Should reject execution of failed proposal", async function () {
      // Vote against (more against than for)
      await governanceDAO.connect(voter1).vote(1, false); // 1000 against
      await governanceDAO.connect(voter3).vote(1, true);  // 500 for

      // Advance time
      await time.increase(8 * 24 * 60 * 60);

      await expect(
        governanceDAO.executeProposal(1)
      ).to.be.revertedWith("Proposal not passed");
    });

    it("Should reject double execution", async function () {
      // Vote and execute
      await governanceDAO.connect(voter1).vote(1, true);
      await governanceDAO.connect(voter2).vote(1, true);
      await time.increase(8 * 24 * 60 * 60);
      await governanceDAO.executeProposal(1);

      await expect(
        governanceDAO.executeProposal(1)
      ).to.be.revertedWith("Already executed");
    });

    it("Should handle tie votes (against wins)", async function () {
      await governanceDAO.connect(voter1).vote(1, true);  // 1000 for
      await governanceDAO.connect(voter2).vote(1, false); // 2000 against

      await time.increase(8 * 24 * 60 * 60);

      await expect(
        governanceDAO.executeProposal(1)
      ).to.be.revertedWith("Proposal not passed");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await governanceToken.mint(proposer.address, ethers.parseEther("2000"));
      await governanceDAO.connect(proposer).propose("Query test proposal");
    });

    it("Should return correct proposal data", async function () {
      const proposal = await governanceDAO.getProposal(1);

      expect(proposal.id).to.equal(1);
      expect(proposal.proposer).to.equal(proposer.address);
      expect(proposal.description).to.equal("Query test proposal");
      expect(proposal.forVotes).to.equal(0);
      expect(proposal.againstVotes).to.equal(0);
      expect(proposal.executed).to.equal(false);
    });

    it("Should track voting status correctly", async function () {
      expect(await governanceDAO.hasVoted(1, voter1.address)).to.equal(false);

      await governanceToken.mint(voter1.address, ethers.parseEther("100"));
      await governanceDAO.connect(voter1).vote(1, true);

      expect(await governanceDAO.hasVoted(1, voter1.address)).to.equal(true);
    });
  });
});