-- ============================================================================
-- BLUE SKY PROPERTY MANAGEMENT PLATFORM - STORAGE BUCKETS & SECURITY
-- Target: Supabase Storage / S3
-- ============================================================================

-- Create Supabase Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('property-images', 'property-images', TRUE, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
    ('applicant-vault', 'applicant-vault', FALSE, 20971520, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
    ('payment-proofs-vault', 'payment-proofs-vault', FALSE, 15728640, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
    ('provider-documents', 'provider-documents', FALSE, 20971520, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- 1. Property Images (Public View, Provider / Admin Upload)
CREATE POLICY "Public Read Property Images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated Upload Property Images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'property-images' 
        AND (auth.role() = 'authenticated' OR public.is_admin())
    );

CREATE POLICY "Manage Property Images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'property-images'
        AND (auth.uid() = owner OR public.is_admin())
    );

-- 2. Applicant Vault (Strict Private Access)
CREATE POLICY "Applicant and Admin Read Vault Documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'applicant-vault'
        AND (auth.uid() = owner OR public.is_admin())
    );

CREATE POLICY "Applicant and Admin Upload Vault Documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'applicant-vault'
        AND (auth.role() = 'authenticated' OR public.is_admin())
    );

-- 3. Payment Proofs Vault (Private Provider & Admin Access)
CREATE POLICY "Provider and Admin Read Payment Proofs"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'payment-proofs-vault'
        AND (auth.uid() = owner OR public.is_admin())
    );

CREATE POLICY "Provider Upload Payment Proofs"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'payment-proofs-vault'
        AND (auth.role() = 'authenticated' OR public.is_admin())
    );
