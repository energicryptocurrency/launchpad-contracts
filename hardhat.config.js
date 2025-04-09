require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomicfoundation/hardhat-chai-matchers");
require("@openzeppelin/hardhat-upgrades");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.22",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "istanbul",
          viaIR: true,
        },
      },
    ],
  },
  networks: {
    hardhat: { accountsBalance: "1000000000000000000000000000000" },
    development: {
      url: "http://127.0.0.1:7545",
      accounts: ["0xe629f77865df39f7d273dbacea66cf524154a4d8eb1adfa95c887874a1307c54"],
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.WALLET_PRIVATE_KEY],
    },
    energiMainnet: {
      chainId: 39797,
      url: "https://nodeapi.energi.network",
      gas: 30000000,
      gasPrice: 20000000000, // 20 GWei
      accounts: [process.env.WALLET_PRIVATE_KEY],
    },
    energiTestnet: {
      chainId: 49797,
      url: "https://nodeapi.test.energi.network",
      gas: 1000000,
      gasPrice: 20000000000, // 20 GWei
      accounts: [process.env.WALLET_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      energiTestnet: "xxxxx-no-api-key-needed-xxxxx",
      energiMainnet: "xxxxx-no-api-key-needed-xxxxx",
      sepolia: process.env.ETHERSCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "energiMainnet",
        chainId: 39797,
        urls: {
          apiURL: "https://explorer.energi.network/api",
          browserURL: "https://explorer.energi.network",
        },
      },
      {
        network: "energiTestnet",
        chainId: 49797,
        urls: {
          apiURL: "https://explorer.test.energi.network/api",
          browserURL: "https://explorer.test.energi.network",
        },
      },
    ],
  },
  mocha: {
    useColors: true,
  },
};
