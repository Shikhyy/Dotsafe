import { NextRequest, NextResponse } from 'next/server';

// Known contracts database — maps addresses to protocol names
// This would normally be a database lookup or aggregated from multiple sources
const KNOWN_CONTRACTS: Record<string, { name: string; protocol: string; auditUrl?: string }> = {
  // Common DEX routers / protocols — placeholder entries
  // In production, this would be populated from Blockscout/chain metadata
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

  // Try to resolve from Blockscout API for Polkadot Hub
  try {
    const explorerApi = chainId === '420420420'
      ? 'https://assethub-westend.subscan.io/api'
      : 'https://assethub-polkadot.subscan.io/api';

    // Attempt Blockscout-compatible smart-contract endpoint
    const res = await fetch(`${explorerApi}/v2/smart-contracts/${address}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.name) {
        return NextResponse.json({
          name: data.name,
          protocol: data.name,
          isKnown: true,
          auditUrl: null,
        });
      }
    }
  } catch {
    // Explorer API unavailable — fall through
  }

  return NextResponse.json({
    name: null,
    protocol: null,
    isKnown: false,
    auditUrl: null,
  });
}
