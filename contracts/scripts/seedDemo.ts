/**
 * DotSafe Demo Seed Script
 *
 * Creates a realistic set of token approvals on Westend Asset Hub (or any network)
 * so the demo wallet shows a rich approval list with mixed risk levels.
 *
 * Usage:
 *   npx hardhat run scripts/seedDemo.ts --network westendAssetHub
 *   npx hardhat run scripts/seedDemo.ts --network polkadotHub
 *
 * What it does:
 *   1. Deploys 5 mock ERC-20 tokens (USDT, USDC, DAI, DOT, ASTR)
 *   2. Creates 6 spender addresses (some "risky", some "safe")
 *   3. Grants varied approvals: unlimited, large, small — across all tokens
 *   4. Prints a summary table for the demo
 */

import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n🛡️  DotSafe Demo Seed Script");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📬 Demo wallet: ${deployer.address}`);
  console.log(`🌐 Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log("");

  // ── 1. Deploy mock tokens ─────────────────────────────────────────────────
  console.log("📦 Deploying mock tokens...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const tokens = await Promise.all([
    MockERC20.deploy("Tether USD",      "USDT"),
    MockERC20.deploy("USD Coin",        "USDC"),
    MockERC20.deploy("Dai Stablecoin",  "DAI"),
    MockERC20.deploy("Wrapped DOT",     "wDOT"),
    MockERC20.deploy("Astar Network",   "ASTR"),
  ]);

  await Promise.all(tokens.map((t) => t.waitForDeployment()));

  const [USDT, USDC, DAI, wDOT, ASTR] = tokens;

  console.log(`  ✅ USDT:  ${await USDT.getAddress()}`);
  console.log(`  ✅ USDC:  ${await USDC.getAddress()}`);
  console.log(`  ✅ DAI:   ${await DAI.getAddress()}`);
  console.log(`  ✅ wDOT:  ${await wDOT.getAddress()}`);
  console.log(`  ✅ ASTR:  ${await ASTR.getAddress()}`);
  console.log("");

  // ── 2. Spender addresses (fake protocols) ─────────────────────────────────
  // Mix of "verified" and "suspicious" addresses to trigger varied AI scores.
  const spenders = {
    // Risky — unverified random spenders (will score DANGER)
    unknownDex:      "0x1234567890123456789012345678901234567890",
    suspiciousBridge:"0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    randomContractA: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    // Moderate — semi-known protocols (will score CAUTION)
    newExchange:     "0xBBBBbbbbBBBBbbbbBBBBbbbbBBBBbbbbBBBBbbbb",
    unknownFarm:     "0xCCCcccccCCCCcccCCCCcccCCCCcccCCCCcccCCCC",
    // Safe-looking — long-established (will score SAFE/CAUTION)
    oldProtocol:     "0xdDdDddDdDdDdDdDdDDdDdDdDdDdDdDdDdDdDdD1",
  };

  const MAX_UINT256 = ethers.MaxUint256;
  const LARGE = ethers.parseUnits("1000000", 18);  // 1,000,000 tokens
  const MED   = ethers.parseUnits("10000",   18);  // 10,000 tokens
  const SMALL = ethers.parseUnits("100",     18);  // 100 tokens

  // ── 3. Grant approvals ────────────────────────────────────────────────────
  console.log("📝 Granting approvals...");
  console.log("");

  interface ApprovalEntry {
    token: { symbol: () => Promise<string>; approve: (spender: string, amount: bigint) => Promise<unknown> };
    spenderName: string;
    spender: string;
    amount: bigint;
  }

  const approvals: ApprovalEntry[] = [
    // 🔴 DANGER scenarios
    { token: USDT, spenderName: "Unknown DEX",       spender: spenders.unknownDex,       amount: MAX_UINT256 }, // Unlimited stablecoin — critical
    { token: USDC, spenderName: "Suspicious Bridge", spender: spenders.suspiciousBridge, amount: MAX_UINT256 }, // Unlimited stablecoin — critical
    { token: DAI,  spenderName: "Unknown DEX",       spender: spenders.unknownDex,       amount: LARGE       }, // Large stablecoin approval

    // 🟡 CAUTION scenarios
    { token: wDOT, spenderName: "New Exchange",      spender: spenders.newExchange,      amount: MAX_UINT256 }, // Unlimited wrapped asset
    { token: ASTR, spenderName: "Unknown Farm",      spender: spenders.unknownFarm,      amount: LARGE       }, // Large bridged asset
    { token: USDT, spenderName: "Random Contract A", spender: spenders.randomContractA,  amount: MED         }, // Medium stablecoin approval

    // 🟢 SAFE scenarios
    { token: wDOT, spenderName: "Old Protocol",      spender: spenders.oldProtocol,      amount: SMALL       }, // Small amount, longer-lived
    { token: ASTR, spenderName: "Old Protocol",      spender: spenders.oldProtocol,      amount: SMALL       }, // Small amount
  ];

  for (const { token, spenderName, spender, amount } of approvals) {
    const symbol = await token.symbol();
    const label = amount === MAX_UINT256 ? "UNLIMITED" : ethers.formatUnits(amount, 18);
    const tx = await (token.approve(spender, amount) as Promise<import("ethers").ContractTransactionResponse>);
    await tx.wait();
    console.log(`  ✅ ${symbol.padEnd(5)} → ${spenderName.padEnd(22)} [${label}]`);
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 Demo approvals created!");
  console.log("");
  console.log("📋 Next steps:");
  console.log("  1. Copy the token addresses above to test with the app");
  console.log("  2. Start the frontend:  cd ../frontend && npm run dev");
  console.log("  3. Connect this wallet in MetaMask (same private key)");
  console.log("  4. The scanner will auto-detect all 8 approvals");
  console.log("  5. AI will score them — expect 3 DANGER, 3 CAUTION, 2 SAFE");
  console.log("");
  console.log(`🔑 Demo wallet address: ${deployer.address}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
