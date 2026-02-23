# TIPRI Transfert - Specification Document

## 1. Project Overview

**Project Name**: TIPRI Transfert
**Type**: Web Application (SPA with Express backend)
**Core Functionality**: A transaction management system for controlling money transfers between different places with multi-currency support, role-based access, and comprehensive reporting.
**Target Users**: Business administrators and cashiers managing money transfer operations

---

## 2. Technical Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL
- **Authentication**: JWT-based
- **PDF Export**: jsPDF + jspdf-autotable
- **Internationalization**: i18next (English, French)
- **Styling**: Custom CSS with CSS Variables

---

## 3. UI/UX Specification

### Layout Structure

**App Shell**:
- Sidebar navigation (collapsible on mobile)
- Top header with user info, language selector, logout
- Main content area

**Responsive Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Visual Design

**Color Palette**:
- Primary: #1a365d (Deep Navy Blue)
- Secondary: #2d3748 (Dark Gray)
- Accent: #38a169 (Success Green)
- Warning: #d69e2e (Amber)
- Danger: #e53e3e (Red)
- Background: #f7fafc (Light Gray)
- Card Background: #ffffff
- Text Primary: #1a202c
- Text Secondary: #718096

**Typography**:
- Font Family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
- Headings: 700 weight
- Body: 400 weight
- H1: 2rem, H2: 1.5rem, H3: 1.25rem

**Spacing System**:
- Base unit: 0.25rem (4px)
- Common spacings: 0.5rem, 1rem, 1.5rem, 2rem

**Visual Effects**:
- Card shadows: 0 1px 3px rgba(0,0,0,0.12)
- Hover transitions: 0.2s ease
- Border radius: 0.5rem (cards), 0.25rem (buttons/inputs)

### Components

**Navigation Sidebar**:
- Logo at top
- Navigation items with icons
- Active state: background highlight
- Collapse button for mobile

**Data Tables**:
- Sortable columns
- Pagination
- Row hover highlight
- Action buttons per row

**Forms**:
- Input fields with labels
- Validation error messages
- Select dropdowns
- Submit/Cancel buttons

**Cards**:
- Summary cards with icon, value, label
- Border-left accent color coding

**Modals**:
- Centered overlay
- Close button
- Action buttons

**Status Badges**:
- Pending: Yellow/Amber
- Paid: Green
- Canceled: Red

---

## 4. Database Schema

### Users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'cashier')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Accounts
```sql
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  detail TEXT,
  currency VARCHAR(10) CHECK (currency IN ('USD', 'HTG')) NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Account Access (which cashier can access which account)
```sql
CREATE TABLE account_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT true,
  can_transact BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, account_id)
);
```

### Transactions
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(200) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_amount DECIMAL(15,2) NOT NULL,
  payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'canceled')) DEFAULT 'pending',
  transaction_amount DECIMAL(15,2) NOT NULL,
  transaction_method VARCHAR(50) NOT NULL,
  transaction_details TEXT,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  transaction_status VARCHAR(20) CHECK (transaction_status IN ('pending', 'paid', 'canceled')) DEFAULT 'pending',
  is_credit BOOLEAN DEFAULT false,
  credit_due_date DATE,
  credit_paid BOOLEAN DEFAULT false,
  sender_account_id INTEGER REFERENCES accounts(id),
  receiver_account_id INTEGER REFERENCES accounts(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Account Transactions History
```sql
CREATE TABLE account_transactions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  transaction_id INTEGER REFERENCES transactions(id),
  type VARCHAR(20) CHECK (type IN ('debit', 'credit')) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Settings
```sql
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Credit Notifications
```sql
CREATE TABLE credit_notifications (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  days_overdue INTEGER NOT NULL,
  notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Functionality Specification

### Authentication
- Login with username/password
- JWT token storage in localStorage
- Auto-redirect based on role
- Session timeout handling

### Admin Features

**User Management**:
- Create cashier accounts
- Edit cashier details
- Deactivate cashier accounts

**Account Management**:
- Create accounts (type, detail, currency)
- View all accounts with balances
- Assign/revoke cashier access to accounts

**Transaction Management**:
- View all transactions (global)
- Filter by date, status, currency
- View transaction details
- Cancel transactions

**Reports**:
- Total money received (by currency, date range)
- Total money transferred (by currency, date range)
- Total unpaid credit (by currency)
- Total profit (tax collected)
- PDF export for all reports

### Cashier Features

**Transaction Operations**:
- Create new transactions (client name, payment details, amounts)
- Confirm payments
- Execute transactions after payment confirmation
- View assigned account transactions

**Account Access**:
- See only accounts they have access to
- View transaction history for accessible accounts

### Transaction Flow
1. Cashier creates transaction with client info
2. Payment status: pending → paid (after confirmation)
3. Transaction status: pending → paid (after execution)
4. Account balances updated accordingly
5. Credit transactions track due dates

### Credit Transactions
- Marked with is_credit flag
- Set credit_due_date
- After X days (from settings), generate notification
- Track payment status

### Settings
- Credit notification days (default: 7)
- Business name for reports
- Tax rate default

---

## 6. API Endpoints

### Auth
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Users (Admin)
- GET /api/users
- POST /api/users
- GET /api/users/:id
- PUT /api/users/:id
- DELETE /api/users/:id

### Accounts
- GET /api/accounts
- POST /api/accounts
- GET /api/accounts/:id
- PUT /api/accounts/:id
- DELETE /api/accounts/:id
- GET /api/accounts/:id/transactions

### Account Access
- GET /api/account-access
- POST /api/account-access
- DELETE /api/account-access/:id

### Transactions
- GET /api/transactions
- POST /api/transactions
- GET /api/transactions/:id
- PUT /api/transactions/:id
- PUT /api/transactions/:id/confirm-payment
- PUT /api/transactions/:id/execute

### Reports
- GET /api/reports/received?startDate=&endDate=&currency=
- GET /api/reports/transferred?startDate=&endDate=&currency=
- GET /api/reports/credit?currency=
- GET /api/reports/profit?startDate=&endDate=

### Settings
- GET /api/settings
- PUT /api/settings

### Dashboard
- GET /api/dashboard/summary

---

## 7. Internationalization

### Supported Languages
- English (en) - Default
- French (fr)

### Translated Content
- Navigation labels
- Form labels and placeholders
- Status messages
- Report titles
- Button labels

---

## 8. Acceptance Criteria

### Authentication
- [ ] Users can login with valid credentials
- [ ] Invalid credentials show error message
- [ ] Role-based redirect after login
- [ ] Logout clears session

### Admin Functions
- [ ] Can create/edit/delete cashier accounts
- [ ] Can create accounts with different currencies
- [ ] Can assign account access to cashiers
- [ ] Can view all transactions
- [ ] Can generate and export PDF reports

### Cashier Functions
- [ ] Can create new transactions
- [ ] Can confirm payments
- [ ] Can execute transactions
- [ ] Can only see assigned accounts

### Transactions
- [ ] Payment status transitions work correctly
- [ ] Transaction status transitions work correctly
- [ ] Account balances update on transaction execution
- [ ] Transaction history is recorded

### Reports
- [ ] Date range filters work
- [ ] Currency filters work
- [ ] PDF export generates valid document

### UI/UX
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Language switching works
- [ ] Loading states shown
- [ ] Error messages displayed properly

---

## 9. Project Structure

```
tipri_transfert/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── express/
│   ├── index.js
│   ├── db.js
│   └── routes/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── api/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── i18n/
│   └── types/
└── SPEC.md
```
