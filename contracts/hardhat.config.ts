import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    polkadotHub: {
      url: process.env.POLKADOT_HUB_RPC || "https://polkadot-asset-hub-rpc.polkadot.io",
      chainId: 420420421,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    westendAssetHub: {
      url: process.env.WESTEND_RPC || "https://westend-asset-hub-rpc.polkadot.io",
      chainId: 420420420,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
};

export default config;
