import { defineChain } from 'viem';

export const polkadotHub = defineChain({
  id: 420420421,
  name: 'Polkadot Hub',
  nativeCurrency: { name: 'DOT', symbol: 'DOT', decimals: 10 },
  rpcUrls: {
    default: {
      http: ['https://polkadot-asset-hub-eth-rpc.polkadot.io'],
      webSocket: ['wss://polkadot-asset-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: { name: 'Subscan', url: 'https://assethub-polkadot.subscan.io' },
  },
});

export const westendAssetHub = defineChain({
  id: 420420420,
  name: 'Westend Asset Hub',
  nativeCurrency: { name: 'WND', symbol: 'WND', decimals: 10 },
  rpcUrls: {
    default: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
      webSocket: ['wss://westend-asset-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: { name: 'Subscan', url: 'https://assethub-westend.subscan.io' },
  },
  testnet: true,
});
