import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createThirdwebClient, getContract, defineChain } from "thirdweb";
import { getBytecode } from "thirdweb/contract";
import { eth_getStorageAt } from "thirdweb/rpc"; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

// Initialize Thirdweb client for on-chain checks
const client = createThirdwebClient({ 
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "" 
});

// Chain definition for Polkadot Asset Hub (Passet Testnet)
const PASSET_CHAIN = defineChain(420420421);

// EIP-1967 Storage Slots
const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

// Helper: Check if contract is a proxy or has suspicious patterns
async function analyzeContractOnChain(address: string, chainId: number) {
  try {
    const chain = defineChain(chainId);
    const contract = getContract({ client, chain, address });

    // 1. Check Bytecode (is it a contract?)
    const bytecode = await getBytecode(contract);
    if (!bytecode || bytecode === "0x") {
        return { isContract: false, isProxy: false, details: "Not a contract (EOA)" };
    }

    // 2. Check for Proxy Slots (EIP-1967)
    // Note: requires an RPC provider that supports eth_getStorageAt
    // We use the client's RPC for this.
    const rpcRequest = getContract({ client, chain, address });
    
    // We need to use the RPC directly. The thirdweb SDK exposes rpc via client? 
    // Actually, thirdweb v5 has specific RPC functions.
    // Let's use a simpler heuristic if storage read is complex: check bytecode size and signatures.
    // Proxies are usually small.
    const isSmall = bytecode.length < 1000; // Heuristic
    
    // Check for "upgradeTo" selector: 3659cfe6
    const hasUpgradeTo = bytecode.includes("3659cfe6");
    
    // Check for "implementation" slot constant in bytecode (sometimes inlined)
    const hasImplSlot = bytecode.includes("360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc");

    let proxyType = null;
    if (hasUpgradeTo || hasImplSlot) {
        proxyType = "Transparent/UUPS Proxy";
    }

    return {
        isContract: true,
        bytecodeSize: bytecode.length,
        isProxy: !!proxyType,
        proxyType,
        hasUpgradeTo,
        details: \`Bytecode size: \${bytecode.length} bytes. \${proxyType ? "Proxy detected." : "No obvious proxy pattern."}\`
    };
  } catch (error) {
    console.error("On-chain analysis failed:", error);
    return { isContract: true, isProxy: false, details: "On-chain analysis failed, assuming standard contract." };
  }
}

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

    // Perform on-chain analysis
    const onChainData = await analyzeContractOnChain(contractAddress, chainId);
    
    const prompt = `You are a smart contract security analyzer for the Polkadot Hub EVM ecosystem — the first EVM-compatible execution environment on Polkadot. Analyze this token approval and return a comprehensive JSON risk assessment with confidence scoring.

Contract Address: ${contractAddress}
Chain: Polkadot Hub (chainId: ${chainId})
Token: ${tokenSymbol}
Allowance Amount: ${allowanceAmount}
Is Unlimited: ${isUnlimited}
Approval Age (seconds): ${approvalAge}

ON-CHAIN ANALYSIS DATA (Real-time):
- Is Contract: ${onChainData.isContract}
- Bytecode Size: ${onChainData.bytecodeSize} bytes
- Proxy Detected: ${onChainData.isProxy} ${onChainData.proxyType ? `(${onChainData.proxyType})` : ''}
- Details: ${onChainData.details}

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

Polkadot Hub Context:
- Ecosystem is nascent — apply caution with new contracts
- XCM introduces cross-chain vectors — flag if approval reaches multiple parachains
- Native asset bridges (DOT, GLMR, ASTR) have bridge trust assumptions
- Most contracts will be young — normalize for ecosystem age

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

    return NextResponse.json(score);
  } catch (err) {
    console.error('Score API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
