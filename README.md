<div align="center">

# 🛡️ DotSafe

### AI-Powered Wallet Risk Guard for Polkadot Hub

**Scan, score, and revoke risky token approvals — before they drain your wallet.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity)](https://soliditylang.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.x-4E5EE4?logo=openzeppelin)](https://www.openzeppelin.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Polkadot](https://img.shields.io/badge/Polkadot-Hub-E6007A?logo=polkadot)](https://polkadot.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<br />

<img src="https://img.shields.io/badge/Polkadot_Hub_Security_OpenZeppelin-E6007A?style=for-the-badge" alt="Polkadot Hub Security" />

<br />

> **Track: OpenZeppelin** — Deep, production-grade usage of OZ primitives across all four smart contracts

</div>

<br />

---

## 🏆 Track Compliance

### OpenZeppelin Track — Deep Integration

DotSafe doesn't just *import* OpenZeppelin — it builds **core application logic** on top of OZ primitives in ways that go far beyond boilerplate:

| OZ Primitive | Contract | How It's Used |
|---|---|---|
| **AccessControl** | XCMGuard, ApprovalPolicy | Multi-role permission system: `OPERATOR_ROLE`, `GUARDIAN_ROLE`, `POLICY_ADMIN_ROLE`, `BLACKLIST_MANAGER_ROLE`. Roles control who can send XCM alerts, manage parachains, and administer global blacklists. |
| **Ownable** | BatchRevoker | Owner-only emergency controls for pausing the batch revocation engine. |
| **Pausable** | BatchRevoker, ApprovalPolicy | Circuit-breaker pattern: owner can freeze all batch revocations or policy registrations during exploits. |
| **ReentrancyGuard** | BatchRevoker | Protects atomic batch revocation loops from reentrancy when calling untrusted token contracts. |
| **EnumerableSet** | ApprovalPolicy | Gas-efficient `AddressSet` for per-wallet spender whitelists and a global spender blacklist with O(1) add/remove/contains + enumeration for UI display. |

**4 production contracts × 6 OZ primitives = deep, meaningful integration.**

### Polkadot Compliance

- **Target chain**: Polkadot Hub EVM (Chain ID `420420421`)
- **Testnet**: Westend Asset Hub (Chain ID `420420420`)
- **XCM integration**: Cross-chain messaging to Moonbeam, Astar, and Acala parachains
- **Solidity 0.8.28** compiled with the `cancun` EVM version

---

## 🧩 The Problem

Every time you interact with a dApp, you grant **token approvals** — permission for smart contracts to spend your tokens. Most users approve **unlimited amounts** and never think about it again.

**The risk?** A single exploited or malicious contract can drain your entire balance through a forgotten approval. In 2024 alone, **$2.7 billion** was lost to approval-based exploits.

DotSafe solves this by giving you **full visibility, AI-powered risk analysis, on-chain policy enforcement, and one-click batch revocation** across Polkadot Hub and its parachains.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔍 Instant Approval Scanner
Scans all active ERC-20 and NFT approvals for your connected wallet. Fetches on-chain events, verifies live allowances, and filters out already-revoked permissions.

</td>
<td width="50%">

### 🤖 AI Risk Scoring
Each approval is analyzed by **Google Gemini 2.0 Flash** against multiple risk vectors — unverified code, unlimited allowances, contract age, proxy patterns, and more. Scores range from 0–100 with **SAFE / CAUTION / DANGER** ratings.

</td>
</tr>
<tr>
<td>

### ⚡ Batch Revoke
Select multiple risky approvals and revoke them all in a **single transaction**. No more tedious one-by-one revocations. Supports both ERC-20 and NFT (ERC-721/ERC-1155) approvals.

</td>
<td>

### 🌐 XCM Cross-Chain Guard
Monitor approvals across Polkadot parachains — **Moonbeam**, **Astar**, and **Acala** — via XCM (Cross-Consensus Messaging). Send risk alerts and request scans on remote chains.

</td>
</tr>
<tr>
<td>

### 📜 On-Chain Approval Policy
Register per-token policies with spending limits, spender whitelists, time-bounded approval windows, and a global blacklist. Enforced on-chain before any approval is granted.

</td>
<td>

### 📊 Risk Dashboard
Real-time analytics with an animated risk meter, approval breakdown by danger level, and actionable insights — all in a sleek, dark-themed interface.

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 16)              │
│  ┌───────────┐  ┌──────────┐  ┌───────────┐            │
│  │ Dashboard  │  │ XCM Page │  │ Landing   │            │
│  └─────┬─────┘  └────┬─────┘  └───────────┘            │
│        │              │                                  │
│  ┌─────▼──────────────▼─────┐  ┌─────────────────────┐  │
│  │    Hooks (Wagmi/Viem)    │  │  /api/score-contract │  │
│  │  • useApprovalScanner    │  │  (Gemini AI Scoring) │  │
│  │  • useBatchRevoke        │  └──────────┬──────────┘  │
│  │  • useXCMGuard           │             │              │
│  │  • useAIScoring          │      ┌──────▼──────┐      │
│  └─────────┬────────────────┘      │  Gemini 2.0 │      │
│            │                       │    Flash     │      │
└────────────┼───────────────────────┴──────────────┴─────┘
             │
     ┌───────▼───────────────────────────────────────┐
     │          Polkadot Hub EVM (Chain 420420421)    │
     │  ┌──────────────┐ ┌────────────┐ ┌─────────┐  │
     │  │ Approval     │ │  Batch     │ │  XCM    │  │
     │  │ Scanner      │ │  Revoker   │ │  Guard  │  │
     │  └──────────────┘ └────────────┘ └────┬────┘  │
     └───────────────────────────────────────┼────────┘
                                             │ XCM
                    ┌────────────────────────┼────────────┐
                    │        Parachains      │            │
                    │  ┌─────────┐ ┌────────┐│ ┌───────┐  │
                    │  │Moonbeam │ │ Astar  ││ │ Acala │  │
                    │  │  2004   │ │  2006  ││ │ 2000  │  │
                    │  └─────────┘ └────────┘│ └───────┘  │
                    └────────────────────────┴────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Smart Contracts** | Solidity 0.8.28 · Hardhat · OpenZeppelin 5.x |
| **Frontend** | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| **Web3** | ThirdWeb SDK v5 |
| **AI Engine** | Google Gemini 2.0 Flash |
| **State** | Zustand 5 |
| **Animations** | Framer Motion |
| **Chains** | Polkadot Hub (420420421) · Westend Asset Hub (420420420) |

---

## 📦 Smart Contracts

### ApprovalScanner

> Read-only helper to verify live approval states on-chain.

| Function | Description |
|----------|-------------|
| `checkAllowance(token, owner, spender)` | Returns current ERC-20 allowance |
| `checkApprovalForAll(nft, owner, operator)` | Checks NFT operator approval |
| `batchCheckAllowances(tokens[], spenders[], wallet)` | Batch-check multiple allowances in one call |
| `getAtRiskValue(tokens[], spenders[], wallet)` | Sum of all token value at risk |

### BatchRevoker

> Execute multiple revocations atomically in a single transaction.

| Function | Description |
|----------|-------------|
| `batchRevokeERC20(tokens[], spenders[])` | Revoke multiple ERC-20 approvals |
| `batchRevokeNFT(nfts[], operators[])` | Revoke NFT operator approvals |
| `revokeERC20(token, spender)` | Single-revoke convenience method |

**Events:** `BatchRevoked(wallet, count)` · `SingleRevokeFailed(token, spender, index)`

### XCMGuard

> Cross-chain approval monitoring via Polkadot XCM. Uses **OZ AccessControl** with `OPERATOR_ROLE` and `GUARDIAN_ROLE`.

| Function | Description |
|----------|-------------|
| `sendRiskAlert(destParaId, suspicious, xcmMsg)` | Send risk alert to a parachain |
| `requestCrossChainScan(destParaId, wallet, xcmMsg)` | Initiate remote chain scan |
| `addParachain(paraId)` / `removeParachain(paraId)` | Manage monitored chains |
| `getMonitoredParachains()` | Returns monitored parachain IDs |
| `isMonitored(paraId)` | Check if a parachain is monitored |

### ApprovalPolicy ⭐ *New*

> On-chain policy engine for proactive approval risk management. Uses **OZ AccessControl** (`POLICY_ADMIN_ROLE`, `BLACKLIST_MANAGER_ROLE`), **Pausable**, and **EnumerableSet**.

| Function | Description |
|----------|-------------|
| `registerWallet()` | Register wallet for policy management |
| `setTokenPolicy(token, maxAllowance, window, whitelistOnly)` | Define per-token spending limits & rules |
| `validateAndRecordApproval(wallet, token, spender, amount)` | Validate approval against wallet policy |
| `addToWhitelist(spender)` / `removeFromWhitelist(spender)` | Per-wallet spender whitelist management |
| `addToBlacklist(spender)` / `removeFromBlacklist(spender)` | Global spender blacklist (admin only) |
| `getWhitelist(wallet)` / `getBlacklist()` | Enumerate all whitelisted/blacklisted addresses |

**Policy Engine Logic:**
1. Checks global blacklist → rejects blacklisted spenders
2. Checks wallet whitelist → enforces `whitelistOnly` mode
3. Validates amount against `maxAllowance` ceiling
4. Computes expiry from `approvalWindow` duration
5. Records approval with timestamp for on-chain expiry tracking

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn**
- A wallet with the **Polkadot Hub** network configured (Chain ID: `420420421`)
- **Gemini API Key** — Get one at [ai.google.dev](https://ai.google.dev/)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/DotSafe.git
cd DotSafe
```

### 2. Smart Contracts Setup

```bash
cd contracts
npm install

# Compile contracts & generate TypeChain types
npm run compile

# Run tests
npm run test

# Deploy to testnet (Westend Asset Hub)
npm run deploy:testnet

# Deploy to mainnet (Polkadot Hub)
npm run deploy:mainnet
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create environment file
cat > .env.local << EOF
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
EOF

# Start development server
npm run dev
```

Open **http://localhost:3000** and connect your wallet.

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for AI risk scoring |
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | ✅ | ThirdWeb client ID for wallet connection |
| `DEPLOYER_PRIVATE_KEY` | ✅* | Deployer wallet private key (*for contract deployment only) |
| `POLKADOT_HUB_RPC` | ❌ | Custom RPC endpoint for Polkadot Hub |
| `WESTEND_RPC` | ❌ | Custom RPC endpoint for Westend testnet |

### Supported Networks

| Network | Chain ID | Currency | Explorer |
|---------|----------|----------|----------|
| **Polkadot Hub** | 420420421 | DOT (10 decimals) | [Subscan](https://assethub-polkadot.subscan.io) |
| **Westend Asset Hub** | 420420420 | WND (10 decimals) | [Subscan](https://assethub-westend.subscan.io) |

### XCM Monitored Parachains

| Parachain | Para ID | Status |
|-----------|---------|--------|
| Moonbeam | 2004 | ✅ Active |
| Astar | 2006 | ✅ Active |
| Acala | 2000 | ✅ Active |

---

## 🧪 Testing

```bash
cd contracts
npm run test
```

Test coverage includes:

- **ApprovalScanner** — Allowance checks, batch operations, at-risk value calculations
- **BatchRevoker** — Single/batch revocations, event emissions, pause/unpause, reentrancy guards
- **XCMGuard** — Parachain monitoring, cross-chain alerts, role-based access control
- **ApprovalPolicy** — Wallet registration, policy CRUD, whitelist/blacklist enforcement, approval validation & expiry

---

## 🤖 AI Risk Scoring Engine

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/score-contract` | POST | AI risk scoring via Gemini — returns risk level, score, and reasoning |
| `/api/resolve-spender` | GET | Resolve spender contract address to protocol name |
| `/api/token-metadata` | GET | Fetch token symbol, name, and decimals from on-chain |

DotSafe uses **Google Gemini 2.0 Flash** to analyze each approved contract against multiple risk vectors:

| Risk Factor | Score Impact |
|-------------|-------------|
| Unverified source code | **+30** |
| Unlimited allowance | **+25** |
| Contract age < 30 days | **+20** |
| Upgradeable proxy pattern | **+15** |
| Approval idle > 90 days | **+10** |
| Known audited contract | **−15** |

**Risk Levels:**

| Level | Score Range | Action |
|-------|------------|--------|
| 🟢 **SAFE** | 0 – 29 | No action needed |
| 🟡 **CAUTION** | 30 – 59 | Review recommended |
| 🔴 **DANGER** | 60 – 100 | Revoke immediately |

---

## 📁 Project Structure

```
DotSafe/
├── contracts/                  # Hardhat smart contract workspace
│   ├── contracts/              # Solidity source files
│   │   ├── ApprovalScanner.sol # On-chain approval verification
│   │   ├── BatchRevoker.sol    # Atomic batch revocation (OZ: Ownable, Pausable, ReentrancyGuard)
│   │   ├── XCMGuard.sol        # Cross-chain XCM monitoring (OZ: AccessControl)
│   │   ├── ApprovalPolicy.sol  # On-chain policy engine (OZ: AccessControl, Pausable, EnumerableSet)
│   │   └── mocks/              # Test mock contracts
│   ├── test/                   # Contract test suite
│   ├── ignition/               # Deployment modules
│   ├── typechain-types/        # Auto-generated TypeScript types
│   └── hardhat.config.ts       # Hardhat configuration
│
├── frontend/                   # Next.js frontend application
│   ├── app/                    # App router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── dashboard/          # Main scanning dashboard
│   │   ├── xcm/                # XCM cross-chain monitor
│   │   └── api/                # AI scoring API route
│   ├── components/             # React components
│   │   ├── scanner/            # Approval list & risk cards
│   │   ├── stats/              # Risk meter analytics
│   │   ├── wallet/             # Wallet connection
│   │   └── xcm/                # Parachain cards
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Chains, ABIs, types, config
│   └── store/                  # Zustand global state
│
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Commit** your changes: `git commit -m 'feat: add my feature'`
4. **Push** to the branch: `git push origin feature/my-feature`
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built for the Polkadot ecosystem** 🟣 **| OpenZeppelin-based security architecture**

*Protecting wallets, one approval at a time.*

---

### Why DotSafe Should Win

1. **Real-world problem** — Token approval exploits are one of the largest attack vectors in DeFi. DotSafe provides the first comprehensive approval security suite purpose-built for Polkadot Hub.
2. **Deep OpenZeppelin integration** — Not boilerplate imports. AccessControl manages 4 distinct operational roles, EnumerableSet powers a gas-efficient policy engine, Pausable provides emergency circuit-breakers, and ReentrancyGuard protects batch operations against untrusted token contracts.
3. **Full-stack completeness** — 4 production Solidity contracts + full test suite + AI-powered Next.js frontend + XCM cross-chain messaging. Every layer is functional.
4. **AI innovation** — Gemini 2.0 Flash integration for automated risk analysis against 6+ heuristic vectors, with intelligent caching.
5. **Polkadot-native** — XCM cross-chain guard, Polkadot Hub EVM targeting, parachain monitoring for Moonbeam/Astar/Acala.

</div>
