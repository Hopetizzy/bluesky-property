-- ============================================================================
-- BLUE SKY PROPERTY MANAGEMENT - SQL MIGRATION 10
-- Add SSN to rental_applications & Seed Dynamic Site Configuration in system_settings
-- ============================================================================

-- 1. Add applicant_ssn to rental_applications if not exists
ALTER TABLE IF EXISTS public.rental_applications
    ADD COLUMN IF NOT EXISTS applicant_ssn VARCHAR(30);

-- 2. Seed Dynamic Brand Support Contacts & Social Links in system_settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
    (
        'site_config',
        '{
            "support_email": "support@blueskyproperty.com",
            "support_phone": "+1 (800) 555-0199",
            "office_address": "9454 Wilshire Blvd, Suite 600, Beverly Hills, CA 90212",
            "facebook_url": "https://facebook.com/blueskyproperty",
            "twitter_url": "https://twitter.com/blueskyprop",
            "instagram_url": "https://instagram.com/blueskyproperty",
            "linkedin_url": "https://linkedin.com/company/blueskyproperty",
            "youtube_url": "https://youtube.com/@blueskyproperty"
        }'::jsonb,
        'Global Brand support contact information and social media links displayed on site footer'
    )
ON CONFLICT (key) DO NOTHING;
