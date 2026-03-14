import { defineChain } from 'thirdweb';

export const polkadotHub = defineChain({
  id: 420420417,
  name: 'Passet Hub',
  nativeCurrency: { name: 'PAS', symbol: 'PAS', decimals: 18 },
  rpc: 'https://eth-rpc-testnet.polkadot.io/',
  blockExplorers: [
    { name: 'Subscan', url: 'https://assethub-paseo.subscan.io' },
  ],
  testnet: true,
});
