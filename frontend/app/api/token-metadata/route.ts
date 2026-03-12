import { NextRequest, NextResponse } from 'next/server';
import { getRpcClient, eth_call } from 'thirdweb';
import { defineChain, createThirdwebClient } from 'thirdweb';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'dev',
});

function decodeString(hex: string): string {
  if (hex.length < 128) return '';
  try {
    const len = parseInt(hex.slice(64, 128), 16);
    const strHex = hex.slice(128, 128 + len * 2);
    return Buffer.from(strHex, 'hex').toString('utf-8');
  } catch {
    return '';
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const chainId = parseInt(searchParams.get('chainId') ?? '420420421', 10);

  if (!address) {
    return NextResponse.json({ error: 'address parameter required' }, { status: 400 });
  }

  try {
    const chain = defineChain({
      id: chainId,
      rpc: chainId === 420420420
        ? 'https://westend-asset-hub-eth-rpc.polkadot.io'
        : 'https://polkadot-asset-hub-eth-rpc.polkadot.io',
    });
    const rpcClient = getRpcClient({ client, chain });

    // Fetch symbol, name, decimals in parallel
    const [symbolResult, nameResult, decimalsResult] = await Promise.all([
      eth_call(rpcClient, { to: address as `0x${string}`, data: '0x95d89b41' as `0x${string}` }).catch(() => null),
      eth_call(rpcClient, { to: address as `0x${string}`, data: '0x06fdde03' as `0x${string}` }).catch(() => null),
      eth_call(rpcClient, { to: address as `0x${string}`, data: '0x313ce567' as `0x${string}` }).catch(() => null),
    ]);

    let symbol = 'UNKNOWN';
    let name = 'Unknown Token';
    let decimals = 18;

    if (symbolResult && symbolResult !== '0x') {
      const decoded = decodeString(symbolResult.slice(2));
      if (decoded) symbol = decoded;
    }

    if (nameResult && nameResult !== '0x') {
      const decoded = decodeString(nameResult.slice(2));
      if (decoded) name = decoded;
    }

    if (decimalsResult && decimalsResult !== '0x') {
      decimals = Number(BigInt(decimalsResult));
    }

    return NextResponse.json({
      symbol,
      name,
      decimals,
      logoUrl: null, // Would be resolved from CoinGecko or similar in production
    });
  } catch {
    return NextResponse.json({
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 18,
      logoUrl: null,
    });
  }
}
