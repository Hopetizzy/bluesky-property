-- ============================================================================
-- BLUE SKY PROPERTY MANAGEMENT - SQL MIGRATION 13
-- Payment Methods Overhaul: 
-- 1. Alter type column to flexible VARCHAR(50)
-- 2. Remove legacy payment channels (Bank Wire, ACH, PayPal, Zelle, Cashier Check)
-- 3. Seed the 5 Standard Payment Methods:
--    - Chime
--    - Cash App
--    - Facebook Pay / Meta Pay
--    - Bitcoin (BTC Crypto)
--    - Interac e-Transfer (Canada 🇨🇦)
-- ============================================================================

-- Step 1: Ensure column is VARCHAR(50) to support all payment channel types without enum locks
ALTER TABLE IF EXISTS public.payment_methods 
    ALTER COLUMN type TYPE VARCHAR(50) USING type::VARCHAR;

-- Step 2: Delete legacy payment methods
DELETE FROM public.payment_methods
WHERE type IN ('bank_wire', 'ach_transfer', 'paypal', 'zelle', 'cashiers_check', 'other')
   OR name ILIKE '%wire%' 
   OR name ILIKE '%zelle%' 
   OR name ILIKE '%paypal%';

-- Step 3: Insert / Upsert the 5 Approved Payment Methods
INSERT INTO public.payment_methods (id, name, type, currency_code, instructions, account_name, account_number, routing_or_swift, bank_name, is_active)
VALUES
    (
        'c0000001-0000-0000-0000-000000000001',
        'Chime Direct Transfer',
        'chime',
        'USD',
        'Send transfer via Chime to $BlueSkyProperties or payments@blueskyproperty.com. Please include your provider business name in the memo.',
        'Blue Sky Property Management LLC',
        '$BlueSkyProperties',
        NULL,
        'Chime Bank (Bancorp / Stride)',
        TRUE
    ),
    (
        'c0000001-0000-0000-0000-000000000002',
        'Cash App',
        'cash_app',
        'USD',
        'Send payment to official $Cashtag: $BlueSkyHomes. Include your property name or provider email in the note.',
        'Blue Sky Property LLC',
        '$BlueSkyHomes',
        NULL,
        'Cash App / Block Inc.',
        TRUE
    ),
    (
        'c0000001-0000-0000-0000-000000000003',
        'Facebook Pay / Meta Pay',
        'facebook_pay',
        'USD',
        'Send payment through Facebook Messenger / Meta Pay to @blueskypayments. Mention your listing plan ID in the message.',
        'Blue Sky Property Official',
        '@blueskypayments',
        NULL,
        'Meta / Facebook Pay',
        TRUE
    ),
    (
        'c0000001-0000-0000-0000-000000000004',
        'Bitcoin (BTC Crypto)',
        'bitcoin',
        'USD',
        'Send exact USD equivalent in BTC to the corporate cold-storage Bitcoin address. Upload the transaction hash or confirmation screenshot.',
        'Blue Sky Corporate Vault',
        'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        'Bitcoin (BTC) Native SegWit',
        'Bitcoin Blockchain Network',
        TRUE
    ),
    (
        'c0000001-0000-0000-0000-000000000005',
        'Interac e-Transfer (Canada 🇨🇦)',
        'interac_etransfer',
        'CAD',
        'Send Interac e-Transfer to payments-ca@blueskyproperty.com with Auto-Deposit enabled. No password required.',
        'Blue Sky Properties Canada Inc.',
        'payments-ca@blueskyproperty.com',
        'Auto-Deposit Enabled',
        'Interac / Canadian Financial Institutions',
        TRUE
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    currency_code = EXCLUDED.currency_code,
    instructions = EXCLUDED.instructions,
    account_name = EXCLUDED.account_name,
    account_number = EXCLUDED.account_number,
    routing_or_swift = EXCLUDED.routing_or_swift,
    bank_name = EXCLUDED.bank_name,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Clear zelle_identifier from Bitcoin if previously set
UPDATE public.payment_methods
SET zelle_identifier = NULL
WHERE type = 'bitcoin' OR id = 'c0000001-0000-0000-0000-000000000004';

-- Step 4: Ensure system_settings contains the updated office address in Atlanta, GA
INSERT INTO public.system_settings (key, value, description)
VALUES 
    (
        'site_config',
        '{
            "support_email": "support@blueskyproperty.com",
            "support_phone": "+1 (800) 555-0199",
            "office_address": "950 Peachtree St NE, Suite 800, Atlanta, GA 30309",
            "facebook_url": "https://facebook.com/blueskyproperty",
            "twitter_url": "https://twitter.com/blueskyprop",
            "instagram_url": "https://instagram.com/blueskyproperty",
            "linkedin_url": "https://linkedin.com/company/blueskyproperty",
            "youtube_url": "https://youtube.com/@blueskyproperty"
        }'::jsonb,
        'Global Brand support contact information and social media links displayed on site footer'
    )
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();
