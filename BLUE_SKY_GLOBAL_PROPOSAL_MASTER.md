# 🌐 Blue Sky Property Management — Global Platform Architecture & Technical Blueprint

> **Enterprise Real Estate Rental Marketplace & Tenant Application Management Platform**  
> **Global Scope:** United States, Canada, United Kingdom, Australia, Europe & International Markets  
> **Version:** 2.1.0 (Worldwide Aligned Release)  
> **Tagline:** *Better Spaces • Better Living*

---

## Executive Summary

**Blue Sky Property Management** is a modern, high-trust, verified rental marketplace and end-to-end tenant application pipeline built for property owners, property managers, real estate agents, prospective tenants, and platform administrators.

Unlike unverified classifieds or transactional buy/sell platforms, Blue Sky operates exclusively as a **curated, verified rental ecosystem**. Every property listed on the platform is subjected to administrative verification before going live. Every tenant application undergoes a rigorous, configurable credibility review process (identity, residency, employment/income, financial capability, and payment verification).

The platform features an **Admin-Controlled Dynamic Listing Access Model** for property providers: administrators can create unlimited custom listing plans (e.g., 30 Days, 90 Days, 180 Days, 365 Days, or any custom duration/price/currency) which dynamically populate the provider's payment screen. Providers enjoy unlimited property submissions during their active entitlement window. When a provider's access period concludes, their properties are automatically and gracefully hidden from public discovery without data loss, immediately republishing upon renewal. In addition, Blue Sky Super Administrators retain first-party publishing capabilities to directly list and manage Blue Sky-owned and managed properties.

---

## 1. Aligned Technical Decisions & Engineering Standards

| Dimension | Aligned Technical Decision | Operational Rationale |
| :--- | :--- | :--- |
| **Frontend Stack** | **Next.js & React with TypeScript** | Full-stack performance, type safety, modular component architecture, and server-side rendering for marketplace SEO. |
| **Styling & Theme** | **Custom Vanilla CSS Design Tokens** | Pixel-perfect adherence to design tokens extracted from Boards 1–5 and Logo. Zero dependency overhead. |
| **Mobile-First UX** | **Strict Mobile-First Architecture** | Native app feel on mobile web: bottom navigation bar, swipeable photo galleries, slide-up filter sheets, 48px touch targets, and collapsible admin drawer. |
| **Tenant Onboarding** | **Frictionless Hybrid Onboarding** | Visitors browse, search, and complete Steps 1–5 of the application form anonymously; account creation/linking happens seamlessly at Step 6 during submission. |
| **Provider Plans** | **Dynamic Unlimited Listing Plans** | Super Admins can create unlimited custom plans (custom days, price, currency, features, popularity flag) that dynamically populate the Provider's payment screen. |
| **Listing Expiration** | **Multi-Stage Alerts + 48h Grace Period** | Automated notifications at 14d, 7d, 3d, and 1d before expiration, with a 48-hour grace period before listings are hidden. Early renewals seamlessly extend from the existing expiration timestamp. |
| **Payment Pipeline** | **Pure Proof-of-Payment Verification** | External payment methods (Bank Wire, ACH, PayPal, Zelle, Interac e-Transfer, Cashier's Check) with mandatory image/PDF proof upload and administrative verification. |
| **Admin Direct Inventory** | **First-Party Blue Sky Publishing** | Admins can publish properties directly (`is_admin_direct = TRUE`) without requiring provider listing subscriptions. |
| **Document Security** | **Private Storage Vault with RLS** | Sensitive government IDs, paystubs, tax forms, and payment proofs reside in restricted Supabase private buckets accessible only via time-limited signed URLs. |

---

## 2. Global Business & Operational Model

```
                                  ┌──────────────────────────────────────────────┐
                                  │         BLUE SKY PROPERTY MANAGEMENT         │
                                  │               (GLOBAL PLATFORM)              │
                                  └──────────────────────┬───────────────────────┘
                                                         │
             ┌───────────────────────────────────────────┼───────────────────────────────────────────┐
             │                                           │                                           │
             ▼                                           ▼                                           ▼
┌─────────────────────────┐                 ┌─────────────────────────┐                 ┌─────────────────────────┐
│     PUBLIC & TENANTS    │                 │   PROPERTY PROVIDERS    │                 │   SUPER ADMINISTRATORS  │
│  (Prospective Renters)  │                 │ (Owners / Agents / PMs) │                 │   (Platform Operators)  │
├─────────────────────────┤                 ├─────────────────────────┤                 ├─────────────────────────┤
│ • Browse Verified Units │                 │ • Register Provider Acc │                 │ • Verify Listing Access │
│ • Global Filter & Search│                 │ • Select Dynamic Plan   │                 │ • Verify Properties     │
│ • Multi-Unit Selection  │                 │ • Submit Payment Proof  │                 │ • Review Applications   │
│ • Frictionless 6-Step   │                 │ • Unlimited Listings    │                 │ • Create Unlimited Plans│
│   Application Flow      │                 │ • Multi-Unit Management │                 │ • First-Party Publishing│
│ • Upload Verification ID│                 │ • 48h Grace + Reminders │                 │ • Keyword FAQ Engine    │
│ • Real-time App Tracker │                 │ • Early Renewal Engine  │                 │ • Immutable Audit Logs  │
│ • Direct Inquiry Chat   │                 │ • Verification Feedback │                 │ • Payment Proof Approval│
└─────────────────────────┘                 └─────────────────────────┘                 └─────────────────────────┘
```

---

## 3. Core User Roles & Permission Matrix

| Role | Access Level | Description & Core Capabilities |
| :--- | :--- | :--- |
| **Public Visitor** | Anonymous | Browse approved & active listings, perform location/price searches, view property galleries, access FAQs, initiate inquiry messages, and start rental applications with zero friction. |
| **Tenant / Applicant** | Authenticated | Manage tenant profile, complete 6-step rental application, upload private identity & income verification documents, track application progress in real-time, and chat with Blue Sky Support. |
| **Property Provider** | Authenticated & Verified | Real estate agents, individual property owners, and management firms. Subscribe to dynamic listing plans, submit payment proofs, create and edit multi-unit properties, track verification status, and manage active listings. |
| **Super Administrator** | Privileged Admin | Full management of the platform: verify provider payments, verify property listings, review applicant files, dynamically create/edit listing plans, configure payment methods, create direct properties, answer support chats, configure keyword FAQs, and inspect audit logs. |

---

## 4. Detailed User Experience & Journey Flows

```
[ FLOW 1: GLOBAL PROPERTY DISCOVERY & FRICTIONLESS APPLICATION ]
Public Visitor ──► Search (Country / City / Price) ──► Property Details ──► Select Unit ──► Apply Now
                                                                                                  │
    ┌─────────────────────────────────────────────────────────────────────────────────────────────┘
    ▼
Step 1: Personal Info (Full Name, Email, Phone, DOB, Nationality)
    ▼
Step 2: Current Residence (Address, City, State/Province, Postal Code)
    ▼
Step 3: Employment & Income (Employer, Position, Monthly Gross Income)
    ▼
Step 4: Identity Verification (Driver's License / Passport / State ID / National ID)
    ▼
Step 5: Supporting Docs & Financial Capability (Paystubs, Tax Slips, Bank Statements, Proof of Address)
    ▼
Step 6: Review, Account Linking & Payment Proof (if required) ──► Seamless Submit
    ▼
Tenant Dashboard ◄── Real-Time Status Tracking (Submitted ──► Under Review ──► Approved / Rejected)
```

```
[ FLOW 2: PROVIDER MONETIZATION & DYNAMIC LISTING ACCESS ]
Provider Register ──► View Dynamic Admin Plans (e.g. 30 / 90 / 180 / 365 Days) ──► Payment Instructions
                                                                                                 │
    ┌────────────────────────────────────────────────────────────────────────────────────────────┘
    ▼
Upload Payment Proof (Receipt/Wire) ──► PENDING REVIEW ──► Admin Verifies ──► LISTING ACCESS ACTIVE
                                                                                      │
    ┌─────────────────────────────────────────────────────────────────────────────────┴─────────────┐
    ▼                                                                                               ▼
Submit Unlimited Properties                                                                  Lifecycle Engine
(Basic Info ──► Location ──► Units & Pricing ──► Amenities ──► High-Res Photos)                     │
    ▼                                                                                               ├─► Multi-Stage Alerts (14d, 7d, 3d, 1d)
Admin Property Review (Verify Address, Ownership & Quality)                                         ├─► 48-Hour Grace Period after expiry
    ▼                                                                                               ├─► Early Renewal (Extends future date)
APPROVED ──► Live on Public Marketplace (While Listing Period Active)                               └─► On Expiry: Graceful auto-hide
```

```
[ FLOW 3: SUPPORT & DETERMINISTIC KEYWORD FAQ ENGINE ]
User / Applicant Message ──► Keyword Match Engine (e.g., "how to apply", "deposit", "verification time")
                                      │
                  ┌───────────────────┴───────────────────┐
                  ▼                                       ▼
            MATCH FOUND                              NO MATCH
                  │                                       │
                  ▼                                       ▼
        Instant Automated Reply                Admin Inbox Ticket Created
        (Tag: Automated Assistant)             (Real-time Admin Support Agent)
```

---

## 5. Design System & Design Tokens (Extracted from Boards 1–5 & Logo)

### 5.1 Brand Identity & Color Palette

```
/* Primary Brand Colors */
--color-primary-blue:        #0066FF;  /* Core Brand Action / Primary Buttons / Price Tags */
--color-primary-hover:       #0052CC;  /* Hover State */
--color-primary-active:      #004099;  /* Active / Pressed State */
--color-primary-tint:        #EBF3FF;  /* Light Blue Tint for Selected Items / Active Tabs */

/* Brand Navy & Deep Tones */
--color-navy-dark:           #0F172A;  /* Primary Text / Main Headings / Navigation */
--color-navy-secondary:      #1E293B;  /* Subheadings / Emphasized Borders */
--color-navy-muted:          #334155;  /* Secondary Text / Icons */

/* Sky & Accent Colors */
--color-sky-blue:            #38BDF8;  /* Brand Sky / Highlights */
--color-sky-light:           #E0F2FE;  /* Soft Blue Backgrounds / Callout Containers */
--color-sky-badge:           #BAE6FD;  /* Accent Badges / Micro Badges */

/* Status & Feedback System */
--color-success:             #16A34A;  /* Approved / Verified / Published */
--color-success-bg:          #DCFCE7;  /* Success Background / Chip Fill */
--color-success-text:        #15803D;  /* Success Dark Text */

--color-warning:             #F59E0B;  /* Under Review / Pending / Expiring Soon */
--color-warning-bg:          #FEF3C7;  /* Warning Background / Chip Fill */
--color-warning-text:        #B45309;  /* Warning Dark Text */

--color-danger:              #EF4444;  /* Rejected / Suspended / Expired */
--color-danger-bg:           #FEE2E2;  /* Danger Background / Chip Fill */
--color-danger-text:         #B91C1C;  /* Danger Dark Text */

/* Neutrals & Surfaces */
--color-surface-white:       #FFFFFF;  /* Card Backgrounds / Clean Canvas */
--color-surface-bg:          #F8FAFC;  /* Global App Background / Mobile Canvas */
--color-surface-subtle:      #F1F5F9;  /* Section Backgrounds / Input Fills */
--color-border-subtle:       #E2E8F0;  /* Standard Dividers / Card Outlines */
--color-border-focus:        #0066FF;  /* Input Focus Border */
--color-text-primary:        #0F172A;  /* 100% Contrast Text */
--color-text-secondary:      #64748B;  /* Supporting Labels / Subtext */
--color-text-placeholder:    #94A3B8;  /* Form Placeholders */
```

### 5.2 Typography Hierarchy
- **Font Primary:** `Plus Jakarta Sans` / `Inter`, system-ui, -apple-system, sans-serif
- **Heading 1 (Hero & Main Titles):** 24px–28px (Mobile) / 36px (Desktop), Bold (700), Line Height: 1.25
- **Heading 2 (Section Headers):** 18px–20px, Semi-Bold (600), Line Height: 1.3
- **Heading 3 (Card Titles & Dialogs):** 15px–16px, Semi-Bold (600), Line Height: 1.4
- **Body Regular:** 14px, Regular (400), Line Height: 1.5
- **Body Small / Captions:** 12px, Medium (500), Line Height: 1.4
- **Price Display:** 16px–20px, Bold (700), Color: `--color-primary-blue`

### 5.3 Mobile-First UI Component Specifications
- **Cards:** `border-radius: 14px; background: #FFFFFF; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(15,23,42,0.04);`
- **Buttons (Primary):** `background: #0066FF; color: #FFFFFF; border-radius: 10px; height: 48px; font-weight: 600; font-size: 14px;`
- **Inputs & Selects:** `height: 48px; border-radius: 10px; border: 1px solid #E2E8F0; background: #FFFFFF; font-size: 14px; padding: 0 14px;`
- **Status Badges / Chips:** `height: 24px; padding: 0 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase;`
- **Bottom Navigation (Mobile):** `height: 64px; background: #FFFFFF; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-around;`

---

## 6. Screen Inventory & Route Architecture (All 5 Boards)

```
====================================================================================================
BOARD 1: PUBLIC MARKETPLACE & DISCOVERY (MOBILE-FIRST)
====================================================================================================
[01] /                       Home (Hero, Global Location Selector, Search Bar, Featured Properties)
[02] /properties             Property Search Results (Sticky Filters, Sort, Grid & Map Toggle)
[03] /properties/filter      Filter Modal Sheet (Location, Property Type, Beds, Price Range Slider, Amenities)
[04] /properties/:slug       Property Details (12-Photo Carousel, Unit Cards, Verified Badge, Amenities, Map)
[05] /properties/:slug/apply Frictionless Multi-Step Application Wizard (Steps 1 to 6)
[06] /apply/success          Application Submitted Confirmation (Next Steps Timeline, Link to Tracker)

====================================================================================================
BOARD 2: APPLICANT PORTAL
====================================================================================================
[07] /auth/login             Tenant & Public Auth (Email/Password, Google, Apple SSO)
[08] /applicant/dashboard    Applicant Dashboard (Active Application Count, Status Banners, Quick Actions)
[09] /applicant/applications My Applications (Filter by All, Under Review, Approved, Rejected)
[10] /applicant/app/:id      Application Details & Timeline (4-Stage Progress Tracker, Document Checklist)
[11] /applicant/documents    Document Vault (Secure ID, Income, Address Proof Uploads & Preview)
[12] /applicant/messages     Support & Inquiry Chat (Active Conversations, Blue Sky Automated & Live Replies)

====================================================================================================
BOARD 3: PROPERTY PROVIDER PORTAL
====================================================================================================
[13] /provider/register      Provider Account Creation (Owner, Agent, Property Manager, Brokerage)
[14] /provider/dashboard     Provider Dashboard (Listing Access Days Left Countdown, Live vs Pending Stats)
[15] /provider/plans         Dynamic Listing Access Packages (Rendered dynamically from Admin plans)
[16] /provider/payment       Payment Details & Proof Upload (Bank Wire, PayPal, Zelle, EFT + Receipt Dropzone)
[17] /provider/payment-hist  Payment History & Invoice Receipts (Pending, Verified, Rejected with Reasons)
[18] /provider/properties    My Properties Portfolio (Status Tabs: Published, Pending Review, Rejected)
[19] /provider/property/new  Add Property Wizard (Step 1: Info, Step 2: Location, Step 3: Units, Step 4: Amenities, Step 5: Images, Step 6: Review)
[20] /provider/property/:id  Property Verification Status & Rejection Feedback Center

====================================================================================================
BOARD 4: ADMIN COMMAND CENTER
====================================================================================================
[21] /admin/login            Restricted Admin Authentication (MFA / Device Guard)
[22] /admin/dashboard        Admin Executive Dashboard (Action Items: Pending Properties, Payments, Apps)
[23] /admin/properties       Global Property Registry (Search, Global Region Filter, Bulk Actions)
[24] /admin/properties/:id   Property Verification Inspection Suite (Full Gallery, Unit Audit, Approve / Reject with Notes)
[25] /admin/providers        Provider Management (Listing Expiry Trackers, Verification Badges, Account Suspension)
[26] /admin/payments         Payment Proof Verification Desk (Provider Listing Receipts & Application Fees)
[27] /admin/applications     Rental Applications Management (Global Filter, Credibility Flags)
[28] /admin/app/:id          Deep Application Audit (Identity Verification, Income Verification, Approval Workflow)
[29] /admin/property/create  Admin Direct Property Upload (Publish First-Party Blue Sky Inventory)
[30] /admin/plans            Dynamic Listing Plan Configuration (Create unlimited plans: Days, Price, Currency, Features, Active)
[31] /admin/faqs             Keyword FAQ Automation Engine (Set Keywords, Priority, Responses)
[32] /admin/settings         Platform Global Settings (Branding, Legal Disclaimers, Multi-Currency, Payment Accounts)
[33] /admin/audit-logs       Immutable System Activity Ledger (Admin Actions, Timestamps, Old/New Diffs)

====================================================================================================
BOARD 5: SYSTEM & SUPPORTING UI
====================================================================================================
[34] /notifications          Global Notification Feed (Push, SMS, In-App Status Updates)
[35] /help                   Help Center & Searchable FAQ Directory
[36] /settings               User Account Preferences (Profile Info, Password, Notifications, Language)
[37] System States           Empty States, Skeleton Loaders, Error 404/500, Modal Confirmations, Date Picker Sheet
```

---

## 7. Enterprise Database Architecture & Relational Schema (PostgreSQL / Supabase)

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Types & Enums
CREATE TYPE user_role AS ENUM ('admin', 'provider', 'applicant');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deactivated');
CREATE TYPE provider_type AS ENUM ('owner', 'agent', 'property_manager', 'brokerage', 'company');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE listing_period_status AS ENUM ('pending', 'active', 'expired', 'cancelled');
CREATE TYPE property_type AS ENUM ('apartment', 'single_family_house', 'townhouse', 'condo', 'duplex', 'studio', 'penthouse', 'commercial', 'other');
CREATE TYPE property_status AS ENUM ('draft', 'pending_verification', 'approved', 'rejected', 'suspended', 'archived');
CREATE TYPE unit_type AS ENUM ('studio', 'one_bedroom', 'two_bedroom', 'three_bedroom', 'four_plus_bedroom', 'penthouse', 'entire_house', 'room');
CREATE TYPE rent_period AS ENUM ('monthly', 'quarterly', 'semi_annual', 'annual');
CREATE TYPE unit_status AS ENUM ('available', 'under_application', 'leased', 'unavailable');
CREATE TYPE application_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled');
CREATE TYPE document_type AS ENUM ('passport', 'drivers_license', 'state_id', 'national_id', 'proof_of_income', 'employment_letter', 'utility_bill_address', 'tax_return', 'bank_statement', 'credit_report', 'other');
CREATE TYPE document_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE app_verification_type AS ENUM ('identity', 'residency', 'employment', 'income', 'credit_worthiness', 'background_check', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE payment_method_type AS ENUM ('bank_wire', 'ach_transfer', 'paypal', 'zelle', 'interac_etransfer', 'cashiers_check', 'other');

-- 1. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'applicant',
    status user_status NOT NULL DEFAULT 'active',
    avatar_url TEXT,
    country_code VARCHAR(3) DEFAULT 'USA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Global Geographic Hierarchy
CREATE TABLE public.countries (
    code VARCHAR(3) PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '$',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE public.states_provinces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(3) NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code VARCHAR(10) NOT NULL,
    UNIQUE(country_code, code)
);

CREATE TABLE public.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_id UUID NOT NULL REFERENCES public.states_provinces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE(state_id, name)
);

CREATE TABLE public.neighborhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    postal_code VARCHAR(20),
    UNIQUE(city_id, name)
);

-- 3. Provider Profiles
CREATE TABLE public.provider_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_type provider_type NOT NULL DEFAULT 'owner',
    company_name TEXT,
    license_number TEXT,
    business_phone TEXT,
    business_address TEXT,
    country_code VARCHAR(3) REFERENCES public.countries(code),
    verification_status verification_status NOT NULL DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Applicant Profiles
CREATE TABLE public.applicant_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_of_birth DATE,
    nationality TEXT,
    current_address TEXT,
    city TEXT,
    state_province TEXT,
    postal_code TEXT,
    country_code VARCHAR(3) REFERENCES public.countries(code),
    current_employer TEXT,
    occupation TEXT,
    monthly_gross_income NUMERIC(12, 2),
    credit_score_range VARCHAR(50),
    verification_status verification_status NOT NULL DEFAULT 'unverified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Listing Access Plans (Dynamic Admin Creation)
CREATE TABLE public.listing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    duration_days INTEGER NOT NULL,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    features JSONB DEFAULT '["Unlimited property listings", "Priority verification", "All features included"]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Payment Methods Accepted
CREATE TABLE public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type payment_method_type NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    instructions TEXT NOT NULL,
    account_name TEXT,
    account_number TEXT,
    routing_or_swift TEXT,
    bank_name TEXT,
    paypal_email TEXT,
    zelle_identifier TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Provider Payments
CREATE TABLE public.provider_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
    listing_plan_id UUID NOT NULL REFERENCES public.listing_plans(id),
    payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id),
    amount NUMERIC(10, 2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    proof_storage_path TEXT NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Provider Listing Entitlement Periods
CREATE TABLE public.provider_listing_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
    listing_plan_id UUID NOT NULL REFERENCES public.listing_plans(id),
    payment_id UUID UNIQUE REFERENCES public.provider_payments(id),
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    grace_period_hours INTEGER NOT NULL DEFAULT 48,
    status listing_period_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Properties Registry (Provider-submitted OR Admin first-party)
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
    is_admin_direct BOOLEAN NOT NULL DEFAULT FALSE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    property_type property_type NOT NULL,
    country_code VARCHAR(3) NOT NULL REFERENCES public.countries(code),
    state_id UUID NOT NULL REFERENCES public.states_provinces(id),
    city_id UUID NOT NULL REFERENCES public.cities(id),
    neighborhood_id UUID REFERENCES public.neighborhoods(id),
    street_address TEXT NOT NULL,
    postal_code TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    status property_status NOT NULL DEFAULT 'pending_verification',
    verification_notes TEXT,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Property Images
CREATE TABLE public.property_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    caption TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Property Units (Multi-unit Architecture)
CREATE TABLE public.property_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_number_or_name TEXT NOT NULL,
    unit_type unit_type NOT NULL,
    bedrooms INTEGER NOT NULL DEFAULT 1,
    bathrooms NUMERIC(3, 1) NOT NULL DEFAULT 1.0,
    square_feet INTEGER,
    rent_amount NUMERIC(10, 2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    security_deposit NUMERIC(10, 2),
    rent_period rent_period NOT NULL DEFAULT 'monthly',
    available_quantity INTEGER NOT NULL DEFAULT 1,
    status unit_status NOT NULL DEFAULT 'available',
    available_from DATE DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Amenities & Property Links
CREATE TABLE public.amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'General',
    icon_name TEXT
);

CREATE TABLE public.property_amenity_links (
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
    PRIMARY KEY(property_id, amenity_id)
);

-- 13. Rental Applications
CREATE TABLE public.rental_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_ref VARCHAR(20) NOT NULL UNIQUE,
    applicant_id UUID NOT NULL REFERENCES public.applicant_profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.property_units(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'submitted',
    desired_move_in DATE NOT NULL,
    lease_term_months INTEGER NOT NULL DEFAULT 12,
    occupants_count INTEGER NOT NULL DEFAULT 1,
    has_pets BOOLEAN NOT NULL DEFAULT FALSE,
    pets_description TEXT,
    additional_notes TEXT,
    admin_notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Private Applicant Documents (Restricted Vault)
CREATE TABLE public.application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.rental_applications(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    status document_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Applicant Verifications (Granular Check Ledger)
CREATE TABLE public.application_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.rental_applications(id) ON DELETE CASCADE,
    verification_type app_verification_type NOT NULL,
    status verification_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Application Payments
CREATE TABLE public.application_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.rental_applications(id) ON DELETE CASCADE,
    payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id),
    amount NUMERIC(10, 2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    proof_storage_path TEXT NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Communication & Messaging System
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message_body TEXT NOT NULL,
    is_automated BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. FAQ Keyword Engine
CREATE TABLE public.faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[] NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Notifications Engine
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Platform Global Settings
CREATE TABLE public.platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Immutable System Audit Log
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7.1 Public Visibility SQL View with Grace Period
```sql
CREATE OR REPLACE VIEW public.v_public_active_properties AS
SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    p.property_type,
    p.country_code,
    c.name AS country_name,
    s.name AS state_name,
    s.code AS state_code,
    ct.name AS city_name,
    n.name AS neighborhood_name,
    p.street_address,
    p.postal_code,
    p.latitude,
    p.longitude,
    p.featured,
    p.published_at,
    p.is_admin_direct,
    p.provider_id,
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', pi.id,
            'storage_path', pi.storage_path,
            'is_primary', pi.is_primary,
            'sort_order', pi.sort_order
        ) ORDER BY pi.is_primary DESC, pi.sort_order ASC)
        FROM public.property_images pi WHERE pi.property_id = p.id),
        '[]'::json
    ) AS images,
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', pu.id,
            'unit_name', pu.unit_number_or_name,
            'unit_type', pu.unit_type,
            'bedrooms', pu.bedrooms,
            'bathrooms', pu.bathrooms,
            'rent_amount', pu.rent_amount,
            'currency_code', pu.currency_code,
            'rent_period', pu.rent_period,
            'available_quantity', pu.available_quantity,
            'status', pu.status
        ))
        FROM public.property_units pu WHERE pu.property_id = p.id AND pu.status = 'available'),
        '[]'::json
    ) AS available_units,
    (SELECT MIN(pu.rent_amount) FROM public.property_units pu WHERE pu.property_id = p.id AND pu.status = 'available') AS min_rent_amount,
    (SELECT MAX(pu.bedrooms) FROM public.property_units pu WHERE pu.property_id = p.id) AS max_bedrooms,
    (SELECT MAX(pu.bathrooms) FROM public.property_units pu WHERE pu.property_id = p.id) AS max_bathrooms
FROM public.properties p
JOIN public.countries c ON p.country_code = c.code
JOIN public.states_provinces s ON p.state_id = s.id
JOIN public.cities ct ON p.city_id = ct.id
LEFT JOIN public.neighborhoods n ON p.neighborhood_id = n.id
WHERE p.status = 'approved'
  AND (
      p.is_admin_direct = TRUE
      OR EXISTS (
          SELECT 1 
          FROM public.provider_listing_periods plp
          WHERE plp.provider_id = p.provider_id
            AND plp.status = 'active'
            AND (plp.expires_at + (plp.grace_period_hours || ' hours')::INTERVAL) > NOW()
      )
  );
```

---

## 8. Build Progress & Implementation Roadmap

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                FEATURE IMPLEMENTATION ROADMAP                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

  PHASE 1: FOUNDATION, DESIGN SYSTEM & TOKENS [COMPLETED SPECIFICATION]
  ├── [x] Design token extraction from Board 1–5 & Logo
  ├── [x] Global design system definitions (Colors, Typography, Elevators, Radii)
  ├── [x] Mobile-first layout architecture and responsive wireframe shells
  └── [x] Multi-currency and worldwide geographic data mapping

  PHASE 2: RELATIONAL DATABASE & SECURITY VAULT [COMPLETED SPECIFICATION]
  ├── [x] 21 normalized PostgreSQL tables schema definition
  ├── [x] Custom Enums, CHECK constraints, and Foreign Key cascades
  ├── [x] Automated Public Visibility View with active listing expiration + 48h grace checks
  ├── [x] RLS security policies & Private Storage Vault boundaries
  └── [x] Early renewal calculation database trigger function

  PHASE 3: BOARD 1 — PUBLIC MARKETPLACE & FRICTIONLESS APPLICATION
  ├── [ ] Next.js + TypeScript Mobile-First Shell with Header & Navigation
  ├── [ ] Filterable Property Explorer with sticky filter bar & map/grid toggle
  ├── [ ] Property Details Screen with 12-image gallery, unit cards & amenities chips
  ├── [ ] Frictionless 6-Step Multi-Stage Application Wizard with account auto-linking
  └── [ ] Application Success Screen & Reference Code generator

  PHASE 4: BOARD 2 — APPLICANT PORTAL
  ├── [ ] Applicant Auth (Login / Register / Social Auth)
  ├── [ ] Tenant Dashboard with active application overview cards
  ├── [ ] 4-Stage Application Progress Timeline tracker
  ├── [ ] Secure Document Upload Vault (PDF/Image dropzone & previews)
  └── [ ] In-App Messaging & Inquiry Inbox

  PHASE 5: BOARD 3 — PROPERTY PROVIDER PORTAL
  ├── [ ] Provider Registration & Business Profile setup
  ├── [ ] Dynamic Listing Plan Selection (Rendered from Admin plans)
  ├── [ ] Payment Instructions Desk & Pure Proof of Payment Uploader
  ├── [ ] Provider Executive Dashboard (Active Countdown badge, 48h grace & stats)
  ├── [ ] 6-Step Add Property Wizard (Multi-Unit pricing & amenity picker)
  └── [ ] Property Verification Feedback & Rejection Redo Center

  PHASE 6: BOARD 4 — SUPER ADMIN COMMAND CENTER
  ├── [ ] Secure Admin Portal & Action-Driven Executive Overview
  ├── [ ] Global Property Review Suite (Inspection modal, Approve / Reject with reasons)
  ├── [ ] Provider Listing Payment Verification Desk (Instant entitlement activator)
  ├── [ ] Applicant File & Credibility Review Center
  ├── [ ] Admin Direct Property Publisher (First-party Blue Sky inventory)
  ├── [ ] Dynamic Unlimited Listing Plans Manager (CRUD for days, price, currency)
  └── [ ] Automated FAQ Keyword Engine & Immutable Audit Ledger

  PHASE 7: BOARD 5 & SYSTEM SUPPORTING SCREENS
  ├── [ ] Global Notification Feed & Multi-Stage Expiry Alerts (14d, 7d, 3d, 1d)
  ├── [ ] Searchable Help Center & FAQ Directory
  ├── [ ] User Profile & Notification Preference Settings
  ├── [ ] Comprehensive System States (Empty states, Skeletons, Errors, Date Picker Sheet)
  └── [ ] End-to-End Testing, Security Hardening & Production Deployment
```
