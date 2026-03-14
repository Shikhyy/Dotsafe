import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@parity/hardhat-polkadot";
import * as dotenv from "dotenv";
dotenv.config();

const polkadotHubRpc = process.env.POLKADOT_HUB_RPC;

if (!polkadotHubRpc) {
  console.warn("POLKADOT_HUB_RPC is not set. Mainnet deployment requires a valid Polkadot Hub Ethereum RPC endpoint.");
}

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
  networks: {
    hardhat: {},
    passetHub: {
      polkadot: { target: "evm" },
      url: process.env.POLKADOT_TESTNET_RPC || "https://eth-rpc-testnet.polkadot.io/",
      chainId: 420420417,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    polkadotHub: {
      polkadot: { target: "evm" },
      url: polkadotHubRpc || "https://eth-rpc.polkadot.io/",
      chainId: 420420419,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    polkadotTestnet: {
      polkadot: { target: "evm" },
      url: "https://eth-rpc-testnet.polkadot.io/",
      chainId: 420420417,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    westendAssetHub: {
      polkadot: { target: "evm" },
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
