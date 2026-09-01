-- ============================================================================
-- BLUE SKY PROPERTY: Migration 09 - Allow Deletion of Plans & Payment Methods
-- Allows deleting unused or archived plans and payment methods without foreign key constraint violations
-- ============================================================================

-- 1. provider_payments -> payment_methods
ALTER TABLE IF EXISTS public.provider_payments
    ALTER COLUMN payment_method_id DROP NOT NULL;

ALTER TABLE IF EXISTS public.provider_payments
    DROP CONSTRAINT IF EXISTS provider_payments_payment_method_id_fkey;

ALTER TABLE IF EXISTS public.provider_payments
    ADD CONSTRAINT provider_payments_payment_method_id_fkey
    FOREIGN KEY (payment_method_id)
    REFERENCES public.payment_methods(id)
    ON DELETE SET NULL;

-- 2. provider_payments -> listing_plans
ALTER TABLE IF EXISTS public.provider_payments
    ALTER COLUMN listing_plan_id DROP NOT NULL;

ALTER TABLE IF EXISTS public.provider_payments
    DROP CONSTRAINT IF EXISTS provider_payments_listing_plan_id_fkey;

ALTER TABLE IF EXISTS public.provider_payments
    ADD CONSTRAINT provider_payments_listing_plan_id_fkey
    FOREIGN KEY (listing_plan_id)
    REFERENCES public.listing_plans(id)
    ON DELETE SET NULL;

-- 3. provider_listing_periods -> listing_plans
ALTER TABLE IF EXISTS public.provider_listing_periods
    ALTER COLUMN listing_plan_id DROP NOT NULL;

ALTER TABLE IF EXISTS public.provider_listing_periods
    DROP CONSTRAINT IF EXISTS provider_listing_periods_listing_plan_id_fkey;

ALTER TABLE IF EXISTS public.provider_listing_periods
    ADD CONSTRAINT provider_listing_periods_listing_plan_id_fkey
    FOREIGN KEY (listing_plan_id)
    REFERENCES public.listing_plans(id)
    ON DELETE SET NULL;
