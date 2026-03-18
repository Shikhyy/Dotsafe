import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load frontend env so we know the deployed contract addresses
dotenv.config({ path: resolve(__dirname, "../../frontend/.env.local") });

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  console.log(`\n🛡️  DotSafe Demo Mock Seeder`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📬 Demo wallet: ${address}`);
  console.log(`🌐 Network: ${(await ethers.provider.getNetwork()).name}\n`);

  const xcmAddress = process.env.NEXT_PUBLIC_XCM_GUARD_ADDRESS;
  const policyAddress = process.env.NEXT_PUBLIC_APPROVAL_POLICY_ADDRESS;

  if (!xcmAddress || !policyAddress) {
    throw new Error("Missing NEXT_PUBLIC_XCM_GUARD_ADDRESS or NEXT_PUBLIC_APPROVAL_POLICY_ADDRESS in frontend/.env.local");
  }

  // 1. Seed XCM Alerts
  console.log("📦 Seeding XCM Alerts...");
  const XCMGuard = await ethers.getContractAt("XCMGuard", xcmAddress);
  
  // Astar: 3 alerts, Moonbeam: 1 alert, Acala: 0
  const astParaId = 2006;
  const moonParaId = 2004;
  
  const dummySuspicious = ethers.Wallet.createRandom().address;

  // We loop to add 3 alerts to Astar. We pass empty bytes for XCM payload so it just increments the counter.
  for (let i = 0; i < 3; i++) {
    const tx = await XCMGuard.sendRiskAlert(astParaId, dummySuspicious, "0x", { gasLimit: 5_000_000 });
    await tx.wait(1);
  }
  console.log(`  ✅ Added 3 alerts to Astar (ID: 2006)`);

  const tx2 = await XCMGuard.sendRiskAlert(moonParaId, dummySuspicious, "0x", { gasLimit: 5_000_000 });
  await tx2.wait(1);
  console.log(`  ✅ Added 1 alert to Moonbeam (ID: 2004)`);

  // 2. Seed Approval Policies
  console.log("\n📝 Seeding Approval Policies...");
  const ApprovalPolicy = await ethers.getContractAt("ApprovalPolicy", policyAddress);

  // Register Wallet (might already be registered from a previous run or the UI)
  const isReg = await ApprovalPolicy.isRegistered(address);
  if (!isReg) {
    const regTx = await ApprovalPolicy.registerWallet({ gasLimit: 5_000_000 });
    await regTx.wait(1);
    console.log(`  ✅ Registered wallet ${address}`);
  }

  // Create two policies! 
  // Let's assume you want to create a policy for some known tokens or a mock token.
  // We'll create a policy for USDT and a Whitelist. 
  // Wait, we need the token address. Let's create a random token address or zero address just for UI.
  // The UI queries metadata. If it's a random address, it shows "0x12..34". Let's use standard ones.
  // Actually, we'll just parse the logs from our previous mock token deployments or pass dummy ones.
  const dummyUSDT = ethers.Wallet.createRandom().address;
  const dummyUSDC = ethers.Wallet.createRandom().address;

  // Policy 1: Max 500, expires in 24 hours (86400s), Whitelist only
  let tpTx = await ApprovalPolicy.setTokenPolicy(dummyUSDT, ethers.parseUnits("500", 6), 86400, true, { gasLimit: 5_000_000 });
  await tpTx.wait(1);
  console.log(`  ✅ Added Policy for Mock USDT: 500 limit, 24h window, whitelist only`);

  // Policy 2: Max 10000, no expiry, any spender
  let tpTx2 = await ApprovalPolicy.setTokenPolicy(dummyUSDC, ethers.parseUnits("10000", 6), 0, false, { gasLimit: 5_000_000 });
  await tpTx2.wait(1);
  console.log(`  ✅ Added Policy for Mock USDC: 10000 limit, no expiry, any spender`);

  // Whitelist 1 spender
  const safeExchange = ethers.Wallet.createRandom().address;
  let wlTx = await ApprovalPolicy.addToWhitelist(safeExchange, { gasLimit: 5_000_000 });
  await wlTx.wait(1);
  console.log(`  ✅ Added ${safeExchange} to Whitelist`);

  console.log("\n🚨 Seeding Danger Dashboard Transactions...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const dangerToken = await MockERC20.deploy("Fake USD Coin", "USDC", { gasLimit: 5_000_000 });
  await dangerToken.waitForDeployment();
  const tokenAddr = await dangerToken.getAddress();
  
  const sketchySpender = ethers.Wallet.createRandom().address;
  const approveTx = await dangerToken.approve(sketchySpender, ethers.MaxUint256, { gasLimit: 5_000_000 });
  await approveTx.wait(1);
  console.log(`  ✅ Deployed Fake USDC (${tokenAddr})`);
  console.log(`  ✅ Granted UNLIMITED approval to suspicious address ${sketchySpender} (Will score DANGER)`);

  console.log("\n🎉 Seed Complete! Reload your Dashboard.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
