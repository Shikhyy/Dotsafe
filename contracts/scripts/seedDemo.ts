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

  // ── 1. Deploy mock tokens (sequential with explicit gasLimit) ─────────────
  console.log("📦 Deploying mock tokens...");
  const GAS_LIMIT = 5_000_000;
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const USDT = await MockERC20.deploy("Tether USD", "USDT", { gasLimit: GAS_LIMIT });
  await USDT.waitForDeployment();
  console.log(`  ✅ USDT:  ${await USDT.getAddress()}`);

  const USDC = await MockERC20.deploy("USD Coin", "USDC", { gasLimit: GAS_LIMIT });
  await USDC.waitForDeployment();
  console.log(`  ✅ USDC:  ${await USDC.getAddress()}`);

  const DAI = await MockERC20.deploy("Dai Stablecoin", "DAI", { gasLimit: GAS_LIMIT });
  await DAI.waitForDeployment();
  console.log(`  ✅ DAI:   ${await DAI.getAddress()}`);

  const wDOT = await MockERC20.deploy("Wrapped DOT", "wDOT", { gasLimit: GAS_LIMIT });
  await wDOT.waitForDeployment();
  console.log(`  ✅ wDOT:  ${await wDOT.getAddress()}`);

  const ASTR = await MockERC20.deploy("Astar Network", "ASTR", { gasLimit: GAS_LIMIT });
  await ASTR.waitForDeployment();
  console.log(`  ✅ ASTR:  ${await ASTR.getAddress()}`);
  console.log("");

  // ── 2. Spender addresses (fake protocols) ─────────────────────────────────
  // Generate random valid EVM addresses for the spenders to ensure 100% compatibility
  const spenders = {
    unknownDex:      ethers.Wallet.createRandom().address,
    suspiciousBridge:ethers.Wallet.createRandom().address,
    randomContractA: ethers.Wallet.createRandom().address,
    newExchange:     ethers.Wallet.createRandom().address,
    unknownFarm:     ethers.Wallet.createRandom().address,
    oldProtocol:     ethers.Wallet.createRandom().address,
  };

  const MAX_UINT256 = ethers.MaxUint256;
  const LARGE = ethers.parseUnits("1000000", 18);  // 1,000,000 tokens
  const MED   = ethers.parseUnits("10000",   18);  // 10,000 tokens
  const SMALL = ethers.parseUnits("100",     18);  // 100 tokens

  // ── 3. Grant approvals ────────────────────────────────────────────────────
  console.log("📝 Granting approvals...");
  console.log("");

  const approvals = [
    // 🔴 DANGER scenarios
    { token: USDT, spenderName: "Unknown DEX",       spender: spenders.unknownDex,       amount: MAX_UINT256 },
    { token: USDC, spenderName: "Suspicious Bridge", spender: spenders.suspiciousBridge, amount: MAX_UINT256 },
    { token: DAI,  spenderName: "Unknown DEX",       spender: spenders.unknownDex,       amount: LARGE       },

    // 🟡 CAUTION scenarios
    { token: wDOT, spenderName: "New Exchange",      spender: spenders.newExchange,      amount: MAX_UINT256 },
    { token: ASTR, spenderName: "Unknown Farm",      spender: spenders.unknownFarm,      amount: LARGE       },
    { token: USDT, spenderName: "Random Contract A", spender: spenders.randomContractA,  amount: MED         },

    // 🟢 SAFE scenarios
    { token: wDOT, spenderName: "Old Protocol",      spender: spenders.oldProtocol,      amount: SMALL       },
    { token: ASTR, spenderName: "Old Protocol",      spender: spenders.oldProtocol,      amount: SMALL       },
  ];

  for (const { token, spenderName, spender, amount } of approvals) {
    const symbol = await token.symbol();
    const label = amount === MAX_UINT256 ? "UNLIMITED" : ethers.formatUnits(amount, 18);
    const tx = await token.approve(spender, amount, { gasLimit: GAS_LIMIT });
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
