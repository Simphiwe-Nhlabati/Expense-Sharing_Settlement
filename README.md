# ZAR Ledger - Expense Sharing & Settlement Platform

<div align="center">

**A South African-focused expense splitting and settlement platform**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Bun](https://img.shields.io/badge/Bun-1.3-white?logo=bun)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

*Built for South Africa • ZAR Currency • POPIA Compliant*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Usage Examples](#-usage-examples)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Security Features](#-security-features)
- [South African Localization](#-south-african-localization)
- [Troubleshooting](#-troubleshooting)
- [Project Structure](#-project-structure)

---

## 🎯 Overview

**ZAR Ledger** is a full-stack expense sharing and settlement platform designed specifically for the South African market. It enables users to create groups, track shared expenses, split costs accurately, and settle debts with friends, family, or colleagues.

### Key Value Propositions

| Feature | Benefit |
|---------|---------|
| **ZAR-First Design** | All amounts stored in cents (BigInt) for precise Rand calculations |
| **ACID Compliance** | PostgreSQL transactions ensure financial data integrity |
| **POPIA Compliant** | South African data protection regulations built-in |
| **Supabase Integration** | Managed PostgreSQL with automatic backups and SSL |
| **Real-time Updates** | Instant balance updates across all group members |
| **Audit Trail** | Complete history of all financial transactions |

---

## ✨ Features

### Core Features

- 🔐 **JWT Authentication** - Secure sign-up/sign-in with access & refresh tokens
- 👥 **Group Management** - Create groups, generate invite codes, manage members
- 💰 **Expense Tracking** - Record expenses with precise ZAR cent calculations
- 📊 **Balance Calculation** - Real-time balance computation using double-entry bookkeeping
- 🔄 **Settlement System** - Track and record debt settlements
- 📱 **Responsive UI** - Mobile-first design with Shadcn UI components
- 🌙 **Dark Mode** - Built-in theme switching

### Advanced Features

- 🛡️ **Rate Limiting** - Database-backed rate limiting per endpoint
- 🔒 **Idempotency Keys** - Prevent duplicate transactions on critical endpoints
- 📝 **Audit Logging** - Complete audit trail for compliance
- 🧹 **Data Sanitization** - XSS protection and input validation
- 🎫 **Invite Codes** - Unique codes for joining groups (e.g., `CT-TRIP-A1B2`)

---

## 🛠️ Tech Stack

### Frontend

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Stack                          │
├──────────────┬──────────────────────────────────────────────┤
│ Framework    │ Next.js 16 (App Router)                      │
│ Language     │ TypeScript 5                                 │
│ UI Library   │ React 19                                     │
│ Styling      │ Tailwind CSS 4 + Shadcn UI                   │
│ State        │ Zustand + TanStack Query                     │
│ Forms        │ React Hook Form + Zod Validation             │
│ Icons        │ Lucide React + Radix Icons                   │
└──────────────┴──────────────────────────────────────────────┘
```

### Backend

```
┌─────────────────────────────────────────────────────────────┐
│                      Backend Stack                           │
├──────────────┬──────────────────────────────────────────────┤
│ Runtime      │ Bun.js (High-performance JavaScript runtime) │
│ Framework    │ Hono.js (Lightweight, fast web framework)    │
│ Database     │ PostgreSQL 15+ (Supabase managed)            │
│ ORM          │ Drizzle ORM (Type-safe, SQL-like queries)    │
│ Auth         │ JWT (Jose library)                           │
│ Validation   │ Zod + @hono/zod-validator                    │
│ Testing      │ Vitest                                       │
└──────────────┴──────────────────────────────────────────────┘
```

### Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure                            │
├──────────────┬──────────────────────────────────────────────┤
│ Server       │ Next.js + Hono (Dual server architecture)    │
│ Database     │ Supabase (Managed PostgreSQL with backups)   │
│ Cookies      │ HTTP-only, Secure, SameSite=Lax              │
│ CORS         │ Configurable allowed origins                 │
│ Rate Limit   │ Database-backed (configurable window)        │
│ Logging      │ Structured with PII redaction                │
└──────────────┴──────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

### Request Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│   Browser   │────▶│  Next.js 16  │────▶│  Hono.js    │────▶│PostgreSQL│
│   (Client)  │     │ (App Router) │     │  (Backend)  │     │   (DB)   │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────┘
       │                    │                    │                  │
       │  1. HTTP Request   │                    │                  │
       │───────────────────▶│                    │                  │
       │                    │                    │                  │
       │                    │  2. Forward Auth   │                  │
       │                    │───────────────────▶│                  │
       │                    │                    │                  │
       │                    │                    │  3. SQL Query    │
       │                    │                    │─────────────────▶│
       │                    │                    │                  │
       │                    │                    │  4. Result       │
       │                    │                    │◀─────────────────│
       │                    │                    │                  │
       │                    │  5. JSON Response  │                  │
       │                    │◀───────────────────│                  │
       │                    │                    │                  │
       │  6. Render/JSON    │                    │                  │
       │◀───────────────────│                    │                  │
       │                    │                    │                  │
```

### Authentication Flow

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│    User     │      │  Next.js API │      │ Hono Backend│
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘
       │                    │                      │
       │  Sign Up / In      │                      │
       │───────────────────▶│                      │
       │                    │  Forward Credentials │
       │                    │─────────────────────▶│
       │                    │                      │
       │                    │  Generate JWT + Hash │
       │                    │  Store in DB         │
       │                    │◀─────────────────────│
       │                    │                      │
       │  Set HTTP-only     │                      │
       │  Cookies           │                      │
       │◀───────────────────│                      │
       │                    │                      │
       │  Subsequent        │                      │
       │  Requests          │                      │
       │───────────────────▶│  Verify JWT          │
       │                    │─────────────────────▶│
       │                    │  Return User Data    │
       │◀───────────────────│                      │
       │                    │                      │
```

---

## 📦 Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Bun** | 1.3+ | JavaScript runtime & package manager |
| **PostgreSQL** | 15+ | Database server (Supabase for production) |
| **Node.js** | 20+ | (Optional, for tooling) |

### Installation Commands

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd expense-sharing_settlement
```

### Step 2: Install Dependencies

```bash
bun install
```

### Step 3: Set Up Database

#### Option A: Production (Supabase) - Recommended

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Navigate to **Settings** > **Database**
3. Copy your connection string and credentials

#### Option B: Local Development (Self-hosted PostgreSQL)

```bash
# Start PostgreSQL service
sudo service postgresql start

# Create database
sudo -u postgres psql
CREATE DATABASE expense_settlement_db;
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE expense_settlement_db TO postgres;
\q
```

### Step 4: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your configuration
nano .env.local
```

### Step 5: Run Database Migrations

```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

---

## ⚙️ Configuration

### Environment Variables (.env.local)

> **Note:** Never commit `.env.local` to version control. For production deployment on Vercel, set these variables in the Vercel dashboard.

```ini
# ===========================================
# DATABASE (Supabase PostgreSQL - Production)
# ===========================================
# Supabase provides a managed PostgreSQL instance with built-in backups
# Get these values from your Supabase dashboard:
# - Project Settings > Database > Connection string
# - Project Settings > API > Service role key

# Primary connection string (from Vercel or Supabase)
POSTGRES_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?sslmode=require

# Supabase-specific credentials (for Vercel integration)
POSTGRES_SUPABASE_URL=https://xxx.supabase.co
POSTGRES_SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-role-key
NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY=eyJhbG...your-anon-key

# ===========================================
# JWT AUTHENTICATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_ACCESS_TOKEN_MAX_AGE_SECONDS=900
JWT_REFRESH_TOKEN_MAX_AGE_SECONDS=604800

# ===========================================
# SERVER CONFIGURATION
# ===========================================
BACKEND_PORT=3001
BACKEND_URL=http://localhost:3001
BODY_LIMIT_BYTES=1048576
REQUEST_TIMEOUT_MS=30000

# ===========================================
# CORS CONFIGURATION
# ===========================================
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# ===========================================
# APP SETTINGS
# ===========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NODE_ENV=development
```

### 🔐 Generate JWT Secret

```bash
# Generate a secure random secret
openssl rand -base64 32
```

### 🔗 Supabase Setup Guide

1. **Create a Supabase Project**
   - Visit [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in project details (organization, name, database password)
   - Wait for provisioning (~2 minutes)

2. **Get Your Credentials**
   - Go to **Project Settings** > **API**
   - Copy the following:
     - `Project URL` → `POSTGRES_SUPABASE_URL`
     - `service_role secret` → `POSTGRES_SUPABASE_SERVICE_ROLE_KEY`
     - `anon public` → `NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY`

3. **Get Connection String**
   - Go to **Project Settings** > **Database**
   - Under "Connection string", copy the URI
   - Replace `[YOUR-PASSWORD]` with your database password
   - Set as `POSTGRES_URL`

4. **Vercel Integration** (Production)
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel link`
   - Run: `vercel env pull`
   - Vercel will automatically sync Supabase credentials

### 🗄️ Database Connection

The application uses **Drizzle ORM** with **Supabase PostgreSQL** for production:

```typescript
// server/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL!;
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
```

**Connection Features:**
- ✅ **SSL/TLS Required** - All connections use `sslmode=require`
- ✅ **Connection Pooling** - Managed by Supabase
- ✅ **Automatic Backups** - Daily backups enabled by Supabase
- ✅ **Type Safety** - Full TypeScript support via Drizzle ORM

---

## ▶️ Running the Application

### Development Mode

```bash
# Run both frontend and backend concurrently
bun run dev:all

# Or run separately
bun run dev:frontend   # Next.js on port 3000
bun run dev:backend    # Hono on port 3001
```

### Production Build

```bash
# Build the application
bun run build

# Start production server
bun run start
```

### Run Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui
```

### Lint Code

```bash
bun run lint
```

---

## 🚀 Production Deployment

### Deploy to Vercel with Supabase

This application is optimized for deployment on **Vercel** with **Supabase** as the managed PostgreSQL provider.

#### Prerequisites

- [Vercel account](https://vercel.com/signup)
- [Supabase project](https://supabase.com)
- [Vercel CLI](https://vercel.com/docs/cli) installed (`npm i -g vercel`)

#### Step 1: Link Your Vercel Project

```bash
# Login to Vercel
vercel login

# Link your project
vercel link
```

#### Step 2: Set Up Supabase Credentials

Ensure the following environment variables are set in your Vercel dashboard:

1. Go to **Vercel Dashboard** > Your Project > **Settings** > **Environment Variables**
2. Add the following variables from your Supabase project:

| Variable | Value From Supabase |
|----------|---------------------|
| `POSTGRES_URL` | Database connection string (Settings > Database) |
| `POSTGRES_SUPABASE_URL` | Project URL (Settings > API) |
| `POSTGRES_SUPABASE_SERVICE_ROLE_KEY` | Service Role Key (Settings > API) |
| `NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY` | Anon Public Key (Settings > API) |

#### Step 3: Deploy

```bash
# Deploy to production
vercel --prod
```

#### Step 4: Verify Deployment

1. Check the deployment logs in Vercel dashboard
2. Test the application at your production URL
3. Verify database connectivity by creating a test group

### Production Checklist

Before deploying to production:

- [ ] **Supabase**: Project created and credentials copied
- [ ] **Environment Variables**: All Supabase variables set in Vercel dashboard
- [ ] **JWT_SECRET**: Generated a secure random secret (min 32 chars)
- [ ] **PII_HMAC_SECRET**: Generated a unique secret for PII hashing
- [ ] **CORS_ORIGINS**: Updated to include only your production domains
- [ ] **Database Migrations**: Ran `bunx drizzle-kit migrate`
- [ ] **SSL Mode**: Connection string includes `?sslmode=require`

---

## 📖 Usage Examples

### Creating an Account

1. Navigate to **Sign Up** page
2. Enter your email and password (min 8 characters)
3. Click **Sign Up**
4. You'll be automatically logged in

### Creating a Group

```typescript
// Example: Creating a "Cape Town Trip" group
POST /api/groups/create
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "name": "Cape Town Trip",
  "description": "Weekend getaway to CT",
  "currency": "ZAR"
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Cape Town Trip",
    "inviteCode": "CT-A1B2"
  }
}
```

### Adding an Expense

```typescript
// Example: Splitting a dinner bill
POST /api/expenses
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "groupId": "group-uuid",
  "description": "Dinner at V&A Waterfront",
  "amount": 150000,  // R1,500.00 in cents
  "currency": "ZAR",
  "paidBy": "user-uuid",
  "date": "2026-02-24T19:00:00Z",
  "splits": [
    { "userId": "user-1-uuid", "amount": 50000 },
    { "userId": "user-2-uuid", "amount": 50000 },
    { "userId": "user-3-uuid", "amount": 50000 }
  ]
}
```

### The "Penny Gap" Problem (Solved)

When splitting **R100 between 3 people**, you get R33.33 recurring. ZAR Ledger handles this:

```typescript
// Traditional approach (loses money)
R100 / 3 = R33.33 × 3 = R99.99 ❌ (1 cent lost)

// ZAR Ledger approach (BigInt cents)
10000 cents / 3 = 3333 cents each
Last person gets: 10000 - (3333 × 2) = 3334 cents ✅
Total: 3333 + 3333 + 3334 = 10000 cents = R100.00
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/sign-up` | Create new account | No |
| POST | `/api/auth/sign-in` | Login | No |
| POST | `/api/auth/sign-out` | Logout | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Groups

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/groups` | List user's groups | Yes |
| POST | `/api/groups/create` | Create new group | Yes |
| GET | `/api/groups/:id` | Get group details | Yes |
| POST | `/api/groups/join` | Join with invite code | Yes |

### Expenses

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/expenses` | List expenses | Yes |
| POST | `/api/expenses` | Create expense | Yes |
| PUT | `/api/expenses/:id` | Update expense | Yes |
| DELETE | `/api/expenses/:id` | Delete expense | Yes |

### Settlement

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/settle` | Record settlement | Yes |
| GET | `/api/balances` | Get user balances | Yes |

---

## 🗄️ Database Schema

### Core Tables

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ id (UUID)    │ auth_id      │ email        │ password_hash  │
│ full_name    │ avatar_url   │ created_at   │ updated_at     │
└──────────────┴──────────────┴──────────────┴────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        GROUPS                                │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ id (UUID)    │ name         │ description  │ currency       │
│ invite_code  │ created_by   │ deleted_at   │ created_at     │
└──────────────┴──────────────┴──────────────┴────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     GROUP_MEMBERS                            │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ id (UUID)    │ group_id     │ user_id      │ role           │
│ joined_at    │              │              │                │
└──────────────┴──────────────┴──────────────┴────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       EXPENSES                               │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ id (UUID)    │ group_id     │ description  │ amount (BIGINT)│
│ currency     │ paid_by      │ date         │ deleted_at     │
└──────────────┴──────────────┴──────────────┴────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    LEDGER_ENTRIES                            │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ id (UUID)    │ group_id     │ expense_id   │ from_user_id   │
│ to_user_id   │ amount       │ type         │ is_settled     │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────────┐         ┌─────────────┐
│   USERS     │────────<│  GROUP_MEMBERS  │>────────│   GROUPS    │
└─────────────┘         └─────────────────┘         └─────────────┘
     │                                                   │
     │                                                   │
     │                      ┌─────────────┐              │
     └─────────────────────<│  EXPENSES   │>─────────────┘
                            └─────────────┘
                                   │
                                   │
                            ┌─────────────┐
                            │ LEDGER_     │
                            │ ENTRIES     │
                            └─────────────┘
```

---

## 🔒 Security Features

### Authentication & Authorization

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | Bun.password with Argon2id |
| **JWT Tokens** | Access (15min) + Refresh (7 days) |
| **HTTP-only Cookies** | Prevents XSS token theft |
| **Secure Cookies** | HTTPS-only in production |
| **SameSite=Lax** | CSRF protection |

### Rate Limiting

```typescript
// Default limits
/expenses/*  → 50 requests/minute
/groups/*    → 100 requests/minute
/*           → 200 requests/minute
```

### Idempotency Keys

Prevent duplicate charges on critical endpoints:

```bash
POST /api/expenses
Idempotency-Key: unique-request-id-123
```

### Input Sanitization

- XSS protection via `xss` library
- Body size limit: 1MB
- Request timeout: 30 seconds
- PII redaction in logs

---

## 🇿🇦 South African Localization

### Currency Handling

```typescript
// All amounts stored in cents (BigInt)
R150.50 → 15050 cents

// Formatting for display
const formatZAR = (cents: bigint) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(Number(cents) / 100);
};

// Output: R150.50
```

### POPIA Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Data Minimization** | Only collect essential user data |
| **Purpose Limitation** | Data used only for expense tracking |
| **Security Safeguards** | Encryption, access controls, audit logs |
| **Data Subject Rights** | Users can delete accounts/data |

### Invite Code Format

```
Format: [2 letters]-[4 alphanumeric]
Examples:
  CT-A1B2  (Cape Town)
  JHB-X9Y8 (Johannesburg)
  DBN-M4N3 (Durban)
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error

```bash
# Check Supabase dashboard for connection status
# Verify connection string in .env.local
POSTGRES_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?sslmode=require

# For local development, check PostgreSQL is running
sudo service postgresql status
```

#### 2. Authentication 404 Error

```bash
# Ensure backend server is running
bun run dev:backend

# Check BACKEND_URL in .env
BACKEND_URL=http://localhost:3001
```

#### 3. Groups Not Showing

```bash
# Run migrations
bunx drizzle-kit migrate

# Check groupMembers table
psql -d expense_settlement_db -c "SELECT * FROM group_members;"
```

#### 4. CORS Errors

```bash
# Add your origin to CORS_ORIGINS in .env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## 📁 Project Structure

```
expense-sharing_settlement/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Proxy to Hono)
│   │   ├── auth/
│   │   │   ├── sign-in/route.ts
│   │   │   ├── sign-up/route.ts
│   │   │   ├── sign-out/route.ts
│   │   │   └── me/route.ts
│   │   └── groups/
│   │       ├── create/route.ts
│   │       └── route.ts
│   ├── actions/                  # Server Actions
│   │   ├── auth.ts
│   │   └── groups.ts
│   └── page.tsx
│
├── server/                       # Hono Backend
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── groups.ts
│   │   └── expenses.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rate-limiter.ts
│   │   └── request-id.ts
│   ├── services/
│   │   ├── auth.ts
│   │   └── audit.ts
│   └── db/
│       ├── schema.ts
│       └── index.ts
│
├── components/                   # React Components
│   ├── features/
│   │   ├── groups/
│   │   └── expenses/
│   └── ui/                       # Shadcn UI Components
│
├── lib/                          # Utilities
│   ├── schemas.ts                # Zod schemas
│   ├── stores/                   # Zustand stores
│   └── invite-code.ts
│
├── drizzle/                      # Database Migrations
├── tests/                        # Vitest Tests
├── .env.example                  # Example Environment Variables
├── .env.local                    # Local Environment Variables (gitignored)
├── drizzle.config.ts
├── package.json
└── README.md
```

---

## 📝 License

MIT License - See LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For issues and questions:
- 📧 Email: support@zarledger.co.za
- 📚 Documentation: See AGENTS.md
- 🐛 Bug Reports: GitHub Issues

---

<div align="center">

**Built with ❤️ in South Africa**

*ZAR Ledger © 2026 - Empowering Financial Collaboration*

</div>

## CI/CD

See [`docs/CI_CD.md`](docs/CI_CD.md) for the fintech-focused CI/CD strategy, including quality gates, security scanning, and production deployment workflow.

