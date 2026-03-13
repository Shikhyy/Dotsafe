/**
 * Deploy DotSafe contracts to Westend Asset Hub via native substrate extrinsic
 * (revive.instantiateWithCode) - bypasses broken ETH RPC layer
 *
 * Usage:
 *   MNEMONIC="your twelve word mnemonic here" node scripts/deploySubstrate.js
 *   OR (using private key from .env):
 *   node scripts/deploySubstrate.js --use-env-key
 */
const { ApiPromise, WsProvider, Keyring } = require("@polkadot/api");
const { cryptoWaitReady } = require("@polkadot/util-crypto");
const { hexToU8a, u8aToHex } = require("@polkadot/util");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const WS_RPC = "wss://westend-asset-hub-rpc.polkadot.io";

function loadArtifact(contractName) {
  const artifactPath = path.join(
    __dirname,
    `../artifacts/contracts/${contractName}.sol/${contractName}.json`
  );
  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `Artifact not found: ${artifactPath}\nRun: npx hardhat compile --network westendAssetHub`
    );
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const bytecode = artifact.bytecode;
  if (!bytecode.startsWith("0x50564d00")) {
    throw new Error(
      `${contractName} bytecode is NOT PolkaVM (PVM). Got: ${bytecode.slice(0, 12)}\n` +
        `Compile with: npx hardhat compile --force --network westendAssetHub`
    );
  }
  return { bytecode, abi: artifact.abi };
}

async function deployContract(api, signer, name, bytecode) {
  console.log(`\nDeploying ${name}...`);
  const codeBytes = hexToU8a(bytecode);
  const WEIGHT_REF_TIME = 10_000_000_000n;
  const WEIGHT_PROOF_SIZE = 1_000_000n;
  const STORAGE_DEPOSIT_LIMIT = null; // let runtime calculate

  const tx = api.tx.revive.instantiateWithCode(
    0, // value (no native token transfer)
    { refTime: WEIGHT_REF_TIME, proofSize: WEIGHT_PROOF_SIZE },
    STORAGE_DEPOSIT_LIMIT,
    codeBytes,
    "0x", // constructor data (empty for no-arg constructors)
    null // salt
  );

  // Fetch nonce and use immortal era (0x00 + genesisHash) to avoid "ancient birth block"
  const immortalEra = api.createType("ExtrinsicEra");
  const nonce = await api.rpc.system.accountNextIndex(signer.address);

  return new Promise((resolve, reject) => {
    let contractAddress = null;
    tx.signAndSend(
      signer,
      { nonce, era: immortalEra, blockHash: api.genesisHash },
      ({ status, events, dispatchError }) => {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            reject(new Error(`${name} deploy failed: ${decoded.section}.${decoded.name}: ${decoded.docs}`));
          } else {
            reject(new Error(`${name} deploy failed: ${dispatchError.toString()}`));
          }
          return;
        }
        if (status.isInBlock || status.isFinalized) {
          for (const { event } of events) {
            if (api.events.revive?.Instantiated?.is(event)) {
              contractAddress = event.data.contract?.toString() || event.data[1]?.toString();
            }
            if (api.events.system.ExtrinsicSuccess.is(event)) {
              console.log(`  ✅ ${name} deployed at: ${contractAddress || "check events"}`);
              resolve(contractAddress);
            }
            if (api.events.system.ExtrinsicFailed.is(event)) {
              reject(new Error(`${name} extrinsic failed`));
            }
          }
        }
      }
    ).catch(reject);
  });
}

async function main() {
  await cryptoWaitReady();

  const useEnvKey = process.argv.includes("--use-env-key");
  const mnemonic = process.env.MNEMONIC;

  if (!mnemonic && !useEnvKey) {
    console.error(`
Usage:
  MNEMONIC="word1 word2 ... word12" node scripts/deploySubstrate.js
  
  Or export your 12-word SubWallet mnemonic as the MNEMONIC env variable.
  
  If you want to use the Ethereum private key from .env (as ECDSA substrate key):
  node scripts/deploySubstrate.js --use-env-key
`);
    process.exit(1);
  }

  const keyring = new Keyring({ type: mnemonic ? "sr25519" : "ecdsa" });
  let signer;

  if (useEnvKey) {
    const privKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privKey) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");
    // Add as ECDSA key (Ethereum-compatible)
    signer = keyring.addFromSeed(hexToU8a("0x" + privKey.replace("0x", "")));
    console.log(`Using ECDSA key, substrate address: ${signer.address}`);
  } else {
    signer = keyring.addFromMnemonic(mnemonic);
    console.log(`Using sr25519 key from mnemonic, substrate address: ${signer.address}`);
  }

  console.log("\n🛡️  DotSafe - Native Substrate Deployment");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📡 Connecting to: ${WS_RPC}`);

  const provider = new WsProvider(WS_RPC);
  const api = await ApiPromise.create({ provider });

  const chainInfo = await api.rpc.system.chain();
  console.log(`🌐 Chain: ${chainInfo}`);

  const { data: balance } = await api.query.system.account(signer.address);
  const free = balance.free.toBigInt();
  console.log(`💰 Balance: ${(Number(free) / 1e10).toFixed(4)} WND`);

  if (free === 0n) {
    console.error("\n❌ Zero balance! Get testnet WND from:");
    console.error("   https://faucet.polkadot.io/?parachain=1000  (select Westend)");
    process.exit(1);
  }

  // Check pallet-revive is available
  if (!api.tx.revive) {
    console.error("\n❌ pallet-revive not found on this chain!");
    process.exit(1);
  }
  console.log("✅ pallet-revive available\n");

  // Map the account to an EVM address (required once per account before any revive tx)
  console.log("Mapping account to EVM address (required by pallet-revive)...");
  const immortalEra = api.createType("ExtrinsicEra");
  const nonce0 = await api.rpc.system.accountNextIndex(signer.address);
  await new Promise((resolve, reject) => {
    api.tx.revive.mapAccount().signAndSend(
      signer,
      { nonce: nonce0, era: immortalEra, blockHash: api.genesisHash },
      ({ status, events, dispatchError }) => {
        if (dispatchError) {
          // AccountAlreadyMapped is fine — just means it was already done
          const errStr = dispatchError.toString();
          if (errStr.includes("AlreadyMapped") || errStr.includes("AccountAlreadyMapped")) {
            console.log("  ℹ️  Account already mapped, continuing...");
            resolve();
          } else {
            reject(new Error(`mapAccount failed: ${errStr}`));
          }
          return;
        }
        if (status.isInBlock || status.isFinalized) {
          for (const { event } of events) {
            if (api.events.system.ExtrinsicSuccess.is(event)) {
              console.log("  ✅ Account mapped successfully");
              resolve();
            }
            if (api.events.system.ExtrinsicFailed.is(event)) {
              // Check if it's AlreadyMapped
              const decoded = events.find(({ event: e }) =>
                api.events.revive?.AccountAlreadyMapped?.is(e)
              );
              if (decoded) {
                console.log("  ℹ️  Account already mapped, continuing...");
                resolve();
              } else {
                reject(new Error("mapAccount extrinsic failed"));
              }
            }
          }
        }
      }
    ).catch(reject);
  });

  // Load PVM bytecodes
  const contracts = ["ApprovalScanner", "BatchRevoker", "XCMGuard", "ApprovalPolicy"];
  const addresses = {};

  for (const name of contracts) {
    const { bytecode } = loadArtifact(name);
    const addr = await deployContract(api, signer, name, bytecode);
    addresses[name] = addr;
  }

  console.log("\n🎉 All contracts deployed!");
  console.log("\nAdd to frontend/.env.local:");
  console.log(`NEXT_PUBLIC_APPROVAL_SCANNER_ADDRESS=${addresses.ApprovalScanner}`);
  console.log(`NEXT_PUBLIC_BATCH_REVOKER_ADDRESS=${addresses.BatchRevoker}`);
  console.log(`NEXT_PUBLIC_XCM_GUARD_ADDRESS=${addresses.XCMGuard}`);
  console.log(`NEXT_PUBLIC_APPROVAL_POLICY_ADDRESS=${addresses.ApprovalPolicy}`);

  // Save deployment
  const deployment = {
    network: "westendAssetHub",
    chain: chainInfo.toString(),
    deployedAt: new Date().toISOString(),
    deployer: signer.address,
    contracts: addresses,
  };
  const outPath = path.join(__dirname, "../deployments/westendAssetHub.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log(`\n📄 Saved to deployments/westendAssetHub.json`);

  await api.disconnect();
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
