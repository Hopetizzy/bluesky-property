-- ============================================================================
-- BLUE SKY PROPERTY MANAGEMENT - SQL MIGRATION 12 (FIXED FOR DEPENDENT VIEWS)
-- 1. Drop dependent view
-- 2. Alter column property_type to flexible VARCHAR(50)
-- 3. Update demo properties: Vancouver to 'apartment', Anchorage to 'house'
-- 4. Recreate dependent view v_public_active_properties with full permissions
-- ============================================================================

-- Step 1: Temporarily drop dependent view
DROP VIEW IF EXISTS public.v_public_active_properties CASCADE;

-- Step 2: Alter column type to VARCHAR(50) to allow flexible dynamic property types without enum locks
ALTER TABLE IF EXISTS public.properties 
    ALTER COLUMN property_type TYPE VARCHAR(50) USING property_type::VARCHAR;

ALTER TABLE IF EXISTS public.properties 
    ALTER COLUMN property_type SET DEFAULT 'apartment';

-- Step 3: Update Prop 4 (Vancouver) to Apartment
UPDATE public.properties
SET 
    title = '1 Bedroom Waterfront Apartment',
    slug = '1-bedroom-waterfront-apartment-vancouver-bc',
    description = 'Stunning water and mountain views from this contemporary 1-bedroom apartment in Coal Harbour. Includes dedicated parking space, storage locker, and bicycle room.',
    property_type = 'apartment'
WHERE id = '20000001-0000-0000-0000-000000000004';

-- Step 4: Update Prop 6 (Anchorage) to House
UPDATE public.properties
SET 
    title = 'Luxury Mountain View Executive House',
    slug = 'luxury-mountain-view-executive-house-anchorage-ak',
    description = 'Prestigious executive residence in Downtown Anchorage with uninterrupted Chugach mountain and Cook Inlet views. Features floor-to-ceiling double-glazed glass, chef kitchen, smart climate control, and heated indoor garage.',
    property_type = 'house'
WHERE id = '20000001-0000-0000-0000-000000000006';

-- Step 5: Update Prop 6 Unit Configuration
UPDATE public.property_units
SET 
    unit_number_or_name = 'Main Executive Residence',
    unit_type = 'entire_house',
    description = 'Multi-level luxury home with wrap-around deck and panoramic mountain views.'
WHERE property_id = '20000001-0000-0000-0000-000000000006';

-- Step 6: Recreate the public active properties view
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

-- Step 7: Re-grant permissions
GRANT SELECT ON public.v_public_active_properties TO anon, authenticated;
