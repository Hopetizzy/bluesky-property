-- ============================================================================
-- BLUE SKY PROPERTY MANAGEMENT - SQL MIGRATION 11
-- Migrate Properties & Applications to Approved USA (7 States) & Canada (2 Provinces)
-- USA: North Carolina, Oklahoma, Georgia, Alaska, New Hampshire, Maine, Kentucky
-- Canada: Ontario, British Columbia
-- ============================================================================

-- 1. Prop 1: Update to Atlanta, Georgia, USA
UPDATE public.properties
SET 
    country_code = 'USA',
    country_name = 'United States',
    state_province = 'Georgia',
    city = 'Atlanta',
    neighborhood = 'Midtown / Buckhead',
    street_address = '950 Peachtree St NE',
    postal_code = '30309',
    slug = '2-bedroom-modern-apartment-atlanta-ga'
WHERE id = '20000001-0000-0000-0000-000000000001';

-- 2. Prop 2: Update to Toronto, Ontario, Canada
UPDATE public.properties
SET 
    country_code = 'CAN',
    country_name = 'Canada',
    state_province = 'Ontario',
    city = 'Toronto',
    slug = 'luxury-studio-apartment-toronto-on'
WHERE id = '20000001-0000-0000-0000-000000000002';

-- 3. Prop 3: Update to Louisville, Kentucky, USA
UPDATE public.properties
SET 
    title = '3 Bedroom Victorian Townhouse',
    slug = '3-bedroom-victorian-townhouse-louisville-ky',
    description = 'Elegant three-bedroom Victorian home located in a quiet tree-lined street in Old Louisville. High ceilings, original fireplaces, private rear garden, and newly renovated chef kitchen.',
    country_code = 'USA',
    country_name = 'United States',
    state_province = 'Kentucky',
    city = 'Louisville',
    neighborhood = 'Old Louisville',
    street_address = '1412 S 4th Street',
    postal_code = '40208'
WHERE id = '20000001-0000-0000-0000-000000000003';

UPDATE public.property_units
SET 
    currency_code = 'USD',
    rent_amount = 3400.00,
    security_deposit = 3400.00
WHERE property_id = '20000001-0000-0000-0000-000000000003';

-- 4. Prop 4: Update to Vancouver, British Columbia, Canada
UPDATE public.properties
SET 
    slug = '1-bedroom-waterfront-condo-vancouver-bc',
    country_code = 'CAN',
    country_name = 'Canada',
    state_province = 'British Columbia',
    city = 'Vancouver'
WHERE id = '20000001-0000-0000-0000-000000000004';

-- 5. Prop 5: Update to Charlotte, North Carolina, USA
UPDATE public.properties
SET 
    title = '2 Bedroom Modern Duplex',
    slug = '2-bedroom-modern-duplex-charlotte-nc',
    description = 'Newly constructed Charlotte duplex with fenced yard, EV charging, polished concrete floors, and smart home automation in vibrant South End.',
    country_code = 'USA',
    country_name = 'United States',
    state_province = 'North Carolina',
    city = 'Charlotte',
    neighborhood = 'South End / Uptown',
    street_address = '1904 South Blvd',
    postal_code = '28203'
WHERE id = '20000001-0000-0000-0000-000000000005';

-- 6. Prop 6: Update to Anchorage, Alaska, USA
UPDATE public.properties
SET 
    title = 'Luxury Panoramic Mountain Penthouse',
    slug = 'luxury-panoramic-mountain-penthouse-anchorage-ak',
    description = 'Prestigious panoramic penthouse in Downtown Anchorage with uninterrupted Chugach mountain and Cook Inlet views. Features floor-to-ceiling double-glazed glass, marble chef kitchen, smart climate control, and heated indoor parking.',
    country_code = 'USA',
    country_name = 'United States',
    state_province = 'Alaska',
    city = 'Anchorage',
    neighborhood = 'Downtown / Inlet View',
    street_address = '450 W 5th Avenue',
    postal_code = '99501'
WHERE id = '20000001-0000-0000-0000-000000000006';

UPDATE public.property_units
SET 
    unit_number_or_name = 'Penthouse East',
    currency_code = 'USD',
    rent_amount = 4800.00,
    security_deposit = 4800.00,
    description = 'Top floor exclusive suite with wrap-around deck and panoramic views.'
WHERE property_id = '20000001-0000-0000-0000-000000000006';

-- 7. Update Demo Rental Applications
UPDATE public.rental_applications
SET 
    applicant_address = '950 Peachtree St NE, Apt 12B, Atlanta, GA 30309'
WHERE applicant_email = 'john.doe@example.com';
