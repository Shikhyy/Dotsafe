/**
 * Raw ethers.js deploy script — bypasses Hardhat's transaction management
 * which is incompatible with Polkadot Asset Hub's EVM.
 *
 * Usage: node scripts/deployRaw.js
 */
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function deployContract(wallet, name) {
  const artifactPath = path.join(
    __dirname, '..', 'artifacts', 'contracts',
    `${name}.sol`, `${name}.json`
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  console.log(`Deploying ${name}...`);
  // Use legacy transaction (type 0) — Polkadot Hub EVM does not support EIP-1559
  const txOverrides = {
    gasLimit: 5_000_000,
    gasPrice: BigInt('1000000000'),
    type: 0,
  };
  const contract = await factory.deploy(txOverrides);
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log(`  ✅ ${name}: ${addr}`);
  return addr;
}

async function main() {
  const rpcUrl = process.env.WESTEND_RPC || 'https://westend-asset-hub-eth-rpc.polkadot.io';
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) throw new Error('DEPLOYER_PRIVATE_KEY not set in .env');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);
  const network = await provider.getNetwork();

  console.log('\n🛡️  DotSafe Raw Deployment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📬 Deployer: ${wallet.address}`);
  console.log(`🌐 Network:  chainId ${network.chainId}`);
  console.log(`💰 Balance:  ${ethers.formatEther(balance)} WND\n`);

  if (balance === 0n) throw new Error('Deployer has no balance');

  const approvalScannerAddr = await deployContract(wallet, 'ApprovalScanner');
  const batchRevokerAddr    = await deployContract(wallet, 'BatchRevoker');
  const xcmGuardAddr        = await deployContract(wallet, 'XCMGuard');
  const approvalPolicyAddr  = await deployContract(wallet, 'ApprovalPolicy');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 All contracts deployed!\n');
  console.log('Add these to frontend/.env.local:\n');
  console.log(`NEXT_PUBLIC_APPROVAL_SCANNER_ADDRESS=${approvalScannerAddr}`);
  console.log(`NEXT_PUBLIC_BATCH_REVOKER_ADDRESS=${batchRevokerAddr}`);
  console.log(`NEXT_PUBLIC_XCM_GUARD_ADDRESS=${xcmGuardAddr}`);
  console.log(`NEXT_PUBLIC_APPROVAL_POLICY_ADDRESS=${approvalPolicyAddr}`);

  // Save deployment JSON
  const outDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const deployment = {
    network: `chainId-${network.chainId}`,
    chainId: network.chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: wallet.address,
    contracts: {
      ApprovalScanner: approvalScannerAddr,
      BatchRevoker: batchRevokerAddr,
      XCMGuard: xcmGuardAddr,
      ApprovalPolicy: approvalPolicyAddr,
    },
  };
  fs.writeFileSync(
    path.join(outDir, `${network.chainId}.json`),
    JSON.stringify(deployment, null, 2)
  );
  console.log(`\n📄 Saved to deployments/${network.chainId}.json`);
}

main().catch((err) => { console.error(err); process.exit(1); });
