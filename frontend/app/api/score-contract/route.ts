import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

// Rate limiting: simple in-memory store (use Redis in production)
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // requests per second per wallet

interface ScoreRequest {
  contractAddress: string;
  chainId: number;
  allowanceAmount: string;
  approvalAge: number;
  isUnlimited: boolean;
  tokenSymbol: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ScoreRequest = await request.json();
    const { contractAddress, chainId, allowanceAmount, approvalAge, isUnlimited, tokenSymbol } = body;

    if (!contractAddress || typeof contractAddress !== 'string') {
      return NextResponse.json({ error: 'contractAddress required' }, { status: 400 });
    }

    // Simple rate limiting by IP
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

    const prompt = `You are a smart contract security analyzer for the Polkadot Hub EVM ecosystem. Analyze this token approval and return a JSON risk assessment.

Contract Address: ${contractAddress}
Chain: Polkadot Hub (chainId: ${chainId})
Token: ${tokenSymbol}
Allowance Amount: ${allowanceAmount}
Is Unlimited: ${isUnlimited}
Approval Age (seconds): ${approvalAge}

Risk Factor Rules:
- Unverified source code: +30 points
- Unlimited allowance: +25 points
- Contract age < 30 days: +20 points
- Upgradeable proxy pattern: +15 points
- Approval idle > 90 days: +10 points
- Known audited contract: -15 points

Return ONLY valid JSON with this exact structure:
{
  "riskLevel": "SAFE" | "CAUTION" | "DANGER",
  "riskScore": <number 0-100>,
  "reasons": [<array of specific risk reason strings>],
  "recommendation": "<one-sentence plain-English recommendation>",
  "isUpgradeable": <boolean>,
  "isVerified": <boolean>,
  "contractAge": <number in days>,
  "scoredAt": ${Date.now()}
}

DANGER = score 60-100, CAUTION = score 30-59, SAFE = score 0-29.
Be conservative — flag anything suspicious. This protects real user funds.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const score = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!score.riskLevel || typeof score.riskScore !== 'number') {
      return NextResponse.json({ error: 'Invalid score structure' }, { status: 500 });
    }

    return NextResponse.json(score);
  } catch (err) {
    console.error('Score API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
