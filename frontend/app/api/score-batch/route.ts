import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // 5 batches per second per IP

interface BatchScoreRequest {
  chainId: number;
  approvals: {
    id: string;
    contractAddress: string;
    allowanceAmount: string;
    approvalAge: number;
    isUnlimited: boolean;
    tokenSymbol: string;
    isContract: boolean;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchScoreRequest = await request.json();
    const { chainId, approvals } = body;

    if (!approvals || !Array.isArray(approvals) || approvals.length === 0) {
      return NextResponse.json({ error: 'Valid approvals array required' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const now = Date.now();
    const entry = rateMap.get(ip);
    if (entry && entry.resetAt > now) {
      if (entry.count >= RATE_LIMIT) {
        return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
      }
      entry.count++;
    } else {
      rateMap.set(ip, { count: 1, resetAt: now + 1000 });
    }

    // Limit to 20 approvals max per batch to prevent max_token/context-length explosions
    const batch = approvals.slice(0, 20);

    const approvalsText = batch.map((a, i) => `
[Approval ${i}]
ID: ${a.id}
Spender Address: ${a.contractAddress}
Is Smart Contract: ${a.isContract}
Token: ${a.tokenSymbol}
Allowance Amount: ${a.allowanceAmount}
Is Unlimited: ${a.isUnlimited}
Approval Age (seconds): ${a.approvalAge}
`).join('\n');

    const prompt = `You are a smart contract security analyzer for the Polkadot Hub EVM ecosystem. You are provided with a batch of ${batch.length} token approvals to analyze simultaneously.
    
Chain: Polkadot Hub (chainId: ${chainId})

${approvalsText}

ADVANCED RISK FACTOR ANALYSIS:
Critical Risk Factors (+20 to +40):
- Spender is an EOA (Externally Owned Account) instead of a Contract: +80 points (CRITICAL SCAM VECTOR)
- Unlimited allowance for stablecoins (USDT, USDC, DAI, aUSD): +40 points (CRITICAL)

SCORING RULES (STRICT):
1. If "Is Smart Contract" is FALSE (meaning it's a standard user wallet EOA getting an allowance), the final score MUST BE >= 85 (DANGER). This is a known phishing/drainer vector.
2. Base score for ANY unverified/unknown contract is 30.
3. If Is Unlimited is TRUE AND the token is a stablecoin (USDC, USDT, DAI), the final score MUST BE >= 85 (DANGER).
4. If it's a known institutional contract, final score MUST BE <= 20 (SAFE).

CONFIDENCE SCORING:
- Confidence HIGH (90-100%), MEDIUM (70-89%), LOW (50-69%), VERY_LOW (<50%). Since you lack block explorer internet access, default to HIGH if it clearly breaks mathematical rules (like unlimited stablecoins).

DANGER = score 60-100 (HIGH RISK)
CAUTION = score 30-59 (MEDIUM RISK)
SAFE = score 0-29 (LOW RISK)

Return ONLY a valid JSON Array of length ${batch.length}, identical output order as the input.
Format:
[
  {
    "id": "<match the input ID exactly>",
    "riskLevel": "SAFE" | "CAUTION" | "DANGER",
    "riskScore": <number>,
    "confidence": <number>,
    "confidenceLevel": "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH",
    "reasons": [<array of strings>],
    "riskFactors": { "critical": [], "high": [], "medium": [] },
    "mitigations": [<strings>],
    "recommendation": "<string>",
    "isUpgradeable": false,
    "isVerified": false,
    "contractAge": <number days>,
    "isStablecoin": <boolean>,
    "isDeFiProtocol": false,
    "riskTrend": "STABLE",
    "aiModel": "Gemini 2.0 Flash (Batch)",
    "analysisTimestamp": ${Date.now()}
  }
]`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const scores = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(scores) || scores.length !== batch.length) {
      return NextResponse.json({ error: 'Invalid batch size response' }, { status: 500 });
    }

    return NextResponse.json({ scores });
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    if (errorMsg.includes('429')) {
      console.warn(`[RATE LIMIT] Gemini Batch API limit reached.`);
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    console.error('Batch Score API error:', errorMsg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
