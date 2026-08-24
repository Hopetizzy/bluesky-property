-- ============================================================================
-- BLUE SKY PROPERTY MANAGEMENT PLATFORM - ROW LEVEL SECURITY (RLS) POLICIES
-- Target: PostgreSQL / Supabase
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_listing_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE (auth_user_id = auth.uid() OR id = auth.uid())
          AND role = 'admin'
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get the current user's profile ID
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    SELECT id INTO v_profile_id
    FROM public.profiles
    WHERE auth_user_id = auth.uid() OR id = auth.uid()
    LIMIT 1;

    RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's provider profile ID
CREATE OR REPLACE FUNCTION public.current_provider_id()
RETURNS UUID AS $$
DECLARE
    v_provider_id UUID;
BEGIN
    SELECT pp.id INTO v_provider_id
    FROM public.provider_profiles pp
    JOIN public.profiles p ON pp.profile_id = p.id
    WHERE p.auth_user_id = auth.uid() OR p.id = auth.uid()
    LIMIT 1;

    RETURN v_provider_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 1. PROFILES POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = auth_user_id OR auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = auth_user_id OR auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins have full access to profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public profile registration"
    ON public.profiles FOR INSERT
    WITH CHECK (TRUE);

-- ============================================================================
-- 2. PROVIDER PROFILES POLICIES
-- ============================================================================
CREATE POLICY "Providers can view their own provider profile"
    ON public.provider_profiles FOR SELECT
    USING (profile_id = public.current_profile_id() OR public.is_admin());

CREATE POLICY "Providers can update their own provider profile"
    ON public.provider_profiles FOR UPDATE
    USING (profile_id = public.current_profile_id() OR public.is_admin());

CREATE POLICY "Providers can create their provider profile"
    ON public.provider_profiles FOR INSERT
    WITH CHECK (profile_id = public.current_profile_id() OR public.is_admin());

CREATE POLICY "Admins have full access to provider profiles"
    ON public.provider_profiles FOR ALL
    USING (public.is_admin());

-- ============================================================================
-- 3. LISTING PLANS & PAYMENT METHODS (Public Read, Admin Write)
-- ============================================================================
CREATE POLICY "Anyone can view active listing plans"
    ON public.listing_plans FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage listing plans"
    ON public.listing_plans FOR ALL
    USING (public.is_admin());

CREATE POLICY "Anyone can view active payment methods"
    ON public.payment_methods FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage payment methods"
    ON public.payment_methods FOR ALL
    USING (public.is_admin());

-- ============================================================================
-- 4. PROVIDER PAYMENTS & LISTING PERIODS
-- ============================================================================
CREATE POLICY "Providers can view their own payments"
    ON public.provider_payments FOR SELECT
    USING (provider_id = public.current_provider_id() OR public.is_admin());

CREATE POLICY "Providers can submit payments"
    ON public.provider_payments FOR INSERT
    WITH CHECK (provider_id = public.current_provider_id() OR public.is_admin());

CREATE POLICY "Admins can manage all payments"
    ON public.provider_payments FOR ALL
    USING (public.is_admin());

CREATE POLICY "Providers can view their listing periods"
    ON public.provider_listing_periods FOR SELECT
    USING (provider_id = public.current_provider_id() OR public.is_admin());

CREATE POLICY "Admins can manage listing periods"
    ON public.provider_listing_periods FOR ALL
    USING (public.is_admin());

-- ============================================================================
-- 5. PROPERTIES & UNITS (Public Active, Provider Own, Admin All)
-- ============================================================================
CREATE POLICY "Public can view approved active properties"
    ON public.properties FOR SELECT
    USING (
        status = 'approved' OR
        provider_id = public.current_provider_id() OR
        public.is_admin()
    );

CREATE POLICY "Providers can insert their properties"
    ON public.properties FOR INSERT
    WITH CHECK (
        (provider_id = public.current_provider_id() AND is_admin_direct = FALSE) OR
        public.is_admin()
    );

CREATE POLICY "Providers can update their properties"
    ON public.properties FOR UPDATE
    USING (provider_id = public.current_provider_id() OR public.is_admin());

CREATE POLICY "Providers can delete their draft properties"
    ON public.properties FOR DELETE
    USING ((provider_id = public.current_provider_id() AND status = 'draft') OR public.is_admin());

CREATE POLICY "Admins have full access to properties"
    ON public.properties FOR ALL
    USING (public.is_admin());

-- Property Units
CREATE POLICY "Anyone can view units of viewable properties"
    ON public.property_units FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = property_units.property_id
              AND (p.status = 'approved' OR p.provider_id = public.current_provider_id() OR public.is_admin())
        )
    );

CREATE POLICY "Providers can manage units for their properties"
    ON public.property_units FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = property_units.property_id
              AND (p.provider_id = public.current_provider_id() OR public.is_admin())
        )
    );

-- Property Images
CREATE POLICY "Anyone can view property images"
    ON public.property_images FOR SELECT
    USING (TRUE);

CREATE POLICY "Providers can manage images for their properties"
    ON public.property_images FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = property_images.property_id
              AND (p.provider_id = public.current_provider_id() OR public.is_admin())
        )
    );

-- Amenities
CREATE POLICY "Anyone can view amenities"
    ON public.amenities FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage amenities"
    ON public.amenities FOR ALL
    USING (public.is_admin());

CREATE POLICY "Anyone can view property amenities"
    ON public.property_amenities FOR SELECT
    USING (TRUE);

CREATE POLICY "Providers and admins can link amenities"
    ON public.property_amenities FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = property_amenities.property_id
              AND (p.provider_id = public.current_provider_id() OR public.is_admin())
        )
    );

-- ============================================================================
-- 6. RENTAL APPLICATIONS & DOCUMENT VAULT (Strict Privacy)
-- ============================================================================
CREATE POLICY "Applicants can view their own applications"
    ON public.rental_applications FOR SELECT
    USING (applicant_id = public.current_profile_id() OR public.is_admin());

CREATE POLICY "Applicants can create applications"
    ON public.rental_applications FOR INSERT
    WITH CHECK (applicant_id = public.current_profile_id() OR public.is_admin());

CREATE POLICY "Admins can manage all applications"
    ON public.rental_applications FOR ALL
    USING (public.is_admin());

-- Application Documents Vault
CREATE POLICY "Applicants can view their own vault documents"
    ON public.application_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.rental_applications ra
            WHERE ra.id = application_documents.application_id
              AND (ra.applicant_id = public.current_profile_id() OR public.is_admin())
        )
    );

CREATE POLICY "Applicants can upload vault documents"
    ON public.application_documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.rental_applications ra
            WHERE ra.id = application_documents.application_id
              AND (ra.applicant_id = public.current_profile_id() OR public.is_admin())
        )
    );

CREATE POLICY "Admins can manage all application documents"
    ON public.application_documents FOR ALL
    USING (public.is_admin());

-- ============================================================================
-- 7. MESSAGING & NOTIFICATIONS
-- ============================================================================
CREATE POLICY "Users can view their conversations"
    ON public.conversations FOR SELECT
    USING (applicant_id = public.current_profile_id() OR public.is_admin());

CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (applicant_id = public.current_profile_id() OR public.is_admin());

CREATE POLICY "Users can view messages in their conversations"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
              AND (c.applicant_id = public.current_profile_id() OR public.is_admin())
        )
    );

CREATE POLICY "Users can send messages in their conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
              AND (c.applicant_id = public.current_profile_id() OR public.is_admin())
        )
    );

-- FAQs
CREATE POLICY "Anyone can view active FAQs"
    ON public.faqs FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage FAQs"
    ON public.faqs FOR ALL
    USING (public.is_admin());

CREATE POLICY "Anyone can view FAQ keywords"
    ON public.faq_keywords FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage FAQ keywords"
    ON public.faq_keywords FOR ALL
    USING (public.is_admin());

-- Notifications
CREATE POLICY "Users can view and update their notifications"
    ON public.notifications FOR ALL
    USING (profile_id = public.current_profile_id() OR public.is_admin());

-- Saved Favorites
CREATE POLICY "Users can manage their saved favorites"
    ON public.saved_favorites FOR ALL
    USING (profile_id = public.current_profile_id() OR public.is_admin());

-- Activity Logs
CREATE POLICY "Admins can view activity logs"
    ON public.activity_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "System can record activity logs"
    ON public.activity_logs FOR INSERT
    WITH CHECK (TRUE);
