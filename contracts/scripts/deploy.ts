/**
 * DotSafe Deployment Script
 * Compatible with Polkadot Asset Hub EVM (no `pending` block tag)
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network westendAssetHub
 *   npx hardhat run scripts/deploy.ts --network polkadotHub
 */

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("\n🛡️  DotSafe Contract Deployment");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📬 Deployer:  ${deployer.address}`);
  console.log(`🌐 Network:   ${network.name} (chainId: ${network.chainId})`);
  console.log(`💰 Balance:   ${ethers.formatUnits(balance, 12)} WND (raw: ${balance.toString()})\n`);

  if (balance === 0n) {
    throw new Error("Deployer has no balance. Fund the account first.");
  }

  const GAS_LIMIT = 5_000_000;
  const feeData = await ethers.provider.getFeeData();
  console.log(`⛽ Gas: gasPrice=${feeData.gasPrice}, maxFee=${feeData.maxFeePerGas}, maxPriority=${feeData.maxPriorityFeePerGas}\n`);

  // ── 1. ApprovalScanner ──────────────────────────────────────────────────
  console.log("Deploying ApprovalScanner...");
  const ApprovalScanner = await ethers.getContractFactory("ApprovalScanner");
  const approvalScanner = await ApprovalScanner.deploy({ gasLimit: GAS_LIMIT });
  await approvalScanner.waitForDeployment();
  const approvalScannerAddr = await approvalScanner.getAddress();
  console.log(`  ✅ ApprovalScanner:  ${approvalScannerAddr}`);

  // ── 2. BatchRevoker ─────────────────────────────────────────────────────
  console.log("Deploying BatchRevoker...");
  const BatchRevoker = await ethers.getContractFactory("BatchRevoker");
  const batchRevoker = await BatchRevoker.deploy({ gasLimit: GAS_LIMIT });
  await batchRevoker.waitForDeployment();
  const batchRevokerAddr = await batchRevoker.getAddress();
  console.log(`  ✅ BatchRevoker:     ${batchRevokerAddr}`);

  // ── 3. XCMGuard ─────────────────────────────────────────────────────────
  console.log("Deploying XCMGuard...");
  const XCMGuard = await ethers.getContractFactory("XCMGuard");
  const xcmGuard = await XCMGuard.deploy({ gasLimit: GAS_LIMIT });
  await xcmGuard.waitForDeployment();
  const xcmGuardAddr = await xcmGuard.getAddress();
  console.log(`  ✅ XCMGuard:         ${xcmGuardAddr}`);

  // ── 4. ApprovalPolicy ───────────────────────────────────────────────────
  console.log("Deploying ApprovalPolicy...");
  const ApprovalPolicy = await ethers.getContractFactory("ApprovalPolicy");
  const approvalPolicy = await ApprovalPolicy.deploy({ gasLimit: GAS_LIMIT });
  await approvalPolicy.waitForDeployment();
  const approvalPolicyAddr = await approvalPolicy.getAddress();
  console.log(`  ✅ ApprovalPolicy:   ${approvalPolicyAddr}`);

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 All contracts deployed!\n");
  console.log("Add these to frontend/.env.local:\n");
  console.log(`NEXT_PUBLIC_APPROVAL_SCANNER_ADDRESS=${approvalScannerAddr}`);
  console.log(`NEXT_PUBLIC_BATCH_REVOKER_ADDRESS=${batchRevokerAddr}`);
  console.log(`NEXT_PUBLIC_XCM_GUARD_ADDRESS=${xcmGuardAddr}`);
  console.log(`NEXT_PUBLIC_APPROVAL_POLICY_ADDRESS=${approvalPolicyAddr}`);

  // ── Write deployment JSON ────────────────────────────────────────────────
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      ApprovalScanner: approvalScannerAddr,
      BatchRevoker: batchRevokerAddr,
      XCMGuard: xcmGuardAddr,
      ApprovalPolicy: approvalPolicyAddr,
    },
  };

  const outDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${network.chainId}.json`);
  fs.writeFileSync(outFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📄 Deployment saved to deployments/${network.chainId}.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
