-- ============================================================================
-- BLUE SKY PROPERTY MANAGEMENT - SQL MIGRATION 08
-- Fix Admin RLS, Ensure system_settings Table & Public Read Configuration
-- ============================================================================

-- 1. System Settings Table (Dynamic Application Fee & Configuration)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Application Fee Settings (Active by Default)
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('application_fee', '{"is_enabled": true, "amount": 50.00, "currency_code": "USD"}'::jsonb, 'Tenant rental application background check and verification fee')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

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

-- Enable Public Read for Active Plans & Payment Methods
DO $$ BEGIN
    CREATE POLICY "Allow public read listing_plans"
    ON public.listing_plans FOR SELECT
    TO anon, authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read payment_methods"
    ON public.payment_methods FOR SELECT
    TO anon, authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
