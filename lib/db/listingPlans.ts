import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { store } from '../store';
import { ListingPlan, PaymentMethod, ProviderPayment, ProviderListingPeriod } from '../types';

const isUuid = (str?: string) =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const listingPlansDb = {
  // 1. Get active listing plans
  async getActivePlans(): Promise<ListingPlan[]> {
    if (!isSupabaseConfigured()) {
      return store.getListingPlans().filter((p) => p.is_active);
    }

    try {
      const { data, error } = await supabase
        .from('listing_plans')
        .select('*')
        .eq('is_active', true)
        .order('duration_days', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map((row: any) => ({
          ...row,
          features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features || [],
        }));
      }
      return store.getListingPlans().filter((p) => p.is_active);
    } catch {
      return store.getListingPlans().filter((p) => p.is_active);
    }
  },

  // 1b. Get ALL listing plans for Admin (active + inactive)
  async getAllPlansForAdmin(): Promise<ListingPlan[]> {
    if (!isSupabaseConfigured()) {
      return store.getListingPlans();
    }

    try {
      const { data, error } = await supabase
        .from('listing_plans')
        .select('*')
        .order('duration_days', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        const parsed = data.map((row: any) => ({
          ...row,
          features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features || [],
        }));
        parsed.forEach((p) => store.saveListingPlan(p));
        return parsed;
      }
      return store.getListingPlans();
    } catch (err) {
      console.warn('Supabase getAllPlansForAdmin note:', err);
      return store.getListingPlans();
    }
  },

  // 2. Save Listing Plan (Admin)
  async savePlan(plan: ListingPlan): Promise<ListingPlan> {
    store.saveListingPlan(plan);

    // 1. Try Next.js Server-Side Service Role API endpoint (guarantees DB write)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plan),
        });
        const json = await res.json();
        if (json.success && json.data) {
          store.saveListingPlan(json.data);
          return json.data;
        }
      } catch (apiErr) {
        console.warn('API /api/admin/plans save fallback note:', apiErr);
      }
    }

    // 2. Direct Supabase Client fallback
    if (isSupabaseConfigured()) {
      try {
        const payload: any = {
          name: plan.name,
          description: plan.description,
          price: plan.price,
          currency_code: plan.currency_code || 'USD',
          duration_days: plan.duration_days,
          is_popular: plan.is_popular,
          is_active: plan.is_active,
          features: plan.features,
        };

        if (isUuid(plan.id)) {
          payload.id = plan.id;
          const { data, error } = await supabase.from('listing_plans').upsert(payload).select().maybeSingle();
          if (error) console.error('Supabase plan upsert error:', error);
          if (data) {
            plan.id = data.id;
            store.saveListingPlan(plan);
          }
        }
      } catch (err) {
        console.error('Supabase plan save error:', err);
      }
    }

    return plan;
  },

  // 2b. Delete Listing Plan (Admin)
  async deletePlan(planId: string): Promise<void> {
    store.deleteListingPlan(planId);

    if (typeof window !== 'undefined') {
      try {
        await fetch(`/api/admin/plans?id=${encodeURIComponent(planId)}`, {
          method: 'DELETE',
        });
      } catch (apiErr) {
        console.warn('API /api/admin/plans delete note:', apiErr);
      }
    }

    if (isSupabaseConfigured()) {
      try {
        if (isUuid(planId)) {
          await supabase.from('listing_plans').delete().eq('id', planId);
        }
      } catch (err) {
        console.error('Supabase plan delete error:', err);
      }
    }
  },

  // 3. Get Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    if (!isSupabaseConfigured()) {
      return store.getPaymentMethods().filter((m) => m.is_active);
    }

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      if (data && data.length > 0) {
        return data;
      }
      return store.getPaymentMethods().filter((m) => m.is_active);
    } catch {
      return store.getPaymentMethods().filter((m) => m.is_active);
    }
  },

  // 3b. Get ALL Payment Methods for Admin
  async getAllPaymentMethodsForAdmin(): Promise<PaymentMethod[]> {
    if (!isSupabaseConfigured()) {
      return store.getPaymentMethods();
    }

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*');

      if (error) throw error;
      if (data && data.length > 0) {
        data.forEach((m) => store.savePaymentMethod(m));
        return data;
      }
      return store.getPaymentMethods();
    } catch (err) {
      console.warn('Supabase getAllPaymentMethodsForAdmin note:', err);
      return store.getPaymentMethods();
    }
  },

  // 3c. Save Payment Method (Admin)
  async savePaymentMethod(method: PaymentMethod): Promise<PaymentMethod> {
    store.savePaymentMethod(method);

    // 1. Try Next.js Server-Side Service Role API endpoint (guarantees DB write)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(method),
        });
        const json = await res.json();
        if (json.success && json.data) {
          store.savePaymentMethod(json.data);
          return json.data;
        }
      } catch (apiErr) {
        console.warn('API /api/admin/payment-methods save fallback note:', apiErr);
      }
    }

    // 2. Direct Supabase Client fallback
    if (isSupabaseConfigured()) {
      try {
        const payload: any = {
          name: method.name,
          type: method.type,
          currency_code: method.currency_code || 'USD',
          instructions: method.instructions,
          account_name: method.account_name || null,
          account_number: method.account_number || null,
          routing_or_swift: method.routing_or_swift || null,
          bank_name: method.bank_name || null,
          paypal_email: method.paypal_email || null,
          zelle_identifier: method.zelle_identifier || null,
          is_active: method.is_active,
        };

        if (isUuid(method.id)) {
          payload.id = method.id;
          const { data, error } = await supabase.from('payment_methods').upsert(payload).select().maybeSingle();
          if (error) console.error('Supabase payment method upsert error:', error);
          if (data) {
            method.id = data.id;
            store.savePaymentMethod(method);
          }
        }
      } catch (err) {
        console.error('Supabase payment method save error:', err);
      }
    }

    return method;
  },

  // 3d. Delete Payment Method (Admin)
  async deletePaymentMethod(methodId: string): Promise<void> {
    store.deletePaymentMethod(methodId);

    if (typeof window !== 'undefined') {
      try {
        await fetch(`/api/admin/payment-methods?id=${encodeURIComponent(methodId)}`, {
          method: 'DELETE',
        });
      } catch (apiErr) {
        console.warn('API /api/admin/payment-methods delete note:', apiErr);
      }
    }

    if (isSupabaseConfigured()) {
      try {
        if (isUuid(methodId)) {
          await supabase.from('payment_methods').delete().eq('id', methodId);
        }
      } catch (err) {
        console.error('Supabase payment method delete error:', err);
      }
    }
  },

  // 4. Submit Provider Payment
  async submitPayment(payment: ProviderPayment): Promise<ProviderPayment> {
    store.saveProviderPayment(payment);

    if (isSupabaseConfigured()) {
      try {
        const isUuid = (str?: string) =>
          typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

        let finalProviderId = payment.provider_id;

        // Ensure we have a valid provider_profiles UUID
        if (!isUuid(finalProviderId)) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
              .maybeSingle();

            if (profile?.id) {
              let { data: provProf } = await supabase
                .from('provider_profiles')
                .select('id')
                .eq('profile_id', profile.id)
                .maybeSingle();

              if (!provProf) {
                const { data: newProv } = await supabase
                  .from('provider_profiles')
                  .insert({
                    profile_id: profile.id,
                    provider_type: 'owner',
                    business_phone: '+1 (555) 000-0000',
                    country_code: 'USA',
                    verification_status: 'verified',
                  })
                  .select('id')
                  .single();
                provProf = newProv;
              }

              if (provProf?.id) {
                finalProviderId = provProf.id;
              }
            }
          }
        } else {
          // Check if this UUID is a profiles.id instead of provider_profiles.id
          const { data: matchedProv } = await supabase
            .from('provider_profiles')
            .select('id')
            .eq('profile_id', finalProviderId)
            .maybeSingle();
          if (matchedProv?.id) {
            finalProviderId = matchedProv.id;
          }
        }

        // Resolve plan UUID
        let finalPlanId = payment.listing_plan_id;
        if (!isUuid(finalPlanId)) {
          const { data: dbPlans } = await supabase.from('listing_plans').select('id').limit(1);
          if (dbPlans && dbPlans.length > 0) {
            finalPlanId = dbPlans[0].id;
          }
        }

        // Resolve payment method UUID
        let finalMethodId = payment.payment_method_id;
        if (!isUuid(finalMethodId)) {
          const { data: dbMethods } = await supabase.from('payment_methods').select('id').limit(1);
          if (dbMethods && dbMethods.length > 0) {
            finalMethodId = dbMethods[0].id;
          }
        }

        const insertPayload: any = {
          provider_id: finalProviderId,
          listing_plan_id: finalPlanId,
          payment_method_id: finalMethodId,
          amount: payment.amount,
          currency_code: payment.currency_code || 'USD',
          proof_storage_path: payment.proof_storage_path || 'receipt.png',
          status: payment.status || 'pending',
        };

        if (isUuid(payment.id)) {
          insertPayload.id = payment.id;
        }

        const { data: insertedPayment, error } = await supabase
          .from('provider_payments')
          .insert(insertPayload)
          .select(`
            *,
            listing_plans (name),
            payment_methods (name)
          `)
          .maybeSingle();

        if (error) {
          console.error('Supabase provider payment insert error:', error.message || error);
        } else if (insertedPayment) {
          const formatted: ProviderPayment = {
            id: insertedPayment.id,
            provider_id: insertedPayment.provider_id,
            listing_plan_id: insertedPayment.listing_plan_id,
            listing_plan_name: insertedPayment.listing_plans?.name || payment.listing_plan_name,
            payment_method_id: insertedPayment.payment_method_id,
            payment_method_name: insertedPayment.payment_methods?.name || payment.payment_method_name,
            amount: insertedPayment.amount,
            currency_code: insertedPayment.currency_code,
            proof_storage_path: insertedPayment.proof_storage_path,
            status: insertedPayment.status,
            submitted_at: insertedPayment.submitted_at || insertedPayment.created_at,
          };
          store.saveProviderPayment(formatted);
          return formatted;
        }
      } catch (err) {
        console.error('Supabase payment insert error:', err);
      }
    }

    return payment;
  },

  // 5. Verify Payment & Activate Period (Executes Database Activation & Logs Audit)
  async verifyPaymentAndActivatePeriod(payment: ProviderPayment, adminName: string): Promise<void> {
    const verifiedTimestamp = new Date().toISOString();
    const updatedPayment: ProviderPayment = {
      ...payment,
      status: 'verified',
      verified_at: verifiedTimestamp,
      verified_by: adminName,
    };
    store.saveProviderPayment(updatedPayment);

    // Compute period locally in store
    const existingPeriods = store.getListingPeriods().filter((p) => p.provider_id === payment.provider_id && p.status === 'active');
    const plans = store.getListingPlans();
    const matchedPlan = plans.find((p) => p.id === payment.listing_plan_id);
    const durationDays = payment.listing_plan_duration_days || (matchedPlan ? matchedPlan.duration_days : 90);

    let startsAt = new Date();
    if (existingPeriods.length > 0 && new Date(existingPeriods[0].expires_at) > startsAt) {
      startsAt = new Date(existingPeriods[0].expires_at);
    }
    const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 3600 * 1000);

    const newPeriod: ProviderListingPeriod = {
      id: `period-${Date.now()}`,
      provider_id: payment.provider_id,
      listing_plan_id: payment.listing_plan_id,
      payment_id: payment.id,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      grace_period_hours: 48,
      status: 'active',
    };
    store.saveListingPeriod(newPeriod);

    // 1. Try Server-Side Admin API endpoint (Guarantees DB update with service role key)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify',
            paymentId: payment.id,
            adminName,
          }),
        });
        const json = await res.json();
        if (json.success) {
          return;
        }
      } catch (apiErr) {
        console.warn('API /api/admin/payments verify fallback note:', apiErr);
      }
    }

    // 2. Direct Supabase Client fallback
    if (isSupabaseConfigured()) {
      try {
        // Update payment status in database
        await supabase
          .from('provider_payments')
          .update({
            status: 'verified',
            verified_at: verifiedTimestamp,
            verified_by: adminName,
          })
          .eq('id', payment.id);

        // Call stored procedure for activation
        const { error: rpcError } = await supabase.rpc('activate_provider_listing_period', {
          p_provider_id: payment.provider_id,
          p_listing_plan_id: payment.listing_plan_id,
          p_payment_id: payment.id,
        });

        if (rpcError) {
          console.warn('RPC activate note, falling back to direct period upsert:', rpcError.message);
          await supabase.from('provider_listing_periods').insert({
            provider_id: payment.provider_id,
            listing_plan_id: payment.listing_plan_id,
            payment_id: payment.id,
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            grace_period_hours: 48,
            status: 'active',
          });
        }
      } catch (err) {
        console.error('Supabase activate listing period error:', err);
      }
    }
  },

  // 6. Get active listing period for a provider
  async getProviderActivePeriod(providerIdOrProfileId: string): Promise<ProviderListingPeriod | null> {
    if (!isSupabaseConfigured()) {
      const periods = store.getListingPeriods().filter((p) => p.provider_id === providerIdOrProfileId && p.status === 'active');
      return periods.length > 0 ? periods[0] : null;
    }

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerIdOrProfileId);

      let targetProviderId = providerIdOrProfileId;
      if (isUuid) {
        const { data: provProf } = await supabase
          .from('provider_profiles')
          .select('id')
          .or(`id.eq.${providerIdOrProfileId},profile_id.eq.${providerIdOrProfileId}`)
          .maybeSingle();
        if (provProf?.id) targetProviderId = provProf.id;
      }

      const { data, error } = await supabase
        .from('provider_listing_periods')
        .select('*')
        .eq('provider_id', targetProviderId)
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    } catch (err) {
      console.warn('Supabase listing period fetch note:', err);
      const periods = store.getListingPeriods().filter((p) => p.provider_id === providerIdOrProfileId && p.status === 'active');
      return periods.length > 0 ? periods[0] : null;
    }
  },

  // 7. Get payments submitted by a provider
  async getProviderPayments(providerIdOrProfileId: string): Promise<ProviderPayment[]> {
    if (!isSupabaseConfigured()) {
      return store.getProviderPayments().filter((p) => p.provider_id === providerIdOrProfileId || p.provider_id === 'prov-1');
    }

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerIdOrProfileId);

      let targetProviderId = providerIdOrProfileId;
      if (isUuid) {
        const { data: provProf } = await supabase
          .from('provider_profiles')
          .select('id')
          .or(`id.eq.${providerIdOrProfileId},profile_id.eq.${providerIdOrProfileId}`)
          .maybeSingle();
        if (provProf?.id) targetProviderId = provProf.id;
      }

      const { data, error } = await supabase
        .from('provider_payments')
        .select(`
          *,
          listing_plans (name, duration_days),
          payment_methods (name, type)
        `)
        .eq('provider_id', targetProviderId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        listing_plan_name: row.listing_plans?.name || 'Listing Plan',
        listing_plan_duration_days: row.listing_plans?.duration_days,
        payment_method_name: row.payment_methods?.name || 'Payment Method',
        payment_method_type: row.payment_methods?.type,
      }));
    } catch (err) {
      console.warn('Supabase provider payments fetch note:', err);
      return store.getProviderPayments().filter((p) => p.provider_id === providerIdOrProfileId || p.provider_id === 'prov-1');
    }
  },

  // 8. Get ALL payments for Super Admin Verification Console with full relational data
  async getAllPaymentsForAdmin(): Promise<ProviderPayment[]> {
    // 1. Try Next.js Server-Side Service Role API endpoint (bypasses RLS, gets live DB rows)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/payments');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // If we got live DB data, update store and return
          if (json.data.length > 0) {
            json.data.forEach((p: ProviderPayment) => store.saveProviderPayment(p));
            return json.data;
          }
          // If database specifically returned an empty table, return empty
          return [];
        }
      } catch (apiErr) {
        console.warn('API /api/admin/payments GET note, falling back to direct client:', apiErr);
      }
    }

    if (!isSupabaseConfigured()) {
      return store.getProviderPayments();
    }

    try {
      const { data, error } = await supabase
        .from('provider_payments')
        .select(`
          *,
          listing_plans (id, name, duration_days, price, currency_code),
          payment_methods (id, name, type),
          provider_profiles (
            id,
            company_name,
            business_phone,
            license_number,
            profiles (full_name, email, phone)
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        return (data || []).map((row: any) => {
          const providerName =
            row.provider_profiles?.company_name ||
            row.provider_profiles?.profiles?.full_name ||
            row.provider_profiles?.profiles?.email ||
            'Provider Partner';

          const providerEmail = row.provider_profiles?.profiles?.email;
          const providerPhone = row.provider_profiles?.business_phone || row.provider_profiles?.profiles?.phone;

          let proofUrl = row.proof_storage_path;
          if (proofUrl && !proofUrl.startsWith('http') && !proofUrl.startsWith('/')) {
            try {
              const { data: publicData } = supabase.storage
                .from('payment-proofs-vault')
                .getPublicUrl(proofUrl);
              if (publicData?.publicUrl) {
                proofUrl = publicData.publicUrl;
              }
            } catch {}
          }

          return {
            ...row,
            provider_name: providerName,
            provider_email: providerEmail,
            provider_phone: providerPhone,
            listing_plan_name: row.listing_plans?.name || 'Listing Access Plan',
            listing_plan_duration_days: row.listing_plans?.duration_days,
            payment_method_name: row.payment_methods?.name || 'Bank Transfer',
            payment_method_type: row.payment_methods?.type,
            proof_storage_path: proofUrl,
          };
        });
      }
      return [];
    } catch (err) {
      console.warn('Supabase admin payments fetch note:', err);
      return store.getProviderPayments();
    }
  },

  // 9. Reject Payment Proof & Log Rejection
  async rejectPaymentProof(paymentId: string, reason: string): Promise<void> {
    const verifiedTimestamp = new Date().toISOString();
    const payments = store.getProviderPayments();
    const target = payments.find((p) => p.id === paymentId);
    if (target) {
      target.status = 'rejected';
      target.rejection_reason = reason;
      target.verified_at = verifiedTimestamp;
      target.verified_by = 'Super Admin';
      store.saveProviderPayment(target);
    }

    // 1. Try Next.js Server-Side Service Role API endpoint
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reject',
            paymentId,
            rejectionReason: reason,
          }),
        });
        const json = await res.json();
        if (json.success) return;
      } catch (apiErr) {
        console.warn('API /api/admin/payments reject note:', apiErr);
      }
    }

    // 2. Direct client fallback
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('provider_payments')
          .update({
            status: 'rejected',
            rejection_reason: reason,
            verified_at: verifiedTimestamp,
            verified_by: 'Super Admin',
          })
          .eq('id', paymentId);
      } catch (err) {
        console.error('Supabase reject payment error:', err);
      }
    }
  },
};
