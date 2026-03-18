import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

// Rate limiting: simple in-memory store (use Redis in production)
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per second per wallet

// Cache to prevent hitting Gemini's 15 RPM free tier limit
const scoreCache = new Map<string, { score: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

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

    // Check cache first!
    const cacheKey = `${contractAddress.toLowerCase()}_${isUnlimited}_${allowanceAmount}`;
    const cached = scoreCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[CACHE HIT] Returning cached AI score for ${tokenSymbol}`);
      return NextResponse.json(cached.score);
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

    const prompt = `You are a smart contract security analyzer for the Polkadot Hub EVM ecosystem — the first EVM-compatible execution environment on Polkadot. Analyze this token approval and return a comprehensive JSON risk assessment with confidence scoring.

Contract Address: ${contractAddress}
Chain: Polkadot Hub (chainId: ${chainId})
Token: ${tokenSymbol}
Allowance Amount: ${allowanceAmount}
Is Unlimited: ${isUnlimited}
Approval Age (seconds): ${approvalAge}

ADVANCED RISK FACTOR ANALYSIS:

Critical Risk Factors (+20 to +40):
- Unverified source code on blockchain: +30 points
- Unlimited allowance for stablecoins (USDT, USDC, DAI, aUSD): +40 points (CRITICAL)
- Token is stablecoin with unlimited approval: +35 points
- DeFi protocol with questionable keeper/guardian: +25 points
- Suspicious permission escalation pattern: +30 points
- Proxy pointing to suspicious implementation: +25 points

High Risk Factors (+15 to +20):
- Contract age < 30 days on new chain: +15 points
- Upgradeable proxy pattern (UUPS/Transparent): +15 points
- XCM cross-chain approval to parachain: +18 points
- Multiple admin functions with no timelock: +16 points
- Wrapped/bridged asset (DOT, GLMR, ASTR) from unknown bridge: +20 points

Medium Risk Factors (+8 to +14):
- Approval idle > 90 days: +10 points
- Emergency pause function with broad effect: +12 points
- Unusual token decimals (not 18): +8 points
- Single admin (not multisig): +11 points

Risk Reducers (-10 to -20):
- Known audited DeFi protocol (Aave, Compound, Uniswap, StellaSwap, Beamswap, ArthSwap): -15 points
- OpenZeppelin libraries detected: -10 points
- Contract >90 days with clean history: -12 points
- Multisig admin setup: -15 points
- Known institutional backing (Polkadot Foundation, parachains): -20 points

SCORING RULES:
1. Base score for ANY unverified/unknown contract is 30.
2. If Is Unlimited is TRUE, automatically add +35 points.
3. If Is Unlimited is TRUE AND the token is a stablecoin (USDC, USDT, DAI), the final score MUST BE >= 85 (DANGER).
4. If it's a known institutional contract, final score MUST BE <= 20 (SAFE).

Polkadot Hub Context:
- Ecosystem is nascent — apply caution with new contracts
- XCM introduces cross-chain vectors — flag if approval reaches multiple parachains
- Native asset bridges (DOT, GLMR, ASTR) have bridge trust assumptions

CONFIDENCE SCORING:
- Confidence HIGH (90-100%): Contract has verifiable on-chain evidence of all claims
- Confidence MEDIUM (70-89%): Some chain data available, assumptions on code verification
- Confidence LOW (50-69%): Limited on-chain evidence, mostly static analysis
- Confidence VERY_LOW (<50%): Insufficient data, recommend manual review

Return ONLY valid JSON with this exact structure:
{
  "riskLevel": "SAFE" | "CAUTION" | "DANGER",
  "riskScore": <number 0-100>,
  "confidence": <number 0-100>,
  "confidenceLevel": "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH",
  "reasons": [<array of 3-5 specific risk reason strings with evidence>],
  "riskFactors": {
    "critical": [<critical risk items>],
    "high": [<high risk items>],
    "medium": [<medium risk items>]
  },
  "mitigations": [<array of mitigation strategies if applicable>],
  "recommendation": "<detailed recommendation 2-3 sentences>",
  "isUpgradeable": <boolean>,
  "isVerified": <boolean>,
  "contractAge": <number in days>,
  "isStablecoin": <boolean>,
  "isDeFiProtocol": <boolean>,
  "riskTrend": "INCREASING" | "STABLE" | "DECREASING",
  "aiModel": "Gemini 2.0 Flash",
  "analysisTimestamp": ${Date.now()}
}

DANGER = score 60-100 (HIGH RISK - Recommend revocation)
CAUTION = score 30-59 (MEDIUM RISK - Review and consider limits)
SAFE = score 0-29 (LOW RISK - Acceptable)

Be conservative and thorough. Every flag protects real user funds on Polkadot Hub.`;

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

    // Save to cache
    scoreCache.set(cacheKey, { score, timestamp: Date.now() });

    return NextResponse.json(score);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    if (errorMsg.includes('429')) {
      // Return 429 cleanly so the frontend's retry loop catches it and backs off
      console.warn(`[RATE LIMIT] Gemini API limit reached. Frontend will retry.`);
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    
    console.error('Score API error:', errorMsg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
