# Enterprise Digital Banking System - Frontend

[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Lucide Icons](https://img.shields.io/badge/Icons-Lucide_React-F05032)](https://lucide.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

ផ្ទាំងគ្រប់គ្រងប្រព័ន្ធធនាគារឌីជីថល (Enterprise Modern Fintech Web Application) រចនាឡើងយ៉ាងប្រណិតតាមបែប Dark Mode បំផុសគំនិតដោយកម្មវិធីធនាគារល្បីៗដូចជា Revolut, Stripe, និង ABA Mobile Web ដើម្បីតភ្ជាប់ដោយរលូនជាមួយ **ASP.NET Core .NET 8 Banking System Web API**។

---

## 🌟 មុខងារចម្បងៗ (Key Features)

1. **Fintech UI/UX & Design System**:
   - ប្រព័ន្ធពណ៌ Dark Mode ទំនើប ជាមួយ Jade/Emerald Accent
   - កាតធនាគារស្អាតប្រណិតបែប Realistic EMV Chip សម្រាប់ **USD ($)** និង **KHR (៛)**
   - ប៊ូតុងបិទ/បើកមើលសមតុល្យទឹកប្រាក់ (Eye icon) និងប៊ូតុង Copy លេខគណនីរហ័ស
   - Global Loading System ជាមួយ Animation និង Priority Lockout ការពារការចុចស្ទួន
   - Centered Modals ប្រើប្រាស់ `createPortal` ធានាការបង្ហាញចំកណ្តាលអេក្រង់យ៉ាងស្រស់ស្អាត
2. **Two-Factor Authentication (TOTP 2FA)**:
   - ចូលប្រើប្រាស់តាមរយៈ **Username + Password**
   - ស្កេន **QR Code** ឬចម្លង **Secret Key** ចូល Google Authenticator / Microsoft Authenticator
   - បញ្ចូលលេខកូដ 6 ខ្ទង់ដើម្បីទទួល Token ដោយសុវត្ថិភាព
   - រក្សាទុក និង Rotate JWT Access Token ដោយស្វ័យប្រវត្តិតាមរយៈ Axios Interceptors
3. **Core Banking Operations (ប្រតិបត្តិការធនាគារ)**:
   - **Transfer (ផ្ទេរប្រាក់)**៖ ផ្ទេរប្រាក់រវាងគណនី ឬទៅកាន់អតិថិជនផ្សេងទៀត ជាមួយការការពារ Idempotency Key
   - **Deposit & Withdrawal (ដាក់ និងដកប្រាក់)**៖ ដំណើរការតាមរយៈ Pop-up Modal រហ័សទាន់ចិត្ត
   - **Account Controls**៖ បើកគណនីថ្មី, បង្កក (Freeze), ដោះបង្កក (Unfreeze), និងបិទគណនី
4. **Statements & Audit Logs**:
   - របាយការណ៍គណនីផ្លូវការ (Official Statement)៖ រើសតាមកាលបរិច្ឆេទ, បង្ហាញសមតុល្យដើមគ្រា, ចុងគ្រា, និងប៊ូតុង Print/Export
   - ប្រវត្តិប្រតិបត្តិការលម្អិត អាចស្វែងរក (Search) និង Filter តាមប្រភេទប្រតិបត្តិការ
   - ពិនិត្យ Audit Logs ប្រព័ន្ធដែលមិនអាចកែប្រែបាន (Immutable Audit Trail)
5. **Staff & Customer Directory**:
   - **Customer Directory**៖ ពិនិត្យបញ្ជីអតិថិជន, ព័ត៌មាន KYC, និងចុះឈ្មោះអតិថិជនថ្មី
   - **Users Management (Admin Only)**៖ ពិនិត្យបញ្ជីឈ្មោះបុគ្គលិក, Teller, និង Admin
6. **Bilingual Support (គាំទ្រពីរភាសា)**:
   - អាចប្តូររវាង **ភាសាខ្មែរ (Khmer)** និង **English** ភ្លាមៗដោយមិនបាច់ Reload ទំព័រ

---

## 📁 រចនាសម្ព័ន្ធ Directories (Project Structure)

```
Banking-frontend/
├── public/                 # Static Assets
├── src/
│   ├── components/         # Reusable UI (Sidebar, Navbar, Card, Modal, Dropdowns)
│   ├── context/            # AuthContext, LanguageContext, LoadingContext
│   ├── i18n/               # Khmer & English Translations
│   ├── pages/              # Dashboard, Accounts, Transactions, Customers, Statements, Users, Profile, Login
│   ├── services/           # Axios API Services (auth, accounts, transactions, customers, users, audit)
│   ├── App.jsx             # Routes & Authentication Guards
│   ├── index.css           # Tailwind CSS Config & Custom Utilities
│   └── main.jsx            # Application Entry Point
├── package.json            # Dependencies & Scripts
├── tailwind.config.js      # Tailwind Styling Theme
└── vite.config.js          # Vite Server Configuration & API Proxy (/api -> http://localhost:5107)
```

---

## 🛠️ របៀបតម្លើង និងដំណើរការ (Run & Setup)

### 1. តម្រូវការបឋម (Prerequisites)
- [Node.js](https://nodejs.org/) (Version 18.0 ឬខ្ពស់ជាងនេះ)
- Backend API កំពុងដំណើរការនៅ `http://localhost:5107`

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

បើក Browser របស់អ្នកទៅកាន់ ៖ **`http://localhost:3000`**

*(រាល់ Request ទៅកាន់ `/api/...` ត្រូវបាន Forward ទៅកាន់ backend `http://localhost:5107` ដោយស្វ័យប្រវត្តិតាមរយៈ Vite Proxy)*

### 4. Build សម្រាប់ Production
```bash
npm run build
```

---

## 👤 គណនីគំរូសម្រាប់ Login (Demo Accounts)

| Username | Password | Role | ការអនុញ្ញាត (Permissions) |
|---|---|---|---|
| **admin** | `Admin@123!` | System Administrator | គ្រប់គ្រងបុគ្គលិក, មើល Audit Logs, Freeze Account, Full Banking Access |
| **teller** | `Teller@123!` | Branch Teller | Onboard Customer, បើកគណនី, ដាក់/ដក/ផ្ទេរប្រាក់, ពិនិត្យ KYC |

---

## 🔗 Repository Links

- **Backend Repository (.NET 8 Web API)**: [Banking_System_ASP](https://github.com/YimLemeng/Banking_System_ASP.git)
- **Frontend Repository (React + Tailwind)**: [BankSystem_ASP_web](https://github.com/YimLemeng/BankSystem_ASP_web.git)
