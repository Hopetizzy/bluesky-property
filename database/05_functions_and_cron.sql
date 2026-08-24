-- ============================================================================
-- BLUE SKY PROPERTY MANAGEMENT PLATFORM - AUTOMATED FUNCTIONS & CRON JOBS
-- Target: PostgreSQL / Supabase pg_cron / Edge Functions
-- ============================================================================

-- 1. Automatic Profile Provisioning on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        auth_user_id,
        email,
        phone,
        full_name,
        role,
        status,
        country_code
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'phoneNumber', NEW.raw_user_meta_data->>'phone_number', NEW.phone),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'applicant'::public.user_role),
        'active',
        COALESCE(NEW.raw_user_meta_data->>'country_code', 'USA')
    ) ON CONFLICT (email) DO UPDATE SET
        auth_user_id = EXCLUDED.auth_user_id,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        role = COALESCE(EXCLUDED.role, public.profiles.role),
        country_code = COALESCE(EXCLUDED.country_code, public.profiles.country_code),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (enabled when deployed to Supabase)
DO $$ BEGIN
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
EXCEPTION WHEN undefined_table THEN null;
WHEN duplicate_object THEN null; END $$;

-- 2. Automated Multi-Stage Expiration Notification Routine
CREATE OR REPLACE FUNCTION public.check_expiring_listing_periods()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    r RECORD;
BEGIN
    -- Check for periods expiring in 14 days, 7 days, 3 days, and 1 day
    FOR r IN (
        SELECT 
            plp.id,
            plp.provider_id,
            plp.expires_at,
            pp.profile_id,
            ROUND(EXTRACT(EPOCH FROM (plp.expires_at - NOW())) / 86400) AS days_left
        FROM public.provider_listing_periods plp
        JOIN public.provider_profiles pp ON plp.provider_id = pp.id
        WHERE plp.status = 'active'
          AND plp.expires_at > NOW()
          AND ROUND(EXTRACT(EPOCH FROM (plp.expires_at - NOW())) / 86400) IN (14, 7, 3, 1)
    ) LOOP
        -- Send notification if not already sent today
        INSERT INTO public.notifications (
            profile_id,
            type,
            title,
            message,
            link_url
        ) VALUES (
            r.profile_id,
            'listing_expiring',
            'Listing Access Expiring in ' || r.days_left || ' Days',
            'Your listing access expires on ' || to_char(r.expires_at, 'Mon DD, YYYY') || '. Renew now to keep your listings visible without disruption.',
            '/provider/plans'
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Automated Grace Period Expiration Cleanup Routine
CREATE OR REPLACE FUNCTION public.cleanup_expired_listing_periods()
RETURNS INTEGER AS $$
DECLARE
    v_updated INTEGER := 0;
BEGIN
    -- Mark status as 'expired' for periods past expires_at + grace_period_hours
    UPDATE public.provider_listing_periods
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'active'
      AND (expires_at + (grace_period_hours || ' hours')::INTERVAL) <= NOW();

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
