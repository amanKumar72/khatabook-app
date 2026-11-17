# Product Requirements Document (PRD): Khatabook

**Document Version:** 1.0  
**Application Analyzed:** `Khatabook.apk`  
**Package Name:** `com.vaibhavkalpe.android.khatabook`  
**Application Version:** `9.5.3` (Version Code: `900503`)  
**Target SDK:** `35` (Android 15) | **Min SDK:** `22` (Android 5.1 Lollipop)  
**Binary SHA-256:** `5d75b4979847eb8e58a23fe59b48280cc6b9555e592acb999ca3e894af86a4ad`  
**Analysis Engine:** Reverse-Engineer-Anything (REA) Framework + Headless Static/DEX/Resource Extraction  

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
Khatabook is India’s leading MSME merchant enablement platform. It replaces the traditional physical paper ledger (*Bahi Khata*) with an offline-first, cloud-synced digital financial ecosystem. Beyond bookkeeping, Khatabook provides micro-merchants with integrated digital payments, invoicing and inventory (BillBook), staff payroll (Pagarkhata), merchant micro-lending, insurance, and growth utilities.

### 1.2 Target Audience & Personas
1. **Traditional Retail Store Owners (Kirana, General Stores, Medical, Hardware):** Require fast credit/debit tracking, customer debt collection, and WhatsApp payment reminders.
2. **Wholesalers & Distributors:** Require multi-book accounting, credit limit controls, bulk payment collection, and GST-compliant invoicing.
3. **Small Service Businesses & Freelancers:** Require hourly/fixed service invoicing, digital business cards, and payment links.
4. **Multi-Store Operators:** Require multi-book support, multi-user role-based access control (owners vs. billing staff), and desktop web synchronization.

### 1.3 Key Value Metrics
- **Collection Acceleration:** Reduces average credit recovery time by up to 50% via automated WhatsApp, SMS, and AI Voice Call reminders.
- **Error Reduction:** Eliminates calculation errors and disputed paper entries via two-way digital synchronization (`side_entry`).
- **Data Durability:** 100% cloud backup ensuring zero data loss upon device damage or theft.
- **Financial Inclusion:** Leverages merchant transaction throughput for collateral-free digital micro-loans (up to ₹5,00,000).

---

## 2. Technical Architecture & System Design

### 2.1 Client Application Architecture
- **Pattern:** Modern Single-Activity Architecture (`MainActivity`) leveraging Jetpack Navigation and MVI (`com.khatabook.framework.mvistatemachine`).
- **UI Toolkit:** Jetpack Compose + XML ViewBinding / DataBinding with Material Design 3 (`@style/NavigationScreenTheme`).
- **Offline-First Data Pipeline:** SQLite Room Database (`AppDatabase`, `KhataProvider`) featuring multi-process invalidation (`MultiInstanceInvalidationService`) and priority-based sync workers (`androidx.work.WorkManager`).
- **Background Synchronization:**
  - `FirstTimeSyncService` (`foregroundServiceType="dataSync"`): Accelerates initial book download on login.
  - `AttachmentRecoveryService` (`foregroundServiceType="dataSync"`): Resilient asynchronous upload/download of bill photos.
  - `SyncManager`: Exponential backoff queue for delta sync (`bill_change_log`, `sync_request`).

### 2.2 Third-Party & Ecosystem Integrations
- **Payments:** Razorpay PG SDK (`rzp_live_vSASWWdzBXQI2N`, `DeeplinkActivity`), NPCI UPI intent router.
- **Communication & Marketing:** CleverTap Push & In-App messaging, Firebase Cloud Messaging (`PnService`), Plotline Journeys (`PlotlineActivity`).
- **SMS Transaction Parsing:** Kyte SDK (`com.khatabook.kytesdk.newsms`) for parsing incoming bank transactional SMS.
- **Identity & Authentication:** Truecaller 1-Tap Verification SDK (`ClientId: frzbxcj-ijctzbfvlyyieycaxervu_k5ncx0rdu_s-m`), Firebase Phone Auth + Recaptcha verification.
- **Hardware Integrations:** ESC/POS Bluetooth Thermal Printers (`android.permission.BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`).

---

## 3. Core Functional Modules & Specifications

```
+---------------------------------------------------------------------------------------------------+
|                                          KHATABOOK ECOSYSTEM                                      |
+-------------------+--------------------+--------------------+--------------------+----------------+
|   1. Core Khata   |  2. BillBook & Inv |   3. Payments & QR |   4. Staff & Payroll|  5. FinServices|
| - Customer Ledger | - GST Invoicing    | - Dynamic UPI QR   | - Attendance Log   | - Micro Loans  |
| - Supplier Ledger | - 83 Trade Units   | - Payment Links    | - Salary Calc      | - Digital KYC  |
| - 2-Way Sync      | - Barcode Scanner  | - Audio Soundbox   | - Salary Slips     | - Credit Score |
| - AI Call Remind  | - Bluetooth Print  | - T+0 Settlement   | - Role-based ACL   | - KB Invest    |
+-------------------+--------------------+--------------------+--------------------+----------------+
|                        Cross-Cutting Platform Capabilities: Offline Sync,                         |
|         Multi-Book, KB Plus Subscriptions, App Lock (Biometrics), 12+ Indic Languages             |
+---------------------------------------------------------------------------------------------------+
```

---

### Module 1: Multi-Book Tenancy, Authentication & Onboarding

#### 1.1 Authentication & Profile Creation
- **Primary Auth:** Phone Number + SMS OTP (`/v1/auth/request-otp`, `/v1/auth/login?version=v3`).
- **Instant Auth:** Truecaller 1-tap verification fallback.
- **Multi-Lingual Localization:** Supports 12+ Indian languages (Hindi, Hinglish, English, Gujarati, Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi, Odia).
- **Business Profile:**
  - Business Name, Contact Number, Physical Address with Geo-Location (`LocationFetchMode`).
  - Business Categorization: Comprehensive taxonomy supporting 1,188 distinct MSME business types (e.g., *Kirana, Agro Services, Auto Parts, Aataa Chakki, Textile, Pharmacy, Jewellery*).
  - GSTIN registration and PAN association.

#### 1.2 Multi-Book Architecture
- Merchants can instantiate and seamlessly toggle between multiple independent books (`books` table):
  - Separate business books (e.g., "Main Retail Shop", "Branch 2 Wholesaler").
  - Personal book (isolated from business accounting).
- Each book maintains isolated customer bases, transactions, staff configurations, and reports.

---

### Module 2: Core Khata (Customer & Supplier Ledger)

#### 2.1 Ledger Management
- **Party Types:** Bifurcated customer (`PartyType.CUSTOMER`) and supplier (`PartyType.SUPPLIER`) registries.
- **Contact Synchronization:** Native phonebook integration (`READ_CONTACTS`) allowing single-tap customer addition.
- **Transaction Types:**
  - **"You Gave" (Debit / Lal Khata):** Credit extended to customer or payment made to supplier.
  - **"You Got" (Credit / Hara Khata):** Payment collected from customer or goods purchased from supplier on credit.
- **Transaction Fields:**
  - Amount (INR, with 2 decimal precision).
  - Transaction Date & Time (customizable historical entry support).
  - Notes / Description.
  - Media Attachments: Bills, receipts, signatures via S3 pre-signed upload (`/v1/uploads/gen-pre-signed-url`).
  - Repayment Due Date: Sets triggers for automated notifications.

#### 2.2 Advanced Ledger Features
- **Two-Way Synchronization (`side_entry`):**
  - If Customer B also uses Khatabook, entries logged by Merchant A reflect as counter-entries on Customer B's app in real-time upon verification.
- **Soft-Delete & Recycle Bin (`RECYCLE_BIN`, `/v1/recycle-bin/deletion-allowed`):**
  - Prevents accidental deletion; entries are moved to a trash locker for 30 days before irreversible purging.
- **Customer Archive / Hide:**
  - Settled or inactive customers/suppliers can be archived (`HIDE_CUSTOMERS`, `HIDE_SUPPLIERS`) without skewing active receivables.
- **Credit Limits:** Configurable maximum credit ceiling with alert triggers upon over-extension.

---

### Module 3: Automated Payment Reminders & Debt Recovery

#### 3.1 Multi-Channel Reminder Engine
1. **WhatsApp Reminders:** Generates branded reminder message containing transaction breakdown, balance statement, and instant UPI payment link.
2. **SMS Reminders:** Direct carrier SMS notifications with shortlinks (`khatabook.com/t/...`).
3. **AI Voice Call Reminders (`CALL_REMINDER`, `ai_call_education_subtitle`):**
   - Automated interactive voice response (IVR) phone calls placed to debtors speaking the customer’s regional dialect, prompting payment.
4. **Bulk Reminders (`BULK_REMINDER`, `BULK_SMS_REMINDER`):**
   - Single-tap automated blast sent to all debtors with overdue balances past specified due dates.

#### 3.2 Reminder History Ledger (`reminder_history` table)
- Tracks attempt timestamp, delivery medium (SMS/WhatsApp/IVR), delivery status, and subsequent customer interaction/click rate.

---

### Module 4: Digital Payments, Dynamic QR & Collections

#### 4.1 Payment Acceptance
- **Personalized Static & Dynamic UPI QR:**
  - Auto-generated QR code linked to merchant’s verified bank account (`res/menu/menu_payment_main.xml`).
  - Supports dynamic payment QR with embedded invoice amounts.
- **Payment Links:** Generated on the fly and dispatched via WhatsApp/SMS (`assets/payment_link.json`).
- **Payment Methods:** Full UPI rails (Google Pay, PhonePe, Paytm, BHIM), Net Banking, Debit/Credit Cards.

#### 4.2 In-App Soundbox & Voice Confirmation
- Built-in audio playback engine (`assets/audio_playback_animation.json`) providing instant regional voice alerts on successful transaction receipt (e.g., *"Khatabook par ₹500 prapt hue"*).

#### 4.3 Settlements & Passbook (`settlement` table)
- **Settlement Cycles:** Standard T+1 and instant T+0 settlement options.
- **Bank Account Management:** Multiple bank account linkage with primary account designation and penny-drop verification.
- **Passbook Statement:** Real-time ledger of gross collections, MDR/processing charges, and net bank deposits.

---

### Module 5: BillBook, GST Invoicing & Inventory Management

#### 5.1 Invoicing & Billing Engine
- **Document Types:** Tax Invoices (GST), Non-GST Bills, Estimates / Quotations, Purchase Orders, and Credit Notes.
- **Customizable Bill Numbering:** Configurable prefixes, financial year formats, and auto-incrementing serials.
- **GST Tax Engine (`assets/gst_slabs.json`):**
  - Native tax engine with 11 standard slabs: Exempted, 0%, 0.1%, 0.25%, 3%, 5%, 6%, 7.5%, 12%, 18%, 28%.
  - Automatic split into CGST, SGST, IGST, and UTGST based on intra-state vs. inter-state transaction rules.
- **Digital Seal & Signature (`BUSINESS_STAMP`, `assets/business_seal/`):**
  - Digital stamp overlay onto generated PDF bills with customizable business seal.

#### 5.2 Inventory & Stock Management (`assets/inventory_unit.json`)
- **Product & Service Catalog:** Bifurcated item master for goods vs. billable services (`INVENTORY_MANAGEMENT_ADD_SERVICE`).
- **Comprehensive Unit Registry:** 83 standard trade units (e.g., PCS, KGS, GMS, BORA, PETI, STRIP, DOZEN, CARTON, METRIC TON, BUNDLE) with secondary unit conversion multipliers.
- **Stock Tracking:** Real-time inventory deduction upon invoice generation, purchase stock addition, and low-stock alerts.
- **Barcode Scanner:** Camera-based barcode scanner (`CAMERA` permission) for high-speed counter checkouts.

#### 5.3 Hardware Integration: Bluetooth Thermal Printing
- Integrated ESC/POS printer driver (`BillsInvoicePrinterConnectionErrorDialogRetryClick`, Bluetooth permissions).
- Supports 2-inch and 3-inch wireless thermal receipt printers for printing customer receipts on spot.

---

### Module 6: Cashbook (Daily Gala & Expense Register)

#### 6.1 Galla / Petty Cash Tracking
- Replaces physical cash drawer registers (`cash_book_help_2: "Cash in hand : Current cash balance in galla/drawer"`).
- Single-tap "Cash In" and "Cash Out" logging.
- Auto-calculated real-time **Cash in Hand** balance.

#### 6.2 Expense Categorization (`bill_expense_category` table)
- Structured expense tagging: Rent, Utilities, Salaries, Tea/Snacks, Travel, Inventory Purchase, Maintenance.
- Cash vs. Bank payment mode tracking.
- Daily/Monthly cashflow visual breakdowns.

---

### Module 7: Staff Management & Payroll (Pagarkhata Integration)

#### 7.1 Staff Directory & Permissions (`staffs` table)
- Staff profiles: Name, Phone, Designation, ID Proof, Joining Date.
- **Role-Based Access Control (RBAC):**
  - **Owner:** Unrestricted access across all books, financial reports, and settings.
  - **Admin / Partner:** Can manage ledgers and billing across designated books.
  - **Billing Operator / Staff:** Restricted access to generate bills and record payments without seeing total net profit or supplier margins.
  - Constraints: Up to 10 staff members per business; maximum 2 business books enabled for staff sharing (`ac_max_staff_toast`, `ac_max_staff_book_toast`).

#### 7.2 Attendance & Payroll Automation
- Daily Attendance Register: Present, Absent, Half-Day, Paid Leave, Overtime (hours).
- Salary Computation Engines:
  - Monthly fixed salary.
  - Daily wage rate.
  - Hourly wage rate.
  - Per-piece production wage rate.
- Automated deductions: Advance salary repayments, unapproved absences.
- Salary slip PDF generation and WhatsApp delivery.

---

### Module 8: Financial Services (Merchant Lending & Investments)

#### 8.1 Digital Merchant Micro-Loans (`KbLoanLoanActivity`, `assets/5LakhLoanTextAnimation.json`)
- **Loan Capacity:** Unsecured revolving credit lines up to ₹5,00,000.
- **Underwriting Inputs:** Historical bookkeeping throughput, payment collection volume, bank statement parsing, and CIBIL credit score analysis (`assets/credit_score_loading.json`).
- **100% Paperless Digital KYC (`KycMainActivity`):**
  - Aadhaar verification via UIDAI OTP.
  - PAN verification with instant NSDL API check.
  - Bank account penny-drop verification.
- **Disbursement & Repayment:**
  - Instant disbursement directly to verified bank account.
  - Automated daily/weekly/monthly repayment deduction from digital QR settlements.

#### 8.2 KB Invest (`KbInvestActivity`, `https://invest.khatabook.com`)
- **Digital Gold:** 24K 99.9% pure digital gold accumulation starting from ₹1.
- **Merchant Mutual Funds & High-Yield Savings:** Low-risk liquid funds allowing merchants to park daily surplus cash.

#### 8.3 Shop Insurance (`SHOP_INSURANCE`, `shop-insure`)
- Tailored insurance policies covering retail stock theft, fire, and natural disasters.

---

### Module 9: Khatabook Plus (KB Plus / Pro Subscriptions)

#### 9.1 Monetization Model & Premium Tiers
- **Tier Structure:** Khatabook Free vs. Khatabook Plus / Pro (`KB_PLUS_LANDING`, `KB_PRO_HOME`).
- **Billing Cycles:** Monthly, Annual, and Multi-Year subscription packages.
- **Payment Collection:** In-app Razorpay recurring/one-time checkout.

#### 9.2 Premium Entitlements
1. **Unlimited AI Voice Call Reminders:** Uncapped automated IVR reminder calls.
2. **Desktop Web Access (`desktop.khatabook.com`):** Large-screen PC dashboard synchronized in real-time.
3. **Multi-Staff Expansion:** Unlocks additional staff seats beyond the default free tier.
4. **Custom Branded Invoices & Business Seals:** Removal of Khatabook watermark; placement of high-resolution merchant stamps.
5. **Priority Dedicated Account Support.**

---

### Module 10: Growth Loops & Merchant Utility Suite

#### 10.1 Gamification: KB Coins Wallet (`KB_COIN_WALLET_HOME`)
- Merchants earn Khatabook Coins by performing daily bookkeeping actions (e.g., adding 3 transactions, collecting ₹1,000 via QR, maintaining 7-day streak).
- Coins redeemable for cashback, discount vouchers, and subscription plan deductions.

#### 10.2 Digital Business Card Generator (`assets/Loading+Bizcard+N.json`)
- Professional digital visiting card with shop name, proprietor name, address, phone, WhatsApp CTA, and UPI QR code for social sharing.

#### 10.3 Refer and Earn (`REFER_AND_EARN`, `/v1/referral/refer-user`)
- Merchant incentive program offering instant bank credit / scratch cards when an invited merchant installs and records transactions.

---

### Module 11: Comprehensive Reporting & Data Export

#### 11.1 Report Formats & Engines
- Multi-format generation: High-resolution PDF (with customizable logo/header) and raw Excel (`.xlsx`) datasets.
- Date Range Filtering: Today, Yesterday, This Week, This Month, This Financial Year, Custom Calendar Range.

#### 11.2 Core Report Types
1. **Daybook Report:** Comprehensive timeline of all cash and credit events for any selected date.
2. **Customer / Supplier Statement:** Itemized ledger statement with running balance, ideal for dispute resolution.
3. **All Customers Summary:** Macro summary of total market credit outstanding vs. advance receipts.
4. **GST Tax Summary:** Sales vs. Purchase tax breakdown (CGST/SGST/IGST) prepared for GSTR-1 and GSTR-3B filing.
5. **Inventory Valuation Report:** Stock on hand, reorder thresholds, and inventory asset valuation.
6. **Cashflow Statement:** Monthly inflow vs. outflow trajectory.

---

### Module 12: Security, App Lock & Data Protection

#### 12.1 Device Security & Biometric Lock
- `AppLockActivity`: Native biometric prompt (`USE_BIOMETRIC`, `USE_FINGERPRINT`) and custom 4-digit PIN lock.
- Auto-lock timeout upon backgrounding the application.
- Rooted Device Detection (`RootedDeviceInfo`) protecting financial data on compromised Android environments.

#### 12.2 Cloud Data Persistence
- Continuous asynchronous sync to Khatabook AWS/GCP cloud servers.
- Automatic restore upon device change via phone number OTP authentication (`activity_sync_info_description`).

---

## 4. Complete Database Schema (Recovered SQLite Room Specification)

The local data layer utilizes Android Room SQLite. Below are the key entity schemas recovered from the APK binary:

```sql
-- Multi-Book Entity
CREATE TABLE IF NOT EXISTS `books` (
    `id` TEXT NOT NULL PRIMARY KEY,
    `name` TEXT NOT NULL,
    `phone` TEXT,
    `country_code` TEXT,
    `created_at` INTEGER NOT NULL,
    `updated_at` INTEGER NOT NULL,
    `currency` TEXT NOT NULL,
    `is_dirty` INTEGER NOT NULL,
    `properties` TEXT
);

-- Customer & Supplier Master
CREATE TABLE IF NOT EXISTS `customers` (
    `customer_id` TEXT NOT NULL PRIMARY KEY,
    `book_id` TEXT NOT NULL,
    `name` TEXT NOT NULL,
    `phone` TEXT,
    `country_code` TEXT,
    `customer_type` INTEGER NOT NULL, -- 1: Customer, 2: Supplier
    `balance` REAL NOT NULL DEFAULT 0.0,
    `credit_limit` REAL,
    `created_at` INTEGER NOT NULL,
    `updated_at` INTEGER NOT NULL,
    `deleted` INTEGER NOT NULL DEFAULT 0,
    `is_dirty` INTEGER NOT NULL,
    `alt_customer_id` TEXT,
    FOREIGN KEY(`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE
);

-- Core Debit / Credit Ledger Transactions
CREATE TABLE IF NOT EXISTS `transactions` (
    `_id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `transaction_id` TEXT NOT NULL,
    `book_id` TEXT NOT NULL,
    `customer_id` TEXT NOT NULL,
    `transaction_amount` REAL NOT NULL DEFAULT 0,
    `transaction_type` INTEGER NOT NULL DEFAULT 0, -- 1: You Gave, 2: You Got
    `transaction_date` TEXT NOT NULL,
    `transaction_desc` TEXT,
    `attachments` TEXT,
    `attachments_upload_pending` INTEGER DEFAULT 0,
    `created_at` INTEGER,
    `updated_at` INTEGER,
    `deleted` INTEGER NOT NULL DEFAULT 0,
    `is_dirty` INTEGER NOT NULL
);

-- BillBook Expense & Invoicing Master
CREATE TABLE IF NOT EXISTS `bill_expenses` (
    `id` TEXT NOT NULL PRIMARY KEY,
    `book_id` TEXT NOT NULL,
    `expense_date` INTEGER NOT NULL,
    `category` TEXT,
    `expense_prefix_id` TEXT,
    `expense_number` TEXT NOT NULL,
    `amount` REAL NOT NULL,
    `payment_type` TEXT,
    `created_at` INTEGER,
    `updated_at` INTEGER NOT NULL,
    `is_dirty` INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS `bill_expense_items` (
    `id` TEXT NOT NULL PRIMARY KEY,
    `book_id` TEXT NOT NULL,
    `expense_id` TEXT NOT NULL,
    `catalog_item_id` TEXT NOT NULL,
    `name` TEXT NOT NULL,
    `quantity` REAL NOT NULL,
    `amount` REAL NOT NULL,
    `table_type` TEXT NOT NULL,
    FOREIGN KEY(`expense_id`) REFERENCES `bill_expenses`(`id`) ON DELETE CASCADE
);

-- Staff & Payroll Master
CREATE TABLE IF NOT EXISTS `staffs` (
    `id` TEXT NOT NULL PRIMARY KEY,
    `book_id` TEXT,
    `name` TEXT NOT NULL,
    `phone` TEXT NOT NULL,
    `country_code` TEXT NOT NULL,
    `permissions` TEXT,
    `salary` TEXT,
    `deleted` INTEGER NOT NULL DEFAULT 0,
    `created_at` INTEGER,
    `updated_at` INTEGER
);

-- Settlement & Payout Ledger
CREATE TABLE IF NOT EXISTS `settlement` (
    `payout_id` TEXT NOT NULL PRIMARY KEY,
    `total_amount` REAL NOT NULL,
    `settlement_charges` REAL NOT NULL,
    `ui_show_at` INTEGER NOT NULL,
    `currency` TEXT NOT NULL,
    `txn_id` TEXT,
    `status` TEXT NOT NULL,
    `account_number` TEXT NOT NULL
);

-- Subscription & Plan Benefits (Khatabook Plus)
CREATE TABLE IF NOT EXISTS `benefit` (
    `type` TEXT NOT NULL,
    `user_id` TEXT NOT NULL,
    `meta` TEXT,
    `balance_unit` TEXT NOT NULL,
    `balance_value` INTEGER NOT NULL,
    `is_unlimited` INTEGER NOT NULL,
    `unit` TEXT NOT NULL,
    `remaining_period` INTEGER NOT NULL,
    PRIMARY KEY(`type`, `user_id`)
);

-- Automated Reminder Execution History
CREATE TABLE IF NOT EXISTS `reminder_history` (
    `id` TEXT NOT NULL PRIMARY KEY,
    `book_id` TEXT NOT NULL,
    `customer_id` TEXT NOT NULL,
    `attempt_time` INTEGER NOT NULL,
    `start_time` INTEGER NOT NULL,
    `end_time` INTEGER NOT NULL,
    `type` TEXT NOT NULL, -- SMS, WHATSAPP, IVR_CALL
    `status` TEXT NOT NULL
);

-- Incremental Sync Replication Log
CREATE TABLE IF NOT EXISTS `bill_change_log` (
    `id` TEXT NOT NULL PRIMARY KEY,
    `book_id` TEXT NOT NULL,
    `entity_id` TEXT NOT NULL,
    `table` TEXT NOT NULL,
    `is_dirty` INTEGER NOT NULL,
    `change` TEXT NOT NULL,
    `log_id` TEXT NOT NULL,
    `action_seq_number` INTEGER NOT NULL
);
```

---

## 5. Non-Functional Requirements & Performance Matrix

| Category | Requirement Specification | Observed Implementation Evidence |
| :--- | :--- | :--- |
| **Offline Reliability** | 100% core transaction logging capability without active internet | Local Room DB write + async `WorkManager` queued sync |
| **App Startup Speed** | Cold boot < 1.8s; Warm boot < 500ms | Jetpack `AppStartupProvider` + splash activity pre-warming |
| **Data Synchronization** | Sub-second delta replication upon network reconnection | Incremental `bill_change_log` with conflict resolution sequence numbers |
| **Network Footprint** | Compressed JSON payloads and chunked media transfers | Pre-signed AWS S3 direct file transfers; Protobuf/GZIP API traffic |
| **Security & Privacy** | AES-256 encrypted local storage; TLS 1.3 in-transit encryption | Encrypted preferences, Proguard obfuscation, Root detection (`RootedDeviceInfo`) |
| **Battery & Memory** | Minimal background resource footprint | `WorkManager` battery-aware scheduling; foreground sync bound strictly to user actions |
| **Hardware Resilience** | Graceful handling of low-end Android devices (Android Go, 2GB RAM) | Dex-sharded binary layout, Glide image memory caching, lightweight Compose rendering |

---

## 6. Product Roadmap & Strategic Evolution

Based on dormant classes, flags, and schema capabilities observed in Version `9.5.3`, the product is evolving across three horizons:

1. **Horizon 1 (Current State):** Deepening MSME billing adoption with thermal printing, automated WhatsApp messaging, and UPI QR settlements.
2. **Horizon 2 (Embedded Fintech):** Scaling high-margin financial products — embedded merchant lending up to ₹5,00,000, daily micro-settlement loan clawbacks, and gold/wealth accumulation.
3. **Horizon 3 (Omnichannel Business Suite):** Khatabook Desktop enterprise expansion (`desktop.khatabook.com`), multi-store supply chain synchronization, and B2B marketplace discovery connecting retail store owners directly with manufacturers.

