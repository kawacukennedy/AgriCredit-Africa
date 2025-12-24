require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
   networks: {
     hardhat: {},
     sepolia: {
       url: "https://spring-bitter-mound.ethereum-sepolia.quiknode.pro/2d2e1eead3299ea5700eaf8443924f2add51cc87/",
       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
       chainId: 11155111,
     },
     polygon: {
       url: process.env.POLYGON_RPC_URL || "",
       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
     },
     celo: {
       url: process.env.CELO_RPC_URL || "",
       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
     },
     hedera: {
       url: "https://testnet.hashio.io/api",
       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
       chainId: 296,
     },
     blockdag: {
       url: process.env.BLOCKDAG_RPC_URL || "https://main.confluxrpc.com",
       accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
       chainId: 1030,
     },
   },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};