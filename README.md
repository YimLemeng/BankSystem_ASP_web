# Enterprise Digital Banking System - Frontend (React.js + Tailwind CSS)

Professional, modern Fintech Web Banking Application designed to integrate seamlessly with the **ASP.NET Core .NET 8 Banking System Web API**.

---

## 🌟 Key Features

1. **Enterprise Banking UX/UI**:
   - Modern Dark Fintech aesthetic inspired by Revolut, Stripe, and ABA Mobile Web.
   - Realistic EMV Chip and gradient cards for **USD** (Emerald/Jade) and **KHR** (Sapphire/Sky).
   - Eye icon to toggle balance visibility, instant copy account number, and live status badges.
2. **Dual Authentication Flow**:
   - **Phone Number + Password Login**
   - **Passwordless Phone Number + Cryptographic SMS OTP Login**
   - Instant Demo Credentials buttons (Admin, Teller, Customer).
   - Automatic JWT Access Token & Refresh Token rotation with Axios Interceptors.
3. **Core Banking Operations**:
   - **Fund Transfers**: Transfer between accounts or to another customer.
   - **2FA Transfer Protection**: Transfers of $\ge$ $1,000 USD or $\ge$ 4,000,000 KHR automatically prompt for a 6-digit SMS OTP authorization modal.
   - **Idempotency Protection**: Every transfer and deposit includes an automatic unique idempotency key to prevent accidental double charges.
   - **Cash In / Deposit & Cash Out / Withdrawal**: Fast, modal-driven cash transactions.
4. **Statements & History**:
   - Transaction list with search, category filtering, and pagination.
   - **Official Account Statement**: Date range selector, starting balance, total deposits, total debits, ending balance, and printable report view.
5. **Staff & Branch Operations (Admin & Teller)**:
   - Account freeze controls with reason, unfreeze, and close account.
   - Customer KYC onboarding and tier upgrade.
   - Live immutable Security Audit Trail with masked phone numbers (`+855****5680`) and IP addresses.

---

## 🚀 How to Run

### 1. Prerequisites
- Node.js 18+ (tested with Node.js v26)
- The Backend Web API running on `http://localhost:5107` (or `https://localhost:7195`)

### 2. Start Development Server
```bash
cd /Users/Lemeng/BBU/ASP.NET/Banking-frontend
npm install
npm run dev
```

Open your browser at: **`http://localhost:3000`**

*(All API requests to `/api` are automatically proxied to `http://localhost:5107` via Vite)*

---

## 👤 Pre-Seeded Demo Accounts

| Role | Phone Number | Password | Capabilities |
|---|---|---|---|
| **Admin** | `012345678` (or `+85512345678`) | `Admin@123!` | System Audit Trail, Account Freeze, KYC, Full Banking |
| **Teller** | `012345679` (or `+85512345679`) | `Teller@123!` | Customer KYC Onboarding, Account Moderation, Full Banking |
| **Customer** | `012345680` (or `+85512345680`) | `Customer@123!` | Personal USD & KHR Accounts, Transfers, Statements |
