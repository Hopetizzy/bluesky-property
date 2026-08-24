# Blue Sky Property Management Platform — Production Database Setup Guide

**Version:** 2.1.0  
**Target Environment:** PostgreSQL 15+ / Supabase  
**Geographic Scope:** Worldwide (USA, Canada, UK, Australia, Europe)  

---

## 🏛️ Database Architecture Overview

The Blue Sky database is designed as a relational system with **21 Core Tables**, multi-currency support, dynamic listing plan monetization, private encrypted document vaults, and Row Level Security (RLS) enforcement.

```
                          ┌──────────────────────────┐
                          │     public.profiles      │
                          │ (Applicants/Admins/Owners│
                          └─────────────┬────────────┘
                                        │ 1:1
                          ┌─────────────▼────────────┐
                          │ public.provider_profiles │
                          └─────────────┬────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │ 1:N                        │ 1:N                        │ 1:N
┌──────────▼───────────────┐ ┌──────────▼───────────────┐ ┌──────────▼───────────────┐
│public.provider_payments  │ │public.provider_listing_  │ │   public.properties      │
│(Receipts & Verification) │ │  periods (Time-Bound)    │ │ (USA, CAN, UK, AUS, etc.) │
└──────────────────────────┘ └──────────────────────────┘ └──────────┬───────────────┘
                                                                     │ 1:N
                                                        ┌────────────┴────────────┐
                                                        │                         │
                                           ┌────────────▼──────────┐ ┌────────────▼──────────┐
                                           │ public.property_units │ │ public.property_images│
                                           │(Multi-Unit Inventory) │ │ (Gallery & Sort Order)│
                                           └────────────┬──────────┘ └───────────────────────┘
                                                        │ 1:N
                                           ┌────────────▼──────────────┐
                                           │public.rental_applications │
                                           │ (Frictionless 6-Step App) │
                                           └────────────┬──────────────┘
                                                        │ 1:N
                                           ┌────────────▼──────────────┐
                                           │public.application_        │
                                           │  documents (Private Vault)│
                                           └───────────────────────────┘
```

---

## 📂 Database Directory Structure

```bash
database/
├── 01_schema.sql             # 21 Tables, ENUMs, Triggers, Views & Early Renewal Procedure
├── 02_security_rls.sql       # Complete Row Level Security (RLS) policies
├── 03_storage_buckets.sql    # Supabase Storage Buckets & Vault Permissions
├── 04_seed_data.sql          # Worldwide Demo Data (USA, Canada, UK, Australia)
├── 05_functions_and_cron.sql # Automated Notifications & Expiration Cron Routines
├── database_master.sql       # 1-Click Consolidated Script for All Environments
└── test_db_schema.js         # Automated Schema Integrity & Syntax Validator
```

---

## 🚀 How to Deploy the Database

### Option A: 1-Click Deployment in Supabase Cloud

1. Open your [Supabase Dashboard](https://app.supabase.com).
2. Create or select your project.
3. Navigate to **SQL Editor** from the left navigation.
4. Click **New Query**.
5. Copy and paste the contents of [`database/database_master.sql`](file:///c:/Users/HP/Documents/BlueSky_Property/database/database_master.sql).
6. Click **Run** (`Ctrl+Enter` / `Cmd+Enter`).
7. Copy your `Project URL` and `anon public key` from **Project Settings → API** and paste them into your `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

---

### Option B: Local PostgreSQL or Docker

1. **Start PostgreSQL container:**
   ```bash
   docker run --name bluesky-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=bluesky -p 5432:5432 -d postgres:15
   ```

2. **Execute Database Scripts via psql:**
   ```bash
   psql -U postgres -d bluesky -f database/01_schema.sql
   psql -U postgres -d bluesky -f database/02_security_rls.sql
   psql -U postgres -d bluesky -f database/04_seed_data.sql
   psql -U postgres -d bluesky -f database/05_functions_and_cron.sql
   ```

---

## 📋 Complete 21 Tables Catalog

| # | Table Name | Purpose | Key Relations & Constraints |
|---|---|---|---|
| 1 | `profiles` | Universal user accounts (Applicants, Providers, Admins) | `auth_user_id` linked to Supabase Auth |
| 2 | `provider_profiles` | Property owners, managers, brokerages | `profile_id` (1:1), license number, verification status |
| 3 | `listing_plans` | Dynamic admin-created subscription tiers (30, 90, 180, 365 Days) | Duration days, features JSONB, active flags |
| 4 | `payment_methods` | External verification options (Wire, ACH, PayPal, Zelle, Interac) | Instructions, account details, routing/SWIFT |
| 5 | `provider_payments` | Uploaded payment proof receipts awaiting admin audit | Links `provider_id`, `listing_plan_id`, `payment_method_id` |
| 6 | `provider_listing_periods` | Active time-bound listing access windows | `starts_at`, `expires_at`, `grace_period_hours` (48h default) |
| 7 | `properties` | Worldwide property listings | Ownership constraint (Provider or Admin direct) |
| 8 | `property_units` | Multi-unit rental configurations | Beds, baths, sq ft, rent amount, currency |
| 9 | `property_images` | High-res gallery media | `property_id`, storage path, sort order, primary flag |
| 10 | `amenities` | Global standard amenities taxonomy | Parking, Pool, Concierge, EV Charging, etc. |
| 11 | `property_amenities` | Join table connecting properties & amenities | Composite primary key `(property_id, amenity_id)` |
| 12 | `rental_applications` | Frictionless 6-step tenant rental applications | Ref code (`BS-XXXXX`), applicant details, income, desired move-in |
| 13 | `application_documents` | Private security document vault | Drivers license, paystubs, utility bills |
| 14 | `application_status_history` | Audit trail of application stage transitions | Previous & new status, timestamp, reviewer |
| 15 | `conversations` | Support and property inquiry chat threads | Connects applicant, property, and support |
| 16 | `messages` | Chat messages with automated bot flagging | Automated keyword engine & live team messaging |
| 17 | `faqs` | Searchable knowledge base items | Questions, answers, categories, priorities |
| 18 | `faq_keywords` | Keyword mapping for instant automated matching | Indexed keyword lookups |
| 19 | `notifications` | System & in-app alerts | Expiry notices, approval alerts, unread counters |
| 20 | `saved_favorites` | Tenant saved property wishlists | Unique per `(profile_id, property_id)` |
| 21 | `activity_logs` | Operations security and audit ledger | IP, user agent, action, entity type & JSON metadata |

---

## 🔒 Security & Row Level Security (RLS) Model

1. **Super Admins (`role = 'admin'`):** Full read, write, audit, and verification access across all 21 tables.
2. **Providers:**
   - Manage only their own properties, units, and images.
   - Access their own payment receipts and listing access countdowns.
3. **Applicants (Tenants):**
   - Access only their own submitted applications and personal document vaults.
   - Anonymous visitors can browse approved public properties without authentication.
4. **Public Active Properties View (`v_public_active_properties`):**
   - Enforces business logic: properties appear in public searches **only if** `status = 'approved'` AND (`is_admin_direct = TRUE` OR provider has an active listing period where `expires_at + grace_period_hours > NOW()`).

---

## 🔄 Automated Business Logic & Triggers

### 1. Early Renewal Calculation Function (`activate_provider_listing_period`)
When a provider renews early while their current subscription is still active:
- The system detects the existing `expires_at` timestamp.
- The new duration seamlessly extends from the future expiration date rather than today, ensuring providers never lose paid days.

### 2. Multi-Stage Expiry Routine (`check_expiring_listing_periods`)
- Runs daily to check for periods expiring at **14, 7, 3, and 1 day(s)**.
- Automatically generates in-app notifications prompting renewal.

### 3. Grace Period Auto-Hiding Routine (`cleanup_expired_listing_periods`)
- After the 48-hour grace window elapses, the period status transitions to `expired`.
- Listings are automatically hidden from public marketplace discovery without deleting any property data.
