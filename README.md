<div align="center">

<img src="frontend/app/icon.svg" width="72" height="72" alt="DotSafe Logo" />

# DotSafe

### AI-Powered Wallet Risk Guard for Passet Hub

**Scan, score, and revoke risky token approvals — before they drain your wallet.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Polkadot](https://img.shields.io/badge/Passet_Hub-420420417-E6007A?logo=polkadot)](https://polkadot.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-73%2F73_Passing-00E5A0)](contracts/test/)
[![Hackathon](https://img.shields.io/badge/🏆_Track_1-AI_Powered_DApps-E6007A?style=flat)](https://dorahacks.io/hackathon/polkadot-solidity-hackathon)

<br />

<img src="https://img.shields.io/badge/🏆_Polkadot_Solidity_Hackathon_2026-Track_1:_AI_Powered-E6007A?style=for-the-badge" alt="Hackathon Track" />

<img src="https://img.shields.io/badge/⚠️_Stop_Approvals_From_Draining_Your_Wallet-FF3B30?style=for-the-badge" alt="Stop Approvals" />

</div>

<br />

---

## 🧩 The Problem

Every time you interact with a dApp, you grant **token approvals** — permission for smart contracts to spend your tokens. Most users approve **unlimited amounts** and never think about it again.

**The risk?** A single exploited or malicious contract can drain your entire balance through a forgotten approval.

DotSafe solves this by giving you **full visibility, AI-powered risk analysis, and one-click batch revocation** on **Passet Hub**. It also monitors XCM-connected parachains from one dashboard so you can act before stale approvals become exploitable.

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

### 📊 Risk Dashboard
Real-time analytics with an animated risk meter, approval breakdown by danger level, and actionable insights — all in a sleek, dark-themed interface.

</td>
<td>

### 🛡️ Approval Policies
Set per-token spending limits, time-bounded approval windows, and spender whitelists enforced on-chain through the `ApprovalPolicy` contract.

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
│  │   Hooks (Thirdweb SDK)   │  │  /api/score-contract │  │
│  │  • useApprovalScanner    │  │  (Gemini AI Scoring) │  │
│  │  • useBatchRevoke        │  └──────────┬──────────┘  │
│  │  • useXCMGuard           │             │              │
│  │  • useAIScoring          │      ┌──────▼──────┐      │
│  │  • useApprovalPolicy     │      │  Gemini 2.0 │      │
│  └─────────┬────────────────┘      │    Flash     │      │
│            │                       └──────────────┘      │
└────────────┼───────────────────────┴──────────────┴─────┘
             │
     ┌───────▼───────────────────────────────────────┐
     │             Passet Hub (420420417)            │
     │  ┌──────────────┐ ┌────────────┐ ┌─────────┐  │
     │  │ Approval     │ │  Batch     │ │  XCM    │  │
     │  │ Scanner      │ │  Revoker   │ │  Guard  │  │
     │  └──────────────┘ └────────────┘ └─────────┘  │
     │                 ┌───────────────────────────┐ │
     │                 │      Approval Policy      │ │
     │                 └───────────────────────────┘ │
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
| **Smart Contracts** | Solidity 0.8.24 · Hardhat · OpenZeppelin 5.x |
| **Frontend** | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| **Web3** | ThirdWeb SDK v5 |
| **AI Engine** | Google Gemini 2.0 Flash |
| **State** | Zustand 5 |
| **Animations** | Framer Motion |
| **Fonts** | Syne · Manrope · Space Mono |
| **Chains** | Passet Hub (Chain ID `420420417`) |

---

## 📦 Smart Contracts

### Deployed Addresses

| Contract | Address |
|----------|---------|
| `ApprovalScanner` | `0x723BE9931C1417Ef00B7f6f426e387Dc5099E602` |
| `BatchRevoker` | `0xe136a28958DBd9Ad3A8c942B91e01064f95a1E8f` |
| `XCMGuard` | `0x78e0C8c7a94122211E07b14562C5d781aDA748dC` |
| `ApprovalPolicy` | `0x19eDb13a0FA86a89aC7fD14f811769230B3Bf00A` |

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

> Cross-chain approval monitoring via Polkadot XCM.

| Function | Description |
|----------|-------------|
| `sendRiskAlert(destParaId, suspicious, xcmMsg)` | Send risk alert to a parachain |
| `requestCrossChainScan(destParaId, wallet, xcmMsg)` | Initiate remote chain scan |
| `getMonitoredParachains()` | Returns monitored parachain IDs |
| `isMonitored(paraId)` | Check if a parachain is monitored |

### ApprovalPolicy

> User-configurable spending rules and trusted spender allowlists.

| Function | Description |
|----------|-------------|
| `registerWallet()` | Registers a wallet for policy management |
| `setPolicy(token, maxAllowance, approvalWindow, whitelistOnly)` | Writes a token-specific approval policy |
| `removePolicy(token)` | Removes a token-specific approval policy |
| `addWhitelistEntry(spender)` | Adds a spender to the allowlist |
| `removeWhitelistEntry(spender)` | Removes a spender from the allowlist |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn**
- A wallet with **Passet Hub** configured (Chain ID: `420420417`)
- **Gemini API Key** — Get one at [ai.google.dev](https://ai.google.dev/)

### 1. Clone the Repository

```bash
git clone https://github.com/Shikhyy/DotSafe.git
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

# Deploy to Passet Hub
npm run deploy:testnet
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
| `POLKADOT_TESTNET_RPC` | ❌ | Custom RPC endpoint for Passet Hub |

### Supported Networks

| Network | Chain ID | Currency | Explorer |
|---------|----------|----------|----------|
| **Passet Hub** | 420420417 | PAS (18 decimals) | [Subscan](https://assethub-paseo.subscan.io) |

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

**73/73 tests passing** ✅ — Test coverage includes:

- **ApprovalScanner** (7 tests) — Allowance checks, batch operations, at-risk value calculations
- **BatchRevoker** (13 tests) — Single/batch revocations, event emissions, input validation
- **XCMGuard** (32 tests) — Parachain monitoring, cross-chain alerts, access control
- **ApprovalPolicy** (21 tests) — Policy management, whitelist updates, registration flow

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
│   │   ├── BatchRevoker.sol    # Atomic batch revocation
│   │   ├── XCMGuard.sol        # Cross-chain XCM monitoring
│   │   ├── ApprovalPolicy.sol  # On-chain approval rules
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
│   │   ├── policy/             # Approval policy manager
│   │   ├── history/            # Revocation history
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

## 🎬 Demo & Testing Guide

See **[DEMO.md](DEMO.md)** for a step-by-step guide to test DotSafe, including:
- Connecting a wallet on Passet Hub testnet
- Scanning approvals and viewing AI risk scores
- Batch revoking dangerous approvals
- Managing approval policies
- Exploring XCM cross-chain monitoring

**Contract addresses on Passet Hub Testnet (420420417):**

| Contract | Subscan Link |
|----------|--------------|
| ApprovalScanner | [0x723B...9602](https://assethub-paseo.subscan.io/account/0x723BE9931C1417Ef00B7f6f426e387Dc5099E602) |
| BatchRevoker | [0xe136...8f](https://assethub-paseo.subscan.io/account/0xe136a28958DBd9Ad3A8c942B91e01064f95a1E8f) |
| XCMGuard | [0x78e0...8dC](https://assethub-paseo.subscan.io/account/0x78e0C8c7a94122211E07b14562C5d781aDA748dC) |
| ApprovalPolicy | [0x19eD...00A](https://assethub-paseo.subscan.io/account/0x19eDb13a0FA86a89aC7fD14f811769230B3Bf00A) |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built for the Polkadot ecosystem** 🟣

*Protecting wallets, one approval at a time.*

</div>
