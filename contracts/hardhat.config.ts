import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@parity/hardhat-polkadot";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  resolc: {
    compilerSource: "binary",
    version: "0.5.0",
    settings: {
      resolcPath: "/Users/shikhar/Library/Caches/hardhat-nodejs/compilers-v2/macosx-amd64/resolc-universal-apple-darwin+commit.046455",
    },
  },
  networks: {
    hardhat: {},
    polkadotHub: {
      polkadot: true,
      url: process.env.POLKADOT_HUB_RPC || "https://polkadot-asset-hub-eth-rpc.polkadot.io",
      chainId: 420420421,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    westendAssetHub: {
      polkadot: true,
      url: process.env.WESTEND_RPC || "https://westend-asset-hub-eth-rpc.polkadot.io",
      chainId: 420420421,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      gas: 5000000,
      gasPrice: 1000000000,
    },
    moonbaseAlpha: {
      url: "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
};

export default config;
