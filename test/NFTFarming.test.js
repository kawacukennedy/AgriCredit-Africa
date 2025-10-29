import { expect } from "chai";
import { ethers } from "hardhat";

describe("NFTFarming", function () {
  let nftFarming;
  let owner, farmer1, farmer2;

  beforeEach(async function () {
    [owner, farmer1, farmer2] = await ethers.getSigners();

    const NFTFarming = await ethers.getContractFactory("NFTFarming");
    nftFarming = await NFTFarming.deploy();
    await nftFarming.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftFarming.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await nftFarming.name()).to.equal("AgriCredit Farm NFT");
      expect(await nftFarming.symbol()).to.equal("FARM");
    });
  });

  describe("Minting Farm NFTs", function () {
    it("Should mint farm NFT successfully", async function () {
      const farmData = {
        farmer: farmer1.address,
        farmName: "Green Valley Farm",
        location: "40.7128,-74.0060",
        size: 50, // 50 hectares
        cropType: "Corn",
        expectedYield: 200, // 200 tons
        metadataURI: "ipfs://QmFarmMetadata123"
      };

      await expect(
        nftFarming.mintFarmNFT(
          farmData.farmer,
          farmData.farmName,
          farmData.location,
          farmData.size,
          farmData.cropType,
          farmData.expectedYield,
          farmData.metadataURI
        )
      ).to.emit(nftFarming, "FarmNFTMinted");

      expect(await nftFarming.ownerOf(1)).to.equal(farmer1.address);
      expect(await nftFarming.totalSupply()).to.equal(1);

      const farmNFT = await nftFarming.getFarmNFT(1);
      expect(farmNFT.farmer).to.equal(farmData.farmer);
      expect(farmNFT.farmName).to.equal(farmData.farmName);
      expect(farmNFT.isActive).to.equal(true);
    });

    it("Should only allow owner to mint", async function () {
      await expect(
        nftFarming.connect(farmer1).mintFarmNFT(
          farmer1.address,
          "Test Farm",
          "0,0",
          10,
          "Wheat",
          50,
          "ipfs://test"
        )
      ).to.be.revertedWithCustomError(nftFarming, "OwnableUnauthorizedAccount");
    });

    it("Should increment token IDs correctly", async function () {
      await nftFarming.mintFarmNFT(farmer1.address, "Farm 1", "0,0", 10, "Corn", 100, "ipfs://1");
      await nftFarming.mintFarmNFT(farmer2.address, "Farm 2", "0,0", 20, "Wheat", 150, "ipfs://2");

      expect(await nftFarming.ownerOf(1)).to.equal(farmer1.address);
      expect(await nftFarming.ownerOf(2)).to.equal(farmer2.address);
      expect(await nftFarming.totalSupply()).to.equal(2);
    });
  });

  describe("Recording Harvests", function () {
    beforeEach(async function () {
      await nftFarming.mintFarmNFT(
        farmer1.address,
        "Test Farm",
        "40.7128,-74.0060",
        50,
        "Corn",
        200,
        "ipfs://QmFarmMetadata123"
      );
    });

    it("Should record harvest successfully", async function () {
      const actualYield = 180; // 180 tons actual vs 200 expected

      await expect(
        nftFarming.connect(farmer1).recordHarvest(1, actualYield)
      ).to.emit(nftFarming, "FarmNFTHarvested");

      const farmNFT = await nftFarming.getFarmNFT(1);
      expect(farmNFT.expectedYield).to.equal(actualYield); // Updated to actual
      expect(farmNFT.isActive).to.equal(false);
      expect(farmNFT.harvestDate).to.be.greaterThan(0);
    });

    it("Should allow owner to record harvest for any NFT", async function () {
      const actualYield = 190;

      await expect(
        nftFarming.recordHarvest(1, actualYield)
      ).to.emit(nftFarming, "FarmNFTHarvested");

      const farmNFT = await nftFarming.getFarmNFT(1);
      expect(farmNFT.isActive).to.equal(false);
    });

    it("Should reject harvest for non-owner/non-farmer", async function () {
      await expect(
        nftFarming.connect(farmer2).recordHarvest(1, 180)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should reject harvest for inactive NFT", async function () {
      await nftFarming.connect(farmer1).recordHarvest(1, 180);

      await expect(
        nftFarming.connect(farmer1).recordHarvest(1, 200)
      ).to.be.revertedWith("Farm NFT not active");
    });
  });

  describe("NFT Transfers", function () {
    beforeEach(async function () {
      await nftFarming.mintFarmNFT(
        farmer1.address,
        "Transfer Test Farm",
        "0,0",
        25,
        "Soybeans",
        100,
        "ipfs://transfer-test"
      );
    });

    it("Should transfer NFT and update farmer lists", async function () {
      // Approve transfer
      await nftFarming.connect(farmer1).approve(farmer2.address, 1);

      await expect(
        nftFarming.connect(farmer2).transferFrom(farmer1.address, farmer2.address, 1)
      ).to.emit(nftFarming, "FarmNFTTransferred");

      expect(await nftFarming.ownerOf(1)).to.equal(farmer2.address);

      const farmNFT = await nftFarming.getFarmNFT(1);
      expect(farmNFT.farmer).to.equal(farmer2.address);

      const farmer1NFTs = await nftFarming.getFarmerNFTs(farmer1.address);
      const farmer2NFTs = await nftFarming.getFarmerNFTs(farmer2.address);

      expect(farmer1NFTs.length).to.equal(0);
      expect(farmer2NFTs.length).to.equal(1);
      expect(farmer2NFTs[0]).to.equal(1);
    });
  });

  describe("Metadata and Queries", function () {
    beforeEach(async function () {
      await nftFarming.mintFarmNFT(
        farmer1.address,
        "Query Test Farm",
        "35.6762,139.6503",
        75,
        "Rice",
        300,
        "ipfs://query-test-metadata"
      );
    });

    it("Should return correct token URI", async function () {
      expect(await nftFarming.tokenURI(1)).to.equal("ipfs://query-test-metadata");
    });

    it("Should return farmer's NFTs correctly", async function () {
      await nftFarming.mintFarmNFT(
        farmer1.address,
        "Second Farm",
        "0,0",
        30,
        "Barley",
        120,
        "ipfs://second-farm"
      );

      const farmerNFTs = await nftFarming.getFarmerNFTs(farmer1.address);
      expect(farmerNFTs.length).to.equal(2);
      expect(farmerNFTs).to.include(1);
      expect(farmerNFTs).to.include(2);
    });

    it("Should reject queries for non-existent tokens", async function () {
      await expect(
        nftFarming.getFarmNFT(999)
      ).to.be.revertedWith("Farm NFT does not exist");

      await expect(
        nftFarming.tokenURI(999)
      ).to.be.revertedWith("Farm NFT does not exist");
    });
  });

  describe("Farmer List Management", function () {
    it("Should maintain accurate farmer NFT lists", async function () {
      // Mint multiple NFTs for different farmers
      await nftFarming.mintFarmNFT(farmer1.address, "Farm A", "0,0", 10, "Corn", 50, "ipfs://a");
      await nftFarming.mintFarmNFT(farmer1.address, "Farm B", "0,0", 15, "Wheat", 75, "ipfs://b");
      await nftFarming.mintFarmNFT(farmer2.address, "Farm C", "0,0", 20, "Rice", 100, "ipfs://c");

      let farmer1NFTs = await nftFarming.getFarmerNFTs(farmer1.address);
      let farmer2NFTs = await nftFarming.getFarmerNFTs(farmer2.address);

      expect(farmer1NFTs.length).to.equal(2);
      expect(farmer2NFTs.length).to.equal(1);

      // Transfer one NFT from farmer1 to farmer2
      await nftFarming.connect(farmer1).approve(farmer2.address, 1);
      await nftFarming.connect(farmer2).transferFrom(farmer1.address, farmer2.address, 1);

      farmer1NFTs = await nftFarming.getFarmerNFTs(farmer1.address);
      farmer2NFTs = await nftFarming.getFarmerNFTs(farmer2.address);

      expect(farmer1NFTs.length).to.equal(1);
      expect(farmer2NFTs.length).to.equal(2);
    });
  });
});