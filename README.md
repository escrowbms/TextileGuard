# 🛡️ TextileGuard: Receivable Enforcement Infrastructure

"ERP stores data. TextileGuard enforces discipline."

TextileGuard is a high-performance, industrial-grade SaaS platform designed to solve the chronic credit-control crisis in the textile and manufacturing sectors. It transforms passive accounting entries into active recovery protocols through automated enforcement, penal interest recovery, and a veteran-designed administrative command center.

---

## 🚀 Core Platform Functionality

### 1. ☁️ Automated Cloud Enforcement (RECEIVABLE SURVEILLANCE)

- **Real-Time Heartbeat**: Automated background workers scan the database every 24 hours to detect overdue invoices.
- **Smart Queueing**: Uses advanced risk-heuristics to prioritize high-value overdue accounts for immediate follow-up.

### 2. 📈 Penal Interest Recovery Engine (CAPITAL RECLAMATION)

- **Automatic Interest Calculation**: Automatically detects any payment delay beyond the grace period and calculates penal interest (standard @ 18% or custom).
- **Interest Ledgers**: A specialized dashboard showing exactly how much capital a company has lost to delayed payments.
- **Debit Note Generation**: Provides clear recovery value suggestions for every late-paying customer.

### 3. 💬 multi-Channel Reminders (NATIVE ESCALATIONS)

- **WhatsApp Nudges**: Deep-linked reminders that allow operators to send official pay-notices directly from their authorized mobile devices with zero external API costs.
- **Tiered Escalations**: Automatic reminder triggers at 7, 15, and 30 days overdue, ensuring persistent follow-up.
- **Reminders Management Center**: A dedicated inbox for tracking sent reminders and pending follow-ups.

### 4. 📂 Enterprise Data Pipeline (BULK SYNCHRONIZATION)

- **XML Data Parser**: Purpose-built importers for Tally Prime, Tally.ERP 9, and Busy (Standard XML Export).
- **High-Speed Processing**: Import thousands of ledger entries, invoices, and customer entities in seconds.
- **Schema Validation**: Ensures all financial data is formatted correctly before entering the production environment.

### 5. 🏠 Dashboard & Risk Intelligence (STRATEGIC OVERSIGHT)

- **Exposure Metric**: Real-time view of total outstanding and total overdue capital.
- **Aging Distribution**: Granular breakdown of receivables (0-30, 31-60, 61-90, 90+ days).
- **Credit Limit Alerts**: Immediate visual warnings when a buyer exceeds their pre-configured credit threshold.

### 6. 🛡️ SuperAdmin Command Center (THE MATRIX)

- **Entity Management**: Comprehensive grid to monitor, suspend, or terminate company-user accounts.
- **System Protocols**: Global toggles for Maintenance Mode, Public Signups, and Trial Extensions.
- **System Broadcast**: Deploy platform-wide directives and emergency alerts to all active users.
- **Audit Trail**: Real-time persistence of every administrative action for total transparency.
- **Administrative Transparency**: Filtered user list to keep SuperAdmin credentials separate from the operator pool.

---

## 🛠️ Technology Stack (PRODUCTION MATURITY)

| Layer | Technology | Infrastructure |
| :--- | :--- | :--- |
| **Frontend** | React 18 / Vite | Firebase Hosting (CDN) |
| **Backend** | Supabase (v2) | PostgreSQL / Edge Functions |
| **Auth** | Firebase Auth | JWT Secure Sessions |
| **Styling** | Vanilla CSS / Tailored | Veteran High-Contrast UI |
| **Charts** | Recharts | Real-time Analytics |

---

## 🔒 Security & Data Sovereignty

- **Row Level Security (RLS)**: Every single query is strictly isolated by `company_id`. No cross-company data leakage is physically possible at the database level.
- **Bypass Protection**: SuperAdmin access is protected by a dual-layer credential system and an environment-locked `VITE_ADMIN_SECRET_KEY`.
- **Veteran Aesthetics**: Optimized for high-contrast, scroll-free operation using tactical typography (Times New Roman) and zero-opacity fonts for maximum legibility.

---

## 💻 Getting Started (DEVELOPMENT)

### Prerequisites

- Node.js 18+
- Supabase Cloud Project
- Firebase Hosting Project

### Installation & Deployment

1. **Clone & Setup**:

   ```bash
   git clone https://github.com/escrowbms/TextileGuard.git
   npm install
   ```

2. **Environment Configuration**:

   Create a `.env` file with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_FIREBASE_CONFIG`, and `VITE_ADMIN_SECRET_KEY`.

3. **Build & Deploy**:

   ```bash
   npm run build
   firebase deploy
   ```

---

## 📄 Platform Governance

Copyright © 2026 EscrowBMS. All rights reserved.

"TextileGuard is the infrastructure for capital discipline."
