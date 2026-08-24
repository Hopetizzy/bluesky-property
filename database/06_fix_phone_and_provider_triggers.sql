-- ============================================================================
-- BLUE SKY PROPERTY - HOTFIX FOR PHONE NUMBER & PROVIDER REGISTRATION
-- Run this in Supabase SQL Editor to update triggers and permissions
-- ============================================================================

-- 1. Update the Auth User Created Trigger to extract phone numbers reliably
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

-- 2. Ensure Trigger is Bound on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. Ensure Table Permissions are active
GRANT ALL ON TABLE public.profiles TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.provider_profiles TO authenticated, anon, service_role;
