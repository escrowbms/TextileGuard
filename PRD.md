# TextileGuard (SaaS Platform) - Final Complete PRD

## 1. 🧠 Product Definition

**Product Name**: TextileGuard  
**Category**: SaaS Platform / Credit Control System / Receivable Enforcement Infrastructure  
**Core Philosophy**: “ERP stores data. TextileGuard enforces discipline.”  
**Core Outcome**: Reduce overdue receivables, improve cash flow, and automate recovery.

## 2. ⚙️ Current Tech Stack (AS-IS)

- **Frontend**: React 18 (Vite SPA)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide Icons
- **Routing**: React Router v6
- **Backend/Infra**: Supabase (PostgreSQL), Firebase Auth (JWT)
- **Hosting**: Firebase Hosting
- **Architecture**: Serverless SPA + Direct Supabase client calls.

## 3. 🏗️ Product State (Current)

| Status | Feature |
| :--- | :--- |
| ✅ | Landing Page (Industrial Design) |
| ✅ | Authentication (Firebase Auth) |
| ✅ | Dashboard System (O/S Balance, Risk Heatmap) |
| ✅ | Invoice System (Creation, basic tracking) |
| ✅ | Customer Ledger (Exposure, Risk Profile) |
| ✅ | Customer Detail Page (Transaction history, graphs) |
| 🟢 | Escalation Engine (Alerts UI, WhatsApp trigger interface) |

## 🧩 4. Full Feature Roadmap

### Module 1: Data Extraction Engine

- **ERP Integration**: Tally/Busy ledger sync, sales register import.
- **Status**: 🔴 Not Built

### Module 2: Credit Control System (Core)

- **Enforcement**: Credit limits, exposure tracking, credit freeze, dispatch blocking.
- **Status**: 🟢 Core Built (requires logic centralization)

### Module 3: Aging & Dashboard

- **Analytics**: Aging buckets, heatmap, blocked capital, collection ratio.
- **Status**: 🟡 Partial

### Module 4: Reminder Engine

- **Automation**: Scheduled multi-channel reminders (Email, WhatsApp, SMS).
- **Status**: 🟡 Partial (basic email)

### Module 5: Escalation Engine

- **Flow**: Yellow → Orange → Red → Credit Freeze → Legal.
- **Status**: 🟢 Core Built

### Module 6 & 7: Enforcement & Control

- **Strengthening**: Legal clauses, Interest clauses.
- **Delivery**: POD upload, E-way bill logs.
- **Status**: 🔴 Not Built

### Module 8-10: Intelligence & Capital

- **Follow-up**: Call logs, response tracking.
- **Risk Intelligence**: defaulter detection, payment behavior scoring.
- **Capital Impact**: Interest loss, ROI calculation.
- **Status**: 🔴 Not Built / 🟡 Basic Risk only.

## 5. 🔥 Core Engine Logic

### Enforcement Logic

1. **Invoice Created** → Check Credit Limit → Allow / Block.
2. **Daily Scan** → Calculate Overdue → Assign Risk Level → Send Reminder → Escalate → Freeze Credit.

### Risk Formula (Planned)

`Risk Score = Delay Factor + Dispute + Exposure Growth`

## 6. 🚀 Roadmap

### Phase 1 (Launch Priority)

- [ ] Polish existing system UI/UX.
- [ ] Automate fundamental reminders.
- [ ] Centralize basic enforcement logic in service layer.

### Phase 2

- [ ] Implement WhatsApp automation.
- [ ] Advanced dashboard analytics.
- [ ] Enhanced Risk Intelligence.

### Phase 3

- [ ] ERP Integration (Tally/Busy).
- [ ] POD + Legal integration.

## ⚠️ Critical Fixes Needed

1. **Security**: Centralize logic in services and implement **Supabase RLS** for multi-tenancy.
2. **Logic**: Shift enforcement logic from UI-driven to Service/Backend driven.
3. **Data**: Setup proper isolation for multi-tenant SaaS architecture.
