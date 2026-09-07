# INFINITY CUSTOMIZATIONS
> **"Business Management & Smart Invoice System"**

**INFINITY CUSTOMIZATIONS** is a premium, production-ready full-stack web application purpose-built for customized products businesses. Built specifically for business partners who sell **Custom Printed T-Shirts**, **Photo Frames**, **Bouquets**, **Mugs**, **Caps**, **Albums**, **Polaroids**, **Calendars**, **Fridge Magnets**, **Customized Gifts**, and **Photo Restoration**.

It eliminates complex accounting bloat and focuses on the core financial engine of a customized merchandise business: **exact cost breakdown per order, transparent customer payments, automatic profit calculations, real-time dual-partner financial transparency, AI invoice assistance, and professional A4 invoice generation**.

---

## 🌟 Core Financial Engine & Exact Formulas

Every order in **INFINITY CUSTOMIZATIONS** strictly computes and tracks:

$$\text{Total Cost} = \text{Product Cost} + \text{Printing Cost} + \text{Delivery / Rapido Cost} + \text{Other Cost}$$

$$\text{Profit} = \text{Customer Total (Selling Price)} - \text{Total Cost}$$

$$\text{Profit Margin (\%)} = \left(\frac{\text{Profit}}{\text{Customer Total}}\right) \times 100$$

$$\text{Available Amount} = \text{Payment Received} - \text{Total Cost}$$

$$\text{Payment Pending} = \text{Customer Total} - \text{Payment Received}$$

> 💡 **The Available Amount** answers the single most critical day-to-day question for partners: *"After paying for the blank t-shirt/product, printing, and delivery, how much actual cash is left in our hands right now from this order?"*

---

## 👥 Dual-Partner Real-Time Collaboration

Both business partners access the exact same shared business database with dedicated individual logins:

| Partner | Full Name | Email | Password | Role | Share |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Partner 1** | **Jashwanth Reddy** | `jashwanth@infinitycustomizations.com` | `Password@123` | Owner / Lead Ops | 50% |
| **Partner 2** | **Rajshekar Reddy** | `rajshekar@infinitycustomizations.com` | `Password@123` | Partner / Creative Dir | 50% |

- **Zero Discrepancies**: When Partner 1 records an order or expense, Partner 2 instantly sees it in real time via live WebSockets.
- **Partner Attribution**: Every order, invoice, and payment displays a badge showing which partner created it (`Jashwanth Reddy` or `Rajshekar Reddy`).
- **Demo Switcher Bar**: An instant 1-click toggle in the top bar allows immediate switching between Partner 1 and Partner 2 without re-entering credentials.

---

## 👕 Dedicated T-Shirt Intelligence Dashboard (`/t-shirts`)

Because custom printed T-shirts are the core volume driver, the application provides a dedicated intelligence suite:
- **T-Shirt Volume & Profit**: Total shirts sold, gross revenue, net profit, and average profit per shirt.
- **Size Distribution Breakdown**: Visual bar charts and metrics for sizes **S, M, L, XL, and XXL**.
- **Color Distribution Breakdown**: Visual breakdown across Black, White, Navy Blue, Maroon, Charcoal Grey, Olive Green, etc.
- **Print Placement Tracking**: Front print, Back print, and Sleeve print tracking.
- **Top Performing Orders**: Highest margin and profit T-shirt orders.

---

## 🤖 AI Invoice Assistant (`/ai-invoice`)

Convert unstructured customer messages (WhatsApp, Instagram DM, phone notes) into complete structured orders in seconds:
1. **Natural Language Parser**: Paste text like *"Rohan wants 15 Black L T-shirts with Front and Back DTF print for tech club, selling at 450 each. Blank cost is 160 each, print cost is 80 each, Rapido delivery 120, packaging 50. Paid 3000 advance via UPI. Phone 9876543210"*.
2. **Deterministic Extraction**: Extracts customer contact, item specifications, unit pricing, cost breakdowns, and payment advance.
3. **Mandatory Review Gatekeeper**: Displays an interactive editable review card highlighting Total Cost, Projected Profit, and Profit Margin before anything is committed to the database.
4. **1-Click Generation**: On confirmation, generates the order, records the advance payment, and generates the A4 invoice simultaneously.
5. **Pre-Loaded Sample Prompts**: Fast testing chips for bulk corporate tees, wedding photo frames, birthday mugs, and college event batches.

---

## 🧾 Professional A4 Invoices & PDF Export (`/invoices/:id`)

- Clean, pixel-perfect A4 invoice template styled with **Infinity Royal Navy (`#082A5E`) and Gold (`#D4AF37`)**.
- Features business details, GSTIN, invoice number (`INV-2026-XXXX`), order link, itemized specifications (size, color, print type), payment summary, bank account transfer details, and authorized signature.
- Instant **Browser Print** and **PDF Download** using high-fidelity vector rendering.

---

## 🛠 Tech Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite** for ultra-fast bundling and development
- **Tailwind CSS** for modern, responsive dark/light UI design
- **Lucide React** for consistent icon architecture
- **Recharts** for interactive business financial data visualization
- **jsPDF** & **html2canvas** for client-side pixel-perfect A4 invoice PDF generation
- **Framer Motion** for polished modal transitions and notifications

### Backend
- **Node.js** & **Express 5** with TypeScript
- **WebSockets (`ws`)** for instantaneous multi-partner push notifications and live event dispatch
- **JWT & RBAC Middleware** with tenant-isolated database scoping (`req.businessId`)
- **Helmet & CORS** for enterprise HTTP security
- **Multer** for encrypted local document & receipt uploads with tenant isolation

### Database Layer
- **Dual-Mode Persistence Architecture**:
  - **Embedded SQLite via WebAssembly (`sql.js`)**: Pure WebAssembly SQLite engine that runs with zero native C++ build tools or node-gyp requirements on Windows, macOS, and Linux. Automatically exports and persists to disk (`server/database.sqlite`).
  - **PostgreSQL Ready**: Full schema and connection pooling support via `DATABASE_URL` for scalable production deployments.
  - **Docker Compose**: Pre-configured `docker-compose.yml` for containerized PostgreSQL.

---

## 📊 Modules & Capabilities

### 1. Executive Dashboard
- **7 Core Financial Cards**: Total Revenue, Total Expenses, Net Profit, Pending Payments, Outstanding Invoices, Cash Balance, Bank Balance.
- **Comparison Indicators**: Real-time month-over-month percentage changes.
- **Business Health Score (e.g. 77/100)**: Dynamic composite rating calculating profit margin health, receivable aging, and expense ratios.
- **Smart Data Alerts**: Automated warnings for overdue invoices, high receivable aging, or low cash reserves.
- **Recharts Interactive Suite**:
  - Revenue vs Expenses trend
  - Monthly Net Profit bars
  - Expense breakdown by category (Pie chart)
  - Payment method distribution
- **Live Activity Ticker**: Instant real-time view of recent actions by both partners.

### 2. Invoicing & Billing
- Create invoices with auto-numbering (`INV-2026-XXXX`).
- Multi-item line calculator with itemized rates, quantities, discounts, and GST/Tax rates.
- Status workflows: `Draft`, `Sent`, `Partial`, `Paid`, `Overdue`, `Void`.
- **A4 PDF Engine**: Instant preview, print, and download of professional GST-ready A4 invoices with business logo, partner details, and terms.
- **Controlled Cancellation**: Voiding invoices requires an explicit reason and automatically rolls back ledger balances.

### 3. Sales & Point of Sale
- Quick sale recording with automatic customer ledger updates.
- Multiple payment methods: Cash, Bank Transfer, UPI, Credit Card, Cheque.
- Immediate double-entry ledger posting.

### 4. Customers Management
- 360-degree customer ledger profiles.
- Contact info, billing address, and GSTIN tracking.
- Historical purchase records, outstanding balances, and one-click invoice creation.

### 5. Expense Tracking & Receipt Vault
- Itemized business expenses categorized by Operating, Marketing, Equipment, Travel, Software, and Freelancers.
- Payment method allocation (Cash vs Bank).
- Proof-of-purchase receipt attachment with isolated document storage.
- Immutable void/edit protection requiring mandatory justifications.

### 6. Cash & Bank Accounts
- Real-time derived balance tracking for:
  - **Main Cash Drawer**
  - **Primary Current Bank Account (HDFC / SBI)**
  - **Digital UPI Business Account**
- Record deposits, withdrawals, and account-to-account transfers with double-entry integrity.

### 7. Profit & Loss Statement (P&L)
- Comprehensive financial breakdown:
  - **Operating Revenue** (Invoices & Direct Sales)
  - **Cost of Operations & Goods**
  - **Gross Profit & Margin %**
  - **Itemized Expenses by Category**
  - **Net Operating Profit & Margin %**
- Filtering: Daily, Weekly, Monthly, Quarterly, Yearly, and Custom ranges.
- **One-Click CSV Export** and clean printer-friendly layout.

### 8. Master Chronological Ledger
- Comprehensive journal of every debit, credit, invoice, and payment.
- Searchable and filterable by Date, Partner, Category, and Payment Method.
- Complete audit-ready CSV export.

### 9. Partner Transparency & Audit Trail
- Dedicated transparency view showing every historical action taken by both partners.
- Color-coded action badges (`CREATE`, `UPDATE`, `VOID`, `PAYMENT`).
- Side-by-side JSON diffs highlighting exact field modifications.
- Reason stamps showing why an action was performed.

### 10. Documents & Receipt Storage
- Multi-category vault for business contracts, receipts, GST tax filings, and bank statements.
- Tenant-isolated storage prevents cross-business data leakage.

### 11. Global Search & Dark/Light Mode
- Keyboard shortcut `Ctrl+K` or `Cmd+K` launches unified global search across Invoices, Customers, Expenses, and Products.
- Full dark mode and light mode support with local storage persistence.
- Responsive mobile layout with bottom navigation and a floating quick-action (+) button.

---

## 🏃 Quick Start Guide

### Prerequisites
- **Node.js**: Version 18.0.0 or later
- **npm**: Version 9.0.0 or later

### Installation & Run

1. **Clone the repository and install root dependencies**:
   ```bash
   git clone https://github.com/your-org/partnerledger.git
   cd partnerledger
   npm install
   ```

2. **Run the application**:

   **Development Mode (Concurrent frontend & backend)**:
   ```bash
   npm run dev
   ```
   - Backend runs on `http://localhost:4000` (API & WebSockets)
   - Frontend runs on `http://localhost:5173` (Vite dev server with hot module replacement)

   **Production Build & Run**:
   ```bash
   npm run build
   npm start
   ```
   - The compiled Express server at `http://localhost:4000` serves both the REST API and the compiled React frontend client.

3. **Seed or Reset Demo Data**:
   ```bash
   npm run seed
   ```

---

## 🐳 Docker Deployment

To launch PARTNERLEDGER with PostgreSQL using Docker Compose:

```bash
docker compose up -d --build
```

The service will start:
- **PostgreSQL**: `localhost:5432`
- **PARTNERLEDGER Application**: `http://localhost:4000`

---

## 📂 Project Structure

```
infinitybilling/
├── package.json                 # Monorepo scripts & configurations
├── docker-compose.yml           # PostgreSQL container definition
├── README.md                    # Project documentation
├── server/                      # Backend API & WebSocket Server
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql       # 19 normalized SQL tables
│   │   │   ├── index.ts         # WASM SQLite & PostgreSQL database layer
│   │   │   └── seed.ts          # Seed data generator for "Infinity Editing"
│   │   ├── middleware/
│   │   │   └── auth.ts          # JWT, tenant validation & RBAC
│   │   ├── services/
│   │   │   ├── auditService.ts  # Append-only audit logger
│   │   │   ├── transactionService.ts # Double-entry ledger & balance updates
│   │   │   ├── notificationService.ts # Notifications engine
│   │   │   └── websocketService.ts # WebSocket broadcast hub
│   │   ├── routes/              # Express REST endpoints
│   │   │   ├── auth.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── customers.ts
│   │   │   ├── invoices.ts
│   │   │   ├── sales.ts
│   │   │   ├── expenses.ts
│   │   │   ├── payments.ts
│   │   │   ├── cashBank.ts
│   │   │   ├── profitLoss.ts
│   │   │   ├── ledger.ts
│   │   │   ├── activity.ts
│   │   │   ├── documents.ts
│   │   │   ├── reports.ts
│   │   │   ├── search.ts
│   │   │   └── settings.ts
│   │   └── index.ts             # Express 5 server initialization
│   ├── uploads/                 # Tenant-isolated file storage
│   └── database.sqlite          # Persistent SQLite database file
└── client/                      # Frontend Application (React 19 + Vite)
    ├── src/
    │   ├── api/                 # Axios clients and typed query hooks
    │   ├── components/
    │   │   ├── layout/          # Topbar, Sidebar, Demo Switcher, Mobile FAB
    │   │   ├── invoices/        # A4 PDF invoice generator and viewer
    │   │   ├── modals/          # Modals for Invoices, Expenses, Payments, Sales, Voids
    │   │   └── common/          # Badges, Cards, Alert banners, Tooltips
    │   ├── context/             # AuthContext, ThemeContext, RealtimeContext
    │   ├── pages/               # All core application views
    │   │   ├── auth/            # Login, Register, Forgot Password
    │   │   ├── dashboard/       # Financial cards, Health score, Recharts
    │   │   ├── invoices/        # Invoices listing & detail views
    │   │   ├── customers/       # Customer profiles & history
    │   │   ├── expenses/        # Itemized expenses & receipt preview
    │   │   ├── sales/           # Sales & quick transactions
    │   │   ├── payments/        # Partial & full payment processing
    │   │   ├── cash-bank/       # Bank & cash balances & transfers
    │   │   ├── profit-loss/     # Multi-period P&L statement
    │   │   ├── ledger/          # Chronological master journal
    │   │   ├── activity/        # Partner audit trail with change diffs
    │   │   ├── documents/       # Business receipt vault
    │   │   ├── reports/         # Executive reporting suite
    │   │   └── settings/        # Business profiles & partner roles
    │   └── types/               # TypeScript data definitions
    └── vite.config.ts           # Vite development server & reverse proxy
```

---

## 🔒 Security & Privacy

- **Tenant Isolation**: Every database query strictly filters by `business_id`. Users from one business workspace can never query or mutate records of another business.
- **Password Security**: Passwords hashed with standard salts.
- **Audit Immutability**: There is no HTTP `DELETE` endpoint for financial records. Records can only transition into a `VOID` or `REVERSED` status with mandatory justifications.
- **Secure File Storage**: File uploads are restricted by MIME types and organized in tenant-isolated directories.

---

## 📄 License

This software is proprietary and confidential. Built for business partnerships requiring total financial transparency.
