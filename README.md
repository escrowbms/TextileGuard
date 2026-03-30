# 🛡️ TextileGuard: Receivable Enforcement Infrastructure

**"ERP stores data. TextileGuard enforces discipline."**

TextileGuard is a high-performance SaaS platform built specifically for the textile and manufacturing industries. It moves beyond passive accounting logs by actively enforcing payment discipline through automated cloud-workers, multi-channel nudges, and a penal interest recovery engine.

---

## 🚀 Key Features

### 1. ☁️ Automated Cloud Enforcement
- **Edge Functions**: Background workers scanning for overdue invoices daily.
- **Smart Queueing**: Automatically prioritizes high-risk buyers for escalations.
1. **Sync Pulse**: Real-time heartbeat monitoring for your automation infrastructure.

### 2. 📈 Interest Recovery Engine (Blocked Capital)
- **Automatic Calculation**: Detects penal interest opportunities (default @ 18% or custom).
- **Recovery Ledger**: Detailed view of capital lost due to payment delays.
- **Debit Note Generation**: Suggests the exact recovery value for late-paying customers.

### 3. 💬 multi-Channel Reminders (Zero-Cost)
- **WhatsApp Nudges**: Deep-linked, zero-cost WhatsApp reminders that open directly from your phone.
- **Email & SMS Escalations**: Tiered reminder system (e.g., 7 days, 15 days, 30 days overdue).
- **Reminders Center**: Centralized inbox for all pending recovery actions.

### 4. 📂 Enterprise Data Pipeline
- **ERP Integration**: XML Parser for Tally Prime, Tally.ERP 9, and Busy.
- **Bulk Import**: Process thousands of invoices and ledger entries in seconds.
- **Real-Time Mapping**: Seamlessly joins customer data with aging invoices.

### 5. 🏠 Dashboard & Risk Monitoring
- **Global Credit Limits**: Visual alerts when buyers exceed safe thresholds.
- **Exposure Analytics**: Total risk distribution by city, amount, and age.
- **Risk Escalations**: Specialized "High Priority" view for accounts requiring immediate attention.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 (Vite), Tailwind CSS, Framer Motion |
| **Backend** | Supabase (PostgreSQL), Edge Functions (Deno) |
| **Auth** | Firebase Authentication (JWT) |
| **Hosting** | Firebase Hosting |
| **Database** | PostgreSQL with Row Level Security (RLS) |

---

## 🔒 Security & Multi-Tenancy

TextileGuard is built for strict data isolation.
- **Row Level Security (RLS)**: Every single query is locked by `company_id` at the database level.
- **Zero-Cross Leakage**: A user from Company A can never, under any circumstance, see data from Company B.
- **Audit Logs**: All reminders and status changes are tracked with timestamps.

---

## 💻 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account
- Firebase Project

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/escrowbms/TextileGuard.git
   cd TextileGuard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables (`.env`):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_FIREBASE_API_KEY=your_firebase_key
   ...
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## 📄 License
Copyright © 2026 EscrowBMS. All rights reserved. Proprietary software for Textile Receivable Management.
