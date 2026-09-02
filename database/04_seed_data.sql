-- ============================================================================
-- BLUE SKY PROPERTY MANAGEMENT PLATFORM - PRODUCTION SEED DATA
-- Version: 2.1.0 (Worldwide Scope: USA, Canada, UK, Australia)
-- ============================================================================

-- 1. Standard Amenities Taxonomy
INSERT INTO public.amenities (id, name, category, icon_name) VALUES
    ('a0000001-0000-0000-0000-000000000001', 'Parking', 'building', 'Car'),
    ('a0000001-0000-0000-0000-000000000002', 'Security Concierge', 'security', 'ShieldCheck'),
    ('a0000001-0000-0000-0000-000000000003', 'Swimming Pool', 'leisure', 'Waves'),
    ('a0000001-0000-0000-0000-000000000004', 'Fitness Center', 'wellness', 'Dumbbell'),
    ('a0000001-0000-0000-0000-000000000005', 'In-unit Laundry', 'unit', 'Shirt'),
    ('a0000001-0000-0000-0000-000000000006', 'Central A/C', 'unit', 'AirVent'),
    ('a0000001-0000-0000-0000-000000000007', 'Pet Friendly', 'policy', 'Dog'),
    ('a0000001-0000-0000-0000-000000000008', 'Balcony', 'unit', 'Maximize'),
    ('a0000001-0000-0000-0000-000000000009', 'Private Garden', 'outdoor', 'Trees'),
    ('a0000001-0000-0000-0000-000000000010', 'High-speed Internet', 'utilities', 'Wifi'),
    ('a0000001-0000-0000-0000-000000000011', 'Elevator', 'building', 'ChevronsUp'),
    ('a0000001-0000-0000-0000-000000000012', 'EV Charging Station', 'sustainability', 'Zap')
ON CONFLICT (id) DO NOTHING;

-- 2. Dynamic Listing Plans (Created by Admin)
INSERT INTO public.listing_plans (id, name, description, price, currency_code, duration_days, is_popular, is_active, features) VALUES
    ('b0000001-0000-0000-0000-000000000030', '30 Days Listing Access', 'Standard single cycle access for short vacancies.', 49.00, 'USD', 30, FALSE, TRUE, '["Unlimited property listings", "Standard verification review", "Active for 30 days", "48-hour expiration grace window"]'::jsonb),
    ('b0000001-0000-0000-0000-000000000090', '90 Days Listing Access', 'Most popular choice for landlords and property managers.', 119.00, 'USD', 90, TRUE, TRUE, '["Unlimited property listings", "Priority verification review", "Multi-unit pricing support", "Active for 90 days", "48-hour expiration grace window"]'::jsonb),
    ('b0000001-0000-0000-0000-000000000180', '180 Days Listing Access', 'Ideal for growing portfolios and boutique real estate brokerages.', 199.00, 'USD', 180, FALSE, TRUE, '["Unlimited property listings", "Top priority verification", "Featured listing badges", "Dedicated account support", "Active for 180 days"]'::jsonb),
    ('b0000001-0000-0000-0000-000000000365', '365 Days Annual Platinum Access', 'Maximum value with full annual coverage and premium placement.', 349.00, 'USD', 365, FALSE, TRUE, '["Unlimited property listings", "Instant priority verification", "Top tier search prominence", "Dedicated account manager", "Active for 365 days"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. Payment Methods (Strictly 5 Formats: Chime, Cash App, Facebook Pay, Bitcoin, Interac E-Transfer Canada)
INSERT INTO public.payment_methods (id, name, type, currency_code, instructions, account_name, account_number, routing_or_swift, bank_name, is_active) VALUES
    ('c0000001-0000-0000-0000-000000000001', 'Chime Direct Transfer', 'chime', 'USD', 'Send transfer via Chime to $BlueSkyProperties or payments@blueskyproperty.com. Please include your provider business name in the memo.', 'Blue Sky Property Management LLC', '$BlueSkyProperties', NULL, 'Chime Bank (Bancorp / Stride)', TRUE),
    ('c0000001-0000-0000-0000-000000000002', 'Cash App', 'cash_app', 'USD', 'Send payment to official $Cashtag: $BlueSkyHomes. Include your property name or provider email in the note.', 'Blue Sky Property LLC', '$BlueSkyHomes', NULL, 'Cash App / Block Inc.', TRUE),
    ('c0000001-0000-0000-0000-000000000003', 'Facebook Pay / Meta Pay', 'facebook_pay', 'USD', 'Send payment through Facebook Messenger / Meta Pay to @blueskypayments. Mention your listing plan ID in the message.', 'Blue Sky Property Official', '@blueskypayments', NULL, 'Meta / Facebook Pay', TRUE),
    ('c0000001-0000-0000-0000-000000000004', 'Bitcoin (BTC Crypto)', 'bitcoin', 'USD', 'Send exact USD equivalent in BTC to the corporate cold-storage Bitcoin address. Upload the transaction hash or confirmation screenshot.', 'Blue Sky Corporate Vault', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'Bitcoin (BTC) Native SegWit', 'Bitcoin Blockchain Network', TRUE),
    ('c0000001-0000-0000-0000-000000000005', 'Interac e-Transfer (Canada 🇨🇦)', 'interac_etransfer', 'CAD', 'Send Interac e-Transfer to payments-ca@blueskyproperty.com with Auto-Deposit enabled. No password required.', 'Blue Sky Properties Canada Inc.', 'payments-ca@blueskyproperty.com', 'Auto-Deposit Enabled', 'Interac / Canadian Financial Institutions', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. Demo Profiles (Admin, Providers, Applicants)
INSERT INTO public.profiles (id, email, phone, full_name, role, status, country_code) VALUES
    ('d0000001-0000-0000-0000-000000000001', 'admin@blueskyproperty.com', '+1 (800) 555-0100', 'Super Admin Operations', 'admin', 'active', 'USA'),
    ('d0000001-0000-0000-0000-000000000002', 'helen@pacificheights.com', '+1 (415) 555-0188', 'Helen Williams', 'provider', 'active', 'USA'),
    ('d0000001-0000-0000-0000-000000000003', 'lettings@kensingtonres.co.uk', '+44 20 7946 0912', 'Edward Kensington', 'provider', 'active', 'GBR'),
    ('d0000001-0000-0000-0000-000000000004', 'contact@austinpremier.com', '+1 (512) 555-0133', 'Marcus Vance', 'provider', 'active', 'USA'),
    ('d0000001-0000-0000-0000-000000000005', 'john.doe@example.com', '+1 (213) 555-0199', 'John Doe', 'applicant', 'active', 'USA')
ON CONFLICT (id) DO NOTHING;

-- 5. Provider Profiles
INSERT INTO public.provider_profiles (id, profile_id, provider_type, company_name, license_number, business_phone, business_address, country_code, verification_status) VALUES
    ('e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 'brokerage', 'Pacific Heights Realty LLC', 'DRE #01928472', '+1 (415) 555-0188', '555 California St, Suite 2200, San Francisco, CA 94104', 'USA', 'verified'),
    ('e0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000003', 'agent', 'Kensington Residential UK', 'ARLA #884910', '+44 20 7946 0912', '12 Kensington High Street, London W8 4PT', 'GBR', 'verified'),
    ('e0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000004', 'property_manager', 'Austin Premier Properties', 'TREC #0582910', '+1 (512) 555-0133', '100 Congress Ave, Austin, TX 78701', 'USA', 'pending')
ON CONFLICT (id) DO NOTHING;

-- 6. Provider Payments & Listing Periods
INSERT INTO public.provider_payments (id, provider_id, listing_plan_id, payment_method_id, amount, currency_code, proof_storage_path, status, verified_at, verified_by) VALUES
    ('f0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000090', 'c0000001-0000-0000-0000-000000000001', 119.00, 'USD', 'receipts/wire_pacific_90d.pdf', 'verified', NOW() - INTERVAL '10 days', 'd0000001-0000-0000-0000-000000000001'),
    ('f0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000180', 'c0000001-0000-0000-0000-000000000001', 199.00, 'USD', 'receipts/wire_kensington_180d.pdf', 'verified', NOW() - INTERVAL '5 days', 'd0000001-0000-0000-0000-000000000001'),
    ('f0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000090', 'c0000001-0000-0000-0000-000000000003', 119.00, 'USD', 'receipts/zelle_austin_pending.png', 'pending', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.provider_listing_periods (id, provider_id, listing_plan_id, payment_id, starts_at, expires_at, grace_period_hours, status) VALUES
    ('10000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000090', 'f0000001-0000-0000-0000-000000000001', NOW() - INTERVAL '10 days', NOW() + INTERVAL '80 days', 48, 'active'),
    ('10000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000180', 'f0000001-0000-0000-0000-000000000002', NOW() - INTERVAL '5 days', NOW() + INTERVAL '175 days', 48, 'active')
ON CONFLICT (id) DO NOTHING;

-- 7. Worldwide Properties (USA & Canada Supported Regions)
-- Prop 1: Atlanta Apartment
INSERT INTO public.properties (id, provider_id, is_admin_direct, title, slug, description, property_type, country_code, country_name, state_province, city, neighborhood, street_address, postal_code, status, featured, published_at) VALUES
    ('20000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', FALSE, '2 Bedroom Modern Apartment', '2-bedroom-modern-apartment-atlanta-ga', 'Spacious 2 bedroom luxury apartment in a prime location. Features floor-to-ceiling windows, open-concept kitchen, in-unit laundry, smart thermostat, and resort-style amenities.', 'apartment', 'USA', 'United States', 'Georgia', 'Atlanta', 'Midtown / Buckhead', '950 Peachtree St NE', '30309', 'approved', TRUE, NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;

-- Prop 2: Toronto Admin Direct Studio
INSERT INTO public.properties (id, provider_id, is_admin_direct, title, slug, description, property_type, country_code, country_name, state_province, city, neighborhood, street_address, postal_code, status, featured, published_at) VALUES
    ('20000001-0000-0000-0000-000000000002', NULL, TRUE, 'Luxury Studio Apartment', 'luxury-studio-apartment-toronto-on', 'Chic downtown studio apartment steps away from transit, fine dining, and entertainment. Includes high-speed fiber internet, quartz countertops, designer lighting, and access to rooftop lounge.', 'studio', 'CAN', 'Canada', 'Ontario', 'Toronto', 'Entertainment District', '290 Adelaide St W', 'M5V 1P6', 'approved', TRUE, NOW() - INTERVAL '9 days')
ON CONFLICT (id) DO NOTHING;

-- Prop 3: Louisville Victorian Townhouse
INSERT INTO public.properties (id, provider_id, is_admin_direct, title, slug, description, property_type, country_code, country_name, state_province, city, neighborhood, street_address, postal_code, status, featured, published_at) VALUES
    ('20000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000002', FALSE, '3 Bedroom Victorian Townhouse', '3-bedroom-victorian-townhouse-louisville-ky', 'Elegant three-bedroom Victorian home located in a quiet tree-lined street in Old Louisville. High ceilings, original fireplaces, private rear garden, and newly renovated chef kitchen.', 'townhouse', 'USA', 'United States', 'Kentucky', 'Louisville', 'Old Louisville', '1412 S 4th Street', '40208', 'approved', TRUE, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- Prop 4: Vancouver Waterfront Apartment
INSERT INTO public.properties (id, provider_id, is_admin_direct, title, slug, description, property_type, country_code, country_name, state_province, city, neighborhood, street_address, postal_code, status, featured, published_at) VALUES
    ('20000001-0000-0000-0000-000000000004', 'e0000001-0000-0000-0000-000000000001', FALSE, '1 Bedroom Waterfront Apartment', '1-bedroom-waterfront-apartment-vancouver-bc', 'Stunning water and mountain views from this contemporary 1-bedroom apartment in Coal Harbour. Includes dedicated parking space, storage locker, and bicycle room.', 'apartment', 'CAN', 'Canada', 'British Columbia', 'Vancouver', 'Coal Harbour', '1288 W Georgia St', 'V6E 4R5', 'approved', FALSE, NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Prop 5: Charlotte Duplex (Pending Verification)
INSERT INTO public.properties (id, provider_id, is_admin_direct, title, slug, description, property_type, country_code, country_name, state_province, city, neighborhood, street_address, postal_code, status, featured) VALUES
    ('20000001-0000-0000-0000-000000000005', 'e0000001-0000-0000-0000-000000000003', FALSE, '2 Bedroom Modern Duplex', '2-bedroom-modern-duplex-charlotte-nc', 'Newly constructed Charlotte duplex with fenced yard, EV charging, polished concrete floors, and smart home automation in vibrant South End.', 'duplex', 'USA', 'United States', 'North Carolina', 'Charlotte', 'South End / Uptown', '1904 South Blvd', '28203', 'pending_verification', FALSE),
    ('20000001-0000-0000-0000-000000000006', 'e0000001-0000-0000-0000-000000000002', FALSE, 'Luxury Mountain View Executive House', 'luxury-mountain-view-executive-house-anchorage-ak', 'Prestigious executive residence in Downtown Anchorage with uninterrupted Chugach mountain and Cook Inlet views.', 'house', 'USA', 'United States', 'Alaska', 'Anchorage', 'Downtown / Inlet View', '450 W 5th Avenue', '99501', 'pending_verification', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 8. Property Units (Multi-Unit Configurations)
INSERT INTO public.property_units (id, property_id, unit_number_or_name, unit_type, bedrooms, bathrooms, square_feet, rent_amount, currency_code, security_deposit, rent_period, available_quantity, status, description) VALUES
    ('30000001-0000-0000-0000-000000000001', '20000001-0000-0000-0000-000000000001', '2 Bedroom Suite #402', 'two_bedroom', 2, 2.0, 1150, 2850.00, 'USD', 2850.00, 'monthly', 2, 'available', 'Corner unit with panoramic skyline views.'),
    ('30000001-0000-0000-0000-000000000002', '20000001-0000-0000-0000-000000000001', '1 Bedroom Suite #208', 'one_bedroom', 1, 1.0, 780, 2150.00, 'USD', 2150.00, 'monthly', 3, 'available', 'Sun-drenched layout with private balcony.'),
    ('30000001-0000-0000-0000-000000000003', '20000001-0000-0000-0000-000000000002', 'Studio Loft #1105', 'studio', 0, 1.0, 520, 1950.00, 'CAD', 1950.00, 'monthly', 1, 'available', 'Furnished modern studio with Murphy bed.'),
    ('30000001-0000-0000-0000-000000000004', '20000001-0000-0000-0000-000000000003', 'Whole Townhouse', 'three_bedroom', 3, 2.5, 1850, 3400.00, 'USD', 3400.00, 'monthly', 1, 'available', 'Complete multi-level residence with garden patio.'),
    ('30000001-0000-0000-0000-000000000004', '20000001-0000-0000-0000-000000000004', 'Waterfront Suite #1802', 'one_bedroom', 1, 1.0, 690, 2400.00, 'CAD', 1200.00, 'monthly', 1, 'available', 'Bright open layout with high ceilings.'),
    ('30000001-0000-0000-0000-000000000005', '20000001-0000-0000-0000-000000000005', 'Unit A', 'two_bedroom', 2, 2.0, 1200, 2600.00, 'USD', 2600.00, 'monthly', 1, 'available', 'Charlotte modern duplex with fenced yard.'),
    ('30000001-0000-0000-0000-000000000006', '20000001-0000-0000-0000-000000000006', 'Main Executive Residence', 'entire_house', 3, 3.0, 2200, 4800.00, 'USD', 4800.00, 'monthly', 1, 'available', 'Luxury Mountain View Executive House.')
ON CONFLICT (id) DO NOTHING;

-- 9. Property Images
INSERT INTO public.property_images (id, property_id, storage_path, caption, is_primary, sort_order) VALUES
    ('40000001-0000-0000-0000-000000000001', '20000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80', 'Exterior View', TRUE, 1),
    ('40000001-0000-0000-0000-000000000002', '20000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80', 'Living Room', FALSE, 2),
    ('40000001-0000-0000-0000-000000000003', '20000001-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 'Studio Space', TRUE, 1),
    ('40000001-0000-0000-0000-000000000004', '20000001-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 'Victorian Front', TRUE, 1),
    ('40000001-0000-0000-0000-000000000005', '20000001-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 'Waterfront Balcony', TRUE, 1),
    ('40000001-0000-0000-0000-000000000006', '20000001-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80', 'Harbour Skyline View', TRUE, 1)
ON CONFLICT (id) DO NOTHING;

-- 10. Link Property Amenities
INSERT INTO public.property_amenities (property_id, amenity_id) VALUES
    ('20000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001'),
    ('20000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002'),
    ('20000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003'),
    ('20000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004'),
    ('20000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000005'),
    ('20000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006'),
    ('20000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002'),
    ('20000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000010'),
    ('20000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000009'),
    ('20000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- 11. Rental Applications & Vault Documents
INSERT INTO public.rental_applications (id, application_ref, applicant_id, property_id, unit_id, applicant_name, applicant_email, applicant_phone, applicant_dob, applicant_nationality, applicant_address, applicant_employer, applicant_occupation, applicant_income, status, desired_move_in, lease_term_months, occupants_count, has_pets, additional_notes, submitted_at) VALUES
    ('50000001-0000-0000-0000-000000000001', 'BS-10293', 'd0000001-0000-0000-0000-000000000005', '20000001-0000-0000-0000-000000000001', '30000001-0000-0000-0000-000000000001', 'John Doe', 'john.doe@example.com', '+1 (213) 555-0199', '1992-05-14', 'United States', '950 Peachtree St NE, Apt 12B, Atlanta, GA 30309', 'Apex Tech Solutions', 'Senior Software Engineer', 9500.00, 'under_review', '2026-09-01', 12, 2, FALSE, 'Relocating closer to office. Verifiable rental history.', NOW() - INTERVAL '2 days'),
    ('50000001-0000-0000-0000-000000000002', 'BS-10211', 'd0000001-0000-0000-0000-000000000005', '20000001-0000-0000-0000-000000000002', '30000001-0000-0000-0000-000000000003', 'John Doe', 'john.doe@example.com', '+1 (213) 555-0199', '1992-05-14', 'United States', '950 Peachtree St NE, Apt 12B, Atlanta, GA 30309', 'Apex Tech Solutions', 'Senior Software Engineer', 9500.00, 'approved', '2026-09-15', 12, 1, FALSE, NULL, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.application_documents (id, application_id, document_type, file_name, storage_path, file_size_bytes, mime_type, status) VALUES
    ('60000001-0000-0000-0000-000000000001', '50000001-0000-0000-0000-000000000001', 'drivers_license', 'california_dl_front.jpg', 'applicant-vault/50000001/dl_front.jpg', 1887436, 'image/jpeg', 'verified'),
    ('60000001-0000-0000-0000-000000000002', '50000001-0000-0000-0000-000000000001', 'proof_of_income', 'july_paystub_apex.pdf', 'applicant-vault/50000001/paystub.pdf', 2516582, 'application/pdf', 'verified'),
    ('60000001-0000-0000-0000-000000000003', '50000001-0000-0000-0000-000000000001', 'utility_bill_address', 'ladwp_utility_bill.pdf', 'applicant-vault/50000001/utility.pdf', 1258291, 'application/pdf', 'pending')
ON CONFLICT (id) DO NOTHING;

-- 12. Deterministic FAQs & Keyword Engine
INSERT INTO public.faqs (id, question, answer, category, priority, is_active) VALUES
    ('70000001-0000-0000-0000-000000000001', 'How do I apply for a rental property?', 'Browse our verified properties, click into the details, select your preferred unit, and click "Apply Now". Follow our frictionless 6-step wizard to submit your information and verification documents.', 'Applications', 1, TRUE),
    ('70000001-0000-0000-0000-000000000002', 'What documents are required for verification?', 'To verify your application, please provide: 1. Government-issued photo ID (Driver''s License, Passport, or State ID), 2. Proof of Income (recent paystubs or tax returns), and 3. Proof of Current Address (utility bill or bank statement).', 'Verification', 2, TRUE),
    ('70000001-0000-0000-0000-000000000003', 'How long does application verification take?', 'Our administrative team reviews all rental applications and documents within 24 to 48 business hours. You can track real-time status directly from your Applicant Dashboard.', 'Verification', 3, TRUE),
    ('70000001-0000-0000-0000-000000000004', 'How does provider listing access work?', 'Property providers subscribe to time-bound listing access (e.g. 30, 90, 180, or 365 Days). During your active period, you can list unlimited properties. Expired listings are gracefully hidden and republish instantly upon renewal.', 'Providers', 4, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.faq_keywords (id, faq_id, keyword) VALUES
    ('80000001-0000-0000-0000-000000000001', '70000001-0000-0000-0000-000000000001', 'apply'),
    ('80000001-0000-0000-0000-000000000002', '70000001-0000-0000-0000-000000000001', 'application'),
    ('80000001-0000-0000-0000-000000000003', '70000001-0000-0000-0000-000000000001', 'process'),
    ('80000001-0000-0000-0000-000000000004', '70000001-0000-0000-0000-000000000002', 'documents'),
    ('80000001-0000-0000-0000-000000000005', '70000001-0000-0000-0000-000000000002', 'id'),
    ('80000001-0000-0000-0000-000000000006', '70000001-0000-0000-0000-000000000002', 'paystub'),
    ('80000001-0000-0000-0000-000000000007', '70000001-0000-0000-0000-000000000002', 'requirements'),
    ('80000001-0000-0000-0000-000000000008', '70000001-0000-0000-0000-000000000003', 'timeline'),
    ('80000001-0000-0000-0000-000000000009', '70000001-0000-0000-0000-000000000003', 'how long'),
    ('80000001-0000-0000-0000-000000000010', '70000001-0000-0000-0000-000000000004', 'provider'),
    ('80000001-0000-0000-0000-000000000011', '70000001-0000-0000-0000-000000000004', 'listing access'),
    ('80000001-0000-0000-0000-000000000012', '70000001-0000-0000-0000-000000000004', 'subscription')
ON CONFLICT (id) DO NOTHING;

-- 13. System Notifications
INSERT INTO public.notifications (id, profile_id, type, title, message, link_url, is_read) VALUES
    ('90000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 'listing_active', 'Listing Access Active', 'Your 90-Day Listing Access has 80 days remaining.', '/provider/plans', FALSE),
    ('90000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000005', 'app_approved', 'Application Approved!', 'Your application for Luxury Studio Apartment (Toronto) has been approved!', '/applicant/applications', FALSE)
ON CONFLICT (id) DO NOTHING;
