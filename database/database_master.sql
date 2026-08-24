-- ============================================================================
-- BLUE SKY PROPERTY MANAGEMENT PLATFORM - MASTER DATABASE INSTALLATION SCRIPT
-- Version: 2.1.0 (Worldwide Scope: USA, Canada, UK, Australia, Europe)
-- Description: Complete consolidated script containing Schema, RLS, Storage,
--              Production Seed Data, Triggers & Automated Functions.
-- ============================================================================

BEGIN;

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: CUSTOM ENUMS
-- ============================================================================

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('applicant', 'provider', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deactivated'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE provider_type AS ENUM ('owner', 'agent', 'property_manager', 'brokerage', 'company'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE property_type AS ENUM ('apartment', 'single_family_house', 'townhouse', 'condo', 'duplex', 'studio', 'penthouse', 'commercial', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE property_status AS ENUM ('draft', 'pending_verification', 'approved', 'rejected', 'suspended', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE unit_type AS ENUM ('studio', 'one_bedroom', 'two_bedroom', 'three_bedroom', 'four_plus_bedroom', 'penthouse', 'entire_house', 'room'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE rent_period AS ENUM ('monthly', 'quarterly', 'semi_annual', 'annual'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE unit_status AS ENUM ('available', 'under_application', 'leased', 'unavailable'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE application_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE document_type AS ENUM ('passport', 'drivers_license', 'state_id', 'national_id', 'proof_of_income', 'employment_letter', 'utility_bill_address', 'tax_return', 'bank_statement', 'credit_report', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE document_status AS ENUM ('pending', 'verified', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE listing_period_status AS ENUM ('pending', 'active', 'expired', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_method_type AS ENUM ('bank_wire', 'ach_transfer', 'paypal', 'zelle', 'interac_etransfer', 'cashiers_check', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- SECTION 2: TABLES (21 Entities)
-- ============================================================================

-- Table 1: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'applicant',
    status user_status NOT NULL DEFAULT 'active',
    avatar_url TEXT,
    country_code VARCHAR(3) NOT NULL DEFAULT 'USA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: provider_profiles
CREATE TABLE IF NOT EXISTS public.provider_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_type provider_type NOT NULL DEFAULT 'owner',
    company_name VARCHAR(255),
    license_number VARCHAR(100),
    business_phone VARCHAR(50) NOT NULL,
    business_address TEXT,
    country_code VARCHAR(3) NOT NULL DEFAULT 'USA',
    verification_status verification_status NOT NULL DEFAULT 'unverified',
    verification_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_provider_profile_profile_id UNIQUE (profile_id)
);

-- Table 3: listing_plans
CREATE TABLE IF NOT EXISTS public.listing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 4: payment_methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type payment_method_type NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    instructions TEXT NOT NULL,
    account_name VARCHAR(255),
    account_number VARCHAR(100),
    routing_or_swift VARCHAR(100),
    bank_name VARCHAR(255),
    paypal_email VARCHAR(255),
    zelle_identifier VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 5: provider_payments
CREATE TABLE IF NOT EXISTS public.provider_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
    listing_plan_id UUID NOT NULL REFERENCES public.listing_plans(id),
    payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
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

-- Table 6: provider_listing_periods
CREATE TABLE IF NOT EXISTS public.provider_listing_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
    listing_plan_id UUID NOT NULL REFERENCES public.listing_plans(id),
    payment_id UUID REFERENCES public.provider_payments(id),
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    grace_period_hours INTEGER NOT NULL DEFAULT 48,
    status listing_period_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 7: properties
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.provider_profiles(id) ON DELETE SET NULL,
    is_admin_direct BOOLEAN NOT NULL DEFAULT FALSE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    property_type property_type NOT NULL DEFAULT 'apartment',
    country_code VARCHAR(3) NOT NULL DEFAULT 'USA',
    country_name VARCHAR(100) NOT NULL DEFAULT 'United States',
    state_province VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100),
    street_address VARCHAR(255) NOT NULL,
    postal_code VARCHAR(30),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    status property_status NOT NULL DEFAULT 'pending_verification',
    verification_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    published_at TIMESTAMPTZ,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_property_ownership CHECK (
        (is_admin_direct = TRUE AND provider_id IS NULL) OR
        (is_admin_direct = FALSE AND provider_id IS NOT NULL) OR
        (is_admin_direct = TRUE AND provider_id IS NOT NULL)
    )
);

-- Table 8: property_units
CREATE TABLE IF NOT EXISTS public.property_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_number_or_name VARCHAR(100) NOT NULL,
    unit_type unit_type NOT NULL DEFAULT 'one_bedroom',
    bedrooms INTEGER NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
    bathrooms NUMERIC(3, 1) NOT NULL DEFAULT 1 CHECK (bathrooms >= 0),
    square_feet NUMERIC(10, 2),
    rent_amount NUMERIC(12, 2) NOT NULL CHECK (rent_amount >= 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    security_deposit NUMERIC(12, 2) CHECK (security_deposit >= 0),
    rent_period rent_period NOT NULL DEFAULT 'monthly',
    available_quantity INTEGER NOT NULL DEFAULT 1 CHECK (available_quantity >= 0),
    status unit_status NOT NULL DEFAULT 'available',
    available_from DATE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 9: property_images
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    caption VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 10: amenities
CREATE TABLE IF NOT EXISTS public.amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    icon_name VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 11: property_amenities
CREATE TABLE IF NOT EXISTS public.property_amenities (
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (property_id, amenity_id)
);

-- Table 12: rental_applications
CREATE TABLE IF NOT EXISTS public.rental_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_ref VARCHAR(20) NOT NULL UNIQUE,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.property_units(id) ON DELETE CASCADE,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(50) NOT NULL,
    applicant_dob DATE,
    applicant_nationality VARCHAR(100),
    applicant_address TEXT,
    applicant_employer VARCHAR(255),
    applicant_occupation VARCHAR(255),
    applicant_income NUMERIC(12, 2) CHECK (applicant_income >= 0),
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
    reviewed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 13: application_documents
CREATE TABLE IF NOT EXISTS public.application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.rental_applications(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    status document_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 14: application_status_history
CREATE TABLE IF NOT EXISTS public.application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.rental_applications(id) ON DELETE CASCADE,
    previous_status application_status,
    new_status application_status NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 15: conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 16: messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_automated BOOLEAN NOT NULL DEFAULT FALSE,
    message_body TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 17: faqs
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    priority INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 18: faq_keywords
CREATE TABLE IF NOT EXISTS public.faq_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faq_id UUID NOT NULL REFERENCES public.faqs(id) ON DELETE CASCADE,
    keyword VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_faq_keyword UNIQUE (faq_id, keyword)
);

-- Table 19: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 20: saved_favorites
CREATE TABLE IF NOT EXISTS public.saved_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_profile_property_favorite UNIQUE (profile_id, property_id)
);

-- Table 21: activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: VIEWS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE VIEW public.v_public_active_properties AS
SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    p.property_type,
    p.country_code,
    p.country_name,
    p.state_province,
    p.city,
    p.neighborhood,
    p.street_address,
    p.postal_code,
    p.latitude,
    p.longitude,
    p.featured,
    p.published_at,
    p.is_admin_direct,
    p.provider_id,
    COALESCE(prov.company_name, prof.full_name, 'Blue Sky Direct Property') AS provider_display_name
FROM public.properties p
LEFT JOIN public.provider_profiles prov ON p.provider_id = prov.id
LEFT JOIN public.profiles prof ON prov.profile_id = prof.id
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

CREATE OR REPLACE FUNCTION public.activate_provider_listing_period(
    p_provider_id UUID,
    p_listing_plan_id UUID,
    p_payment_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_duration_days INTEGER;
    v_latest_expiry TIMESTAMPTZ;
    v_starts_at TIMESTAMPTZ;
    v_expires_at TIMESTAMPTZ;
    v_new_period_id UUID;
BEGIN
    SELECT duration_days INTO v_duration_days
    FROM public.listing_plans
    WHERE id = p_listing_plan_id;

    IF v_duration_days IS NULL THEN
        RAISE EXCEPTION 'Listing plan not found: %', p_listing_plan_id;
    END IF;

    SELECT MAX(expires_at) INTO v_latest_expiry
    FROM public.provider_listing_periods
    WHERE provider_id = p_provider_id
      AND status = 'active'
      AND expires_at > NOW();

    IF v_latest_expiry IS NOT NULL THEN
        v_starts_at := v_latest_expiry;
        v_expires_at := v_latest_expiry + (v_duration_days || ' days')::INTERVAL;
    ELSE
        v_starts_at := NOW();
        v_expires_at := NOW() + (v_duration_days || ' days')::INTERVAL;
    END IF;

    INSERT INTO public.provider_listing_periods (
        provider_id,
        listing_plan_id,
        payment_id,
        starts_at,
        expires_at,
        grace_period_hours,
        status
    ) VALUES (
        p_provider_id,
        p_listing_plan_id,
        p_payment_id,
        v_starts_at,
        v_expires_at,
        48,
        'active'
    ) RETURNING id INTO v_new_period_id;

    UPDATE public.provider_profiles
    SET verification_status = 'verified'
    WHERE id = p_provider_id AND verification_status = 'unverified';

    RETURN v_new_period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
