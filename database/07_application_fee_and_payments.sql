-- ============================================================================
-- BLUE SKY PROPERTY MANAGEMENT - APPLICATION FEE & TENANT PAYMENTS SCHEMA
-- Migration: 07_application_fee_and_payments.sql
-- ============================================================================

-- 1. System Settings Table (Admin Application Fee & Platform Configuration)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Application Fee Settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('application_fee', '{"is_enabled": true, "amount": 50.00, "currency_code": "USD"}'::jsonb, 'Tenant rental application background check and verification fee')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- 2. Tenant Application Payments Table
CREATE TABLE IF NOT EXISTS public.application_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.rental_applications(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    payment_method_id UUID REFERENCES public.payment_methods(id),
    payment_method_name VARCHAR(100),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    proof_storage_path TEXT NOT NULL,
    proof_file_name VARCHAR(255),
    status payment_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_application_payments_app ON public.application_payments(application_id);
CREATE INDEX IF NOT EXISTS idx_application_payments_applicant ON public.application_payments(applicant_id);
CREATE INDEX IF NOT EXISTS idx_application_payments_status ON public.application_payments(status);

-- Enable RLS and Permissive Policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read system_settings"
    ON public.system_settings FOR SELECT
    TO anon, authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow admin manage system_settings"
    ON public.system_settings FOR ALL
    TO anon, authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all application_payments access"
    ON public.application_payments FOR ALL
    TO anon, authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
