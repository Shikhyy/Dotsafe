import { http, createConfig } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { polkadotHub, westendAssetHub } from './chains';

export const wagmiConfig = createConfig({
  chains: [polkadotHub, westendAssetHub],
  connectors: [
    injected(),
    ...(process.env.NEXT_PUBLIC_WC_PROJECT_ID
      ? [walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID })]
      : []),
  ],
  transports: {
    [polkadotHub.id]: http(),
    [westendAssetHub.id]: http(),
  },
});
