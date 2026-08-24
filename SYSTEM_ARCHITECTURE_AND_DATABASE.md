# 🗄️ Blue Sky Property Management — System Architecture & Database Specification

> **Database Engine:** PostgreSQL 15+ / Supabase  
> **Security Strategy:** Row-Level Security (RLS) on all exposed tables + Private Storage Vault for sensitive applicant IDs and payment receipts.  
> **Global Support:** Multi-country, multi-region geographic structure and multi-currency pricing models.  
> **Architecture Version:** 2.1.0 (Aligned Enterprise Release)

---

## 1. Aligned Technical Decisions

1. **Frontend Architecture:** Next.js & React with TypeScript, mobile-first responsive layout components, custom Vanilla CSS design tokens.
2. **Tenant Onboarding:** Frictionless Hybrid Onboarding — visitors can browse, search, and complete Steps 1–5 of the application form anonymously; account creation/linking happens seamlessly at Step 6 during final review & submission.
3. **Monetization & Plans:** Super Admins can create unlimited custom listing plans (custom duration in days, pricing, currency, features, and active status). All active plans automatically appear dynamically on the Provider's plan selection and payment pages.
4. **Listing Expiration & Grace:** Multi-stage automated notices at 14d, 7d, 3d, and 1d before expiration, with a configurable 48-hour grace period before public listings are hidden. Early renewals seamlessly extend from the existing expiration timestamp.
5. **Payment Processing:** Pure Proof-of-Payment Verification — manual payment instructions (Bank Wire, ACH, PayPal, Zelle, Interac e-Transfer, Cashier's Check) with mandatory image/PDF receipt upload and admin review/verification.
6. **Direct Admin Publishing:** Super Admins can publish properties directly (`is_admin_direct = TRUE`) without requiring provider listing subscriptions.

---

## 2. Domain Model Overview

```
                                  ┌────────────────────────┐
                                  │      auth.users        │
                                  └───────────┬────────────┘
                                              │ 1:1
                                              ▼
                                  ┌────────────────────────┐
                                  │    public.profiles     │
                                  └───────────┬────────────┘
                                              │
             ┌────────────────────────────────┴────────────────────────────────┐
             │ 1:1                                                             │ 1:1
             ▼                                                                 ▼
┌─────────────────────────┐                                       ┌─────────────────────────┐
│public.provider_profiles │                                       │public.applicant_profiles│
└────────────┬────────────┘                                       └────────────┬────────────┘
             │                                                                 │
             ├──────────────────────────┐                                      │
             │ 1:N                      │ 1:N                                  │
             ▼                          ▼                                      │
┌─────────────────────────┐┌─────────────────────────┐                         │
│public.provider_payments ││public.provider_listing_ │                         │
└────────────┬────────────┘│          periods        │                         │
             │ N:1         └─────────────────────────┘                         │
             ▼                                                                 │
┌─────────────────────────┐                                                    │
│  public.listing_plans   │ (Dynamic Admin Plans)                              │
└─────────────────────────┘                                                    │
             ▲                                                                 │
             │ 1:N                                                             │
┌─────────────────────────┐                                                    │
│    public.properties    │◄───────────────────────────────────────────────────┤
└────────────┬────────────┘                                                    │
             │                                                                 │
             ├─────────────────┬─────────────────┐                             │
             │ 1:N             │ 1:N             │ N:M                         │
             ▼                 ▼                 ▼                             │
┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐          │
│ public.property_ │  │ public.property_ │  │ public.property_      │          │
│      images      │  │      units       │  │    amenity_links      │          │
└──────────────────┘  └────────┬─────────┘  └───────────────────────┘          │
                               │ 1:N                                           │
                               ▼                                               │
                      ┌──────────────────┐                                     │
                      │public.rental_    │◄────────────────────────────────────┘
                      │   applications   │
                      └────────┬─────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │ 1:N             │ 1:N             │ 1:N
             ▼                 ▼                 ▼
┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐
│ public.applicat- │  │ public.applicat- │  │ public.application_     │
│  ion_documents   │  │ ion_verification │  │        payments         │
└──────────────────┘  └──────────────────┘  └─────────────────────────┘
```

---

## 3. Storage Bucket Configuration & Security Boundaries

| Bucket Name | Access Type | File Size Limit | Allowed MIME Types | Intended Content |
| :--- | :--- | :--- | :--- | :--- |
| `public-property-images` | **Public CDN** | 10 MB | `image/jpeg`, `image/png`, `image/webp` | Property gallery photos, primary listing images, floor plans |
| `applicant-vault` | **Strictly Private** | 15 MB | `image/*`, `application/pdf` | Driver's licenses, passports, state IDs, tax slips, paystubs |
| `payment-proofs-vault` | **Strictly Private** | 10 MB | `image/*`, `application/pdf` | Provider listing payment receipts & tenant application fees |
| `system-assets` | **Public CDN** | 5 MB | `image/*`, `image/svg+xml` | Logos, banners, platform icons |

---

## 4. Key Stored Procedures & Triggers

### 4.1 Automated Early Renewal & Grace Calculator Trigger
```sql
CREATE OR REPLACE FUNCTION public.fn_calculate_listing_period()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_duration INTEGER;
    v_last_expiration TIMESTAMPTZ;
    v_new_start TIMESTAMPTZ;
BEGIN
    -- Get plan duration from dynamically created admin plan
    SELECT duration_days INTO v_plan_duration 
    FROM public.listing_plans WHERE id = NEW.listing_plan_id;

    -- Check if provider currently has an active unexpired period
    SELECT MAX(expires_at) INTO v_last_expiration
    FROM public.provider_listing_periods
    WHERE provider_id = NEW.provider_id 
      AND status = 'active'
      AND expires_at > NOW();

    IF v_last_expiration IS NOT NULL THEN
        -- Provider renewed early: start new period seamlessly from existing expiration
        v_new_start := v_last_expiration;
    ELSE
        -- Provider renewed after expiration or first time: start now
        v_new_start := NOW();
    END IF;

    -- Create or activate the entitlement period with 48h grace window
    INSERT INTO public.provider_listing_periods (
        provider_id,
        listing_plan_id,
        payment_id,
        starts_at,
        expires_at,
        grace_period_hours,
        status
    ) VALUES (
        NEW.provider_id,
        NEW.listing_plan_id,
        NEW.id,
        v_new_start,
        v_new_start + (v_plan_duration || ' days')::INTERVAL,
        48,
        'active'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on Payment Approval
CREATE TRIGGER trg_on_provider_payment_verified
AFTER UPDATE OF status ON public.provider_payments
FOR EACH ROW
WHEN (OLD.status != 'verified' AND NEW.status = 'verified')
EXECUTE FUNCTION public.fn_calculate_listing_period();
```
