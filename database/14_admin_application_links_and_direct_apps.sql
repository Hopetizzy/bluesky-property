-- ============================================================================
-- BLUE SKY PROPERTY MANAGEMENT - ADMIN APPLICATION LINKS & DIRECT APPLICATIONS
-- Migration: 14_admin_application_links_and_direct_apps.sql
-- ============================================================================

-- 1. Table: admin_application_links (Admin-Generated Application Portals)
CREATE TABLE IF NOT EXISTS public.admin_application_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL DEFAULT 'Direct Rental Application Portal',
    instructions TEXT,
    assigned_property_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    fee_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 50.00 CHECK (fee_amount >= 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: direct_rental_applications (Applications received via Admin Direct Link)
CREATE TABLE IF NOT EXISTS public.direct_rental_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID REFERENCES public.admin_application_links(id) ON DELETE SET NULL,
    application_ref VARCHAR(30) NOT NULL UNIQUE,
    applicant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.property_units(id) ON DELETE SET NULL,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(50) NOT NULL,
    applicant_dob DATE,
    applicant_nationality VARCHAR(100),
    applicant_address TEXT,
    applicant_employer VARCHAR(255),
    applicant_occupation VARCHAR(255),
    applicant_income NUMERIC(12, 2) CHECK (applicant_income >= 0),
    applicant_ssn VARCHAR(50),
    status application_status NOT NULL DEFAULT 'submitted',
    desired_move_in DATE NOT NULL,
    lease_term_months INTEGER NOT NULL DEFAULT 12 CHECK (lease_term_months > 0),
    occupants_count INTEGER NOT NULL DEFAULT 1 CHECK (occupants_count > 0),
    has_pets BOOLEAN NOT NULL DEFAULT FALSE,
    pets_description TEXT,
    additional_notes TEXT,
    admin_notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: direct_application_documents (Encrypted Supporting Documents Vault)
CREATE TABLE IF NOT EXISTS public.direct_application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    direct_application_id UUID NOT NULL REFERENCES public.direct_rental_applications(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    status document_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table: direct_application_payments (Application Fee Payment Receipts)
CREATE TABLE IF NOT EXISTS public.direct_application_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    direct_application_id UUID NOT NULL REFERENCES public.direct_rental_applications(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    payment_method_name VARCHAR(100),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    proof_storage_path TEXT NOT NULL,
    proof_file_name VARCHAR(255),
    status payment_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_app_links_token ON public.admin_application_links(token);
CREATE INDEX IF NOT EXISTS idx_direct_apps_link_id ON public.direct_rental_applications(link_id);
CREATE INDEX IF NOT EXISTS idx_direct_apps_applicant_id ON public.direct_rental_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_direct_apps_property_id ON public.direct_rental_applications(property_id);
CREATE INDEX IF NOT EXISTS idx_direct_apps_status ON public.direct_rental_applications(status);
CREATE INDEX IF NOT EXISTS idx_direct_app_docs_app ON public.direct_application_documents(direct_application_id);
CREATE INDEX IF NOT EXISTS idx_direct_app_payments_app ON public.direct_application_payments(direct_application_id);

-- Enable RLS
ALTER TABLE public.admin_application_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_rental_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_application_payments ENABLE ROW LEVEL SECURITY;

-- Permissive Policies for Web Operations
DO $$ BEGIN
    CREATE POLICY "Allow public read active admin_application_links"
    ON public.admin_application_links FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all admin_application_links access"
    ON public.admin_application_links FOR ALL
    TO anon, authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all direct_rental_applications access"
    ON public.direct_rental_applications FOR ALL
    TO anon, authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all direct_application_documents access"
    ON public.direct_application_documents FOR ALL
    TO anon, authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all direct_application_payments access"
    ON public.direct_application_payments FOR ALL
    TO anon, authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
