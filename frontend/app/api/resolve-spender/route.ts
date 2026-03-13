import { NextRequest, NextResponse } from 'next/server';

// Known contracts on Polkadot Asset Hub (mainnet + Westend testnet)
// Lowercase addresses for fast O(1) lookup
const KNOWN_CONTRACTS: Record<string, { name: string; protocol: string; auditUrl?: string }> = {
  // Polkadot Asset Hub system contracts & wrapped assets
  '0xffffffff00000000000000010000000000000002': { name: 'Wrapped DOT (wDOT)', protocol: 'Polkadot Asset Hub', auditUrl: 'https://github.com/paritytech/polkadot-sdk' },
  '0xffffffff000000000000000100000000000007ef': { name: 'USDC (Asset Hub)', protocol: 'Circle / Asset Hub', auditUrl: 'https://developers.circle.com/stablecoins/usdc-on-polkadot' },
  '0xffffffff00000000000000010000000000000001': { name: 'USDT (Asset Hub)', protocol: 'Tether / Asset Hub' },
  '0x00000000000000000000000000000000000a0000': { name: 'XCM Precompile', protocol: 'Polkadot Runtime', auditUrl: 'https://github.com/paritytech/polkadot-sdk' },
  '0x0000000000000000000000000000000000000400': { name: 'EVM Precompile — SHA256', protocol: 'Polkadot Runtime' },
  '0x0000000000000000000000000000000000000001': { name: 'ECRecover Precompile', protocol: 'EVM Standard' },
  '0x0000000000000000000000000000000000000002': { name: 'SHA256 Precompile', protocol: 'EVM Standard' },
  '0x0000000000000000000000000000000000000003': { name: 'RIPEMD160 Precompile', protocol: 'EVM Standard' },
  '0x0000000000000000000000000000000000000004': { name: 'Identity Precompile', protocol: 'EVM Standard' },
  '0x0000000000000000000000000000000000000005': { name: 'ModExp Precompile', protocol: 'EVM Standard' },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address')?.toLowerCase();
  const chainId = searchParams.get('chainId');

  if (!address) {
    return NextResponse.json({ error: 'address parameter required' }, { status: 400 });
  }

  // Check known contracts DB
  const known = KNOWN_CONTRACTS[address];
  if (known) {
    return NextResponse.json({
      name: known.name,
      protocol: known.protocol,
      isKnown: true,
      auditUrl: known.auditUrl ?? null,
    });
  }

  // Try to resolve via Subscan API for Polkadot Asset Hub
  try {
    const subscanHost = chainId === '420420420'
      ? 'https://assethub-westend.api.subscan.io'
      : 'https://assethub-polkadot.api.subscan.io';

    // Subscan EVM contract info endpoint (POST)
    const res = await fetch(`${subscanHost}/api/scan/evm/contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ address }),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const json = await res.json() as { code?: number; data?: { contract_name?: string; token_name?: string } };
      const contractName = json?.data?.contract_name || json?.data?.token_name;
      if (json?.code === 0 && contractName) {
        return NextResponse.json({
          name: contractName,
          protocol: contractName,
          isKnown: true,
          auditUrl: null,
        });
      }
    }
  } catch {
    // Subscan API unavailable — fall through
  }

  return NextResponse.json({
    name: null,
    protocol: null,
    isKnown: false,
    auditUrl: null,
  });
}
