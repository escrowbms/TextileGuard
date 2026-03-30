# 🛡️ TextileGuard: Product Requirements Document (PRD)

## 1. 🧠 Product Definition

**Product Name**: TextileGuard  
**Category**: SaaS / Receivable Management / Credit Control Infrastructure  
**Target Industry**: Textile, Manufacturing, MSME  
**Core Philosophy**: “ERP stores data. TextileGuard enforces discipline.”  
**Value Proposition**: To solve the problem of ruka hua paisa (overdue receivables) by moving from passive accounting to active enforcement through automation and interest recovery.

---

## 2. ⚙️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18 (Vite SPA) | Fast, modular, and developer-friendly. |
| **Styling** | Tailwind CSS | Utility-first for rapid UI development and industrial look. |
| **Backend** | Supabase (PostgreSQL) | Real-time features, secure database, and built-in Auth. |
| **Deno Workers** | Supabase Edge Functions | Serverless logic for background scanning (Overdue invoices). |
| **Auth** | Firebase Authentication | Enterprise-grade login/JWT management. |
| **Animations** | Framer Motion | Premium "WOW" factor for industrial dashboards. |
| **Hosting** | Firebase Hosting | Scalable global CDN for the static assets. |

---

## 3. 🏗️ Product Modules (Existing + Planned)

### Module 1: Dashboard & Risk Analytics (✅)
- **O/S Balance Tracker**: Real-time monitoring of total market outstanding.
- **Risk Heatmap**: Geographical and amount-based risk visualization.
- **Exposure Analytics**: Charts showing risk by age (0-30, 30-60, 60-90+ days).

### Module 2: Credit Control Engine (🟢)
- **Credit Limits**: Set limits per customer; block further dispatch if exceeded.
- **Enforcement Levels**: Green (Safe) → Yellow (Reminder) → Orange (Warning) → Red (Block).

### Module 3: Interest Recovery System (✅)
- **Automatic Penal Interest**: Calculation of lost interest on delayed payments (default @ 18%).
- **Interest Ledger**: Detailed recovery statements for late-paying customers.

### Module 4: Reminder Engine (🟡 Partial)
- **WhatsApp Nudges**: Deep-linked reminders that open directly on the phone.
- **Automated Emails**: Tiered email alerts triggered by background workers.
- **Call Logs**: Tracking of follow-up calls made to customers.

### Module 5: ERP Integration (🔴 Planned)
- **XML Importer**: Seamless sync with **Tally Prime** and **Busy**.
- **Bulk Upload**: CSV/Excel support for legacy data transition.

---

## 4. 🔥 Core Business Logic

### Enforcement Flow
1. **Invoice Created** → Sync with Supabase → Check Credit Limit.
2. **Daily Scan** → **Cloud Worker** checks for overdue invoices.
3. **Escalation** → If payment delayed, system moves from 'Yellow' to 'Orange'.
4. **Reminders** → Zero-cost WhatsApp nudges sent to the buyer.
5. **Freeze** → If 'Red', system suggests immediate credit freeze and interest recovery.

### Risk Formula (Internal)
`Risk Score = (Age of Invoice × Amount) + (History of Delays) + (Current Exposure %)`

---

## 5. 🔒 Security & Data Isolation

- **Multi-Tenancy**: Strict isolation using `company_id`.
- **Supabase RLS**: Row Level Security prevents any unauthorized data leakage.
- **Firebase Auth**: JWT-based secure session management.

---

## 6. 🚀 Future Roadmap

- **Phase 1**: Polish UI and complete basic automation (current).
- **Phase 2**: Full WhatsApp automation (no-code triggers).
- **Phase 3**: Tally & Busy direct sync (Pulse Sync).
- **Phase 4**: Legal notice generation and integration with legal recovery.

---

> [!IMPORTANT]
> **Technical Note**: Ensure that all frontend components use the centralized `services/` layer (`analytics.ts`, `invoices.ts`) instead of direct Supabase calls for better maintainability.

> [!TIP]
> Use the **Reminders Center** to view all pending high-priority actions across all modules.
