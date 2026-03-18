# 🎬 DotSafe Demo Guide

> **For Hackathon Judges** — Step-by-step instructions to evaluate DotSafe.

---

## ⚡ Quick Start (Local)

```bash
# 1. Clone the repo
git clone https://github.com/Shikhyy/DotSafe.git && cd DotSafe

# 2. Run contract tests (73/73 should pass)
cd contracts && npm install && npm test

# 3. Start frontend
cd ../frontend && npm install && npm run dev
```

Open **http://localhost:3000** in your browser.

### Environment Variables (Required)

Create `frontend/.env.local`:
```env
GEMINI_API_KEY=<your_gemini_api_key>
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=<your_thirdweb_client_id>
```

- Get a Gemini API key → [ai.google.dev](https://ai.google.dev/)
- Get a ThirdWeb client ID → [thirdweb.com](https://thirdweb.com/dashboard)

---

## 🔍 What to Test

### 1. Landing Page (`/`)
- See the DotSafe branding with Track 1 badge
- See the 3-step security flow walkthrough
- Click **Connect Wallet** (MetaMask recommended)
- Set your wallet to **Passet Hub** testnet (Chain ID: `420420417`, RPC: `https://eth-rpc-testnet.polkadot.io/`)

### 2. Dashboard (`/dashboard`)
- After wallet connection, automatic approval scanning begins
- Watch the **skeleton loading animation** during the scan
- See **real-time AI risk scoring** powered by Gemini 2.0 Flash
- Each approval shows:
  - 🟢🟡🔴 Risk badge (SAFE / CAUTION / DANGER)
  - Risk score circle (0-100)
  - Expand any row to see **AI analysis details**:
    - Risk score dial
    - Confidence level (HIGH/MEDIUM/LOW/VERY_LOW)
    - Risk factor breakdown (Critical/High/Medium)
    - Mitigation recommendations
    - AI model attribution
- Click **Revoke** on any individual approval
- Or select multiple and use **Batch Revoke** from the footer

### 3. Approval Policies (`/policy`)
- Click **Register Wallet On-Chain** (one-time)
- **Add Policy**: Set per-token spending limits and time windows
- **Add Whitelist**: Pre-approve trusted contract addresses
- See the OpenZeppelin architecture breakdown (AccessControl, EnumerableSet, Pausable)

### 4. XCM Cross-Chain Guard (`/xcm`)
- View monitored parachains: **Moonbeam (2004)**, **Astar (2006)**, **Acala (2000)**
- Click **Sync XCM Status** to refresh on-chain state
- See alert counts per chain

### 5. Revocation History (`/history`)
- After revoking approvals, see recorded transactions
- Click the external link icon to view on Subscan

---

## 📄 Deployed Contracts (Passet Hub Testnet)

| Contract | Address | Verify on Subscan |
|----------|---------|-------------------|
| ApprovalScanner | `0x723BE9931C1417Ef00B7f6f426e387Dc5099E602` | [View](https://assethub-paseo.subscan.io/account/0x723BE9931C1417Ef00B7f6f426e387Dc5099E602) |
| BatchRevoker | `0xe136a28958DBd9Ad3A8c942B91e01064f95a1E8f` | [View](https://assethub-paseo.subscan.io/account/0xe136a28958DBd9Ad3A8c942B91e01064f95a1E8f) |
| XCMGuard | `0x78e0C8c7a94122211E07b14562C5d781aDA748dC` | [View](https://assethub-paseo.subscan.io/account/0x78e0C8c7a94122211E07b14562C5d781aDA748dC) |
| ApprovalPolicy | `0x19eDb13a0FA86a89aC7fD14f811769230B3Bf00A` | [View](https://assethub-paseo.subscan.io/account/0x19eDb13a0FA86a89aC7fD14f811769230B3Bf00A) |

---

## 🧪 Contract Tests

```bash
cd contracts && npm test
```

**Expected output: 73/73 tests passing ✅**

| Contract | Tests | Coverage |
|----------|-------|----------|
| ApprovalScanner | 7 | Allowances, batch operations, at-risk value |
| BatchRevoker | 13 | Single/batch revoke, events, validation |
| ApprovalPolicy | 21 | Policies, whitelist, roles, pausable |
| XCMGuard | 32 | Parachains, alerts, access control, scans |

---

## 🤖 AI Scoring Details

The AI scoring engine at `/api/score-contract` uses **Google Gemini 2.0 Flash** with a comprehensive prompt that evaluates:

- Contract verification status
- Unlimited vs limited allowances
- Contract age on the nascent Polkadot Hub ecosystem
- Upgradeable proxy patterns
- XCM cross-chain exposure
- Known audited protocols (risk reducers)

Each response includes: `riskScore`, `confidence`, `confidenceLevel`, `riskFactors`, `mitigations`, `recommendation`, and `riskTrend`.

---

## 📚 Additional Documentation

- [AI_METHODOLOGY.md](./AI_METHODOLOGY.md) — Complete risk scoring methodology
- [TRACK1_AI_SUBMISSION.md](./TRACK1_AI_SUBMISSION.md) — Track 1 judges' package
- [SUBMISSION_CHECKLIST.md](./SUBMISSION_CHECKLIST.md) — Full feature checklist
