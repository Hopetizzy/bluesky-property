import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { store } from '../store';
import { ListingPlan, PaymentMethod, ProviderPayment, ProviderListingPeriod } from '../types';

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
      return (data || []).map((row: any) => ({
        ...row,
        features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features || [],
      }));
    } catch {
      return store.getListingPlans().filter((p) => p.is_active);
    }
  },

  // 2. Save Listing Plan (Admin)
  async savePlan(plan: ListingPlan): Promise<ListingPlan> {
    store.saveListingPlan(plan);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('listing_plans').upsert({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          currency_code: plan.currency_code,
          duration_days: plan.duration_days,
          is_popular: plan.is_popular,
          is_active: plan.is_active,
          features: plan.features,
        });
      } catch (err) {
        console.error('Supabase plan save error:', err);
      }
    }

    return plan;
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
      return data || [];
    } catch {
      return store.getPaymentMethods().filter((m) => m.is_active);
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

  // 5. Verify Payment & Activate Period (Executes PostgreSQL Early Renewal Trigger Function)
  async verifyPaymentAndActivatePeriod(payment: ProviderPayment, adminName: string): Promise<void> {
    const updatedPayment: ProviderPayment = {
      ...payment,
      status: 'verified',
      verified_at: new Date().toISOString(),
      verified_by: adminName,
    };
    store.saveProviderPayment(updatedPayment);

    // Compute period locally in store
    const existingPeriods = store.getListingPeriods().filter((p) => p.provider_id === payment.provider_id && p.status === 'active');
    const plans = store.getListingPlans();
    const matchedPlan = plans.find((p) => p.id === payment.listing_plan_id);
    const durationDays = matchedPlan ? matchedPlan.duration_days : 90;

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

    // If Supabase is connected, call the PostgreSQL stored procedure
    if (isSupabaseConfigured()) {
      try {
        await supabase.rpc('activate_provider_listing_period', {
          p_provider_id: payment.provider_id,
          p_listing_plan_id: payment.listing_plan_id,
          p_payment_id: payment.id,
        });
      } catch (err) {
        console.error('Supabase RPC activate_provider_listing_period error:', err);
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
          listing_plans (name),
          payment_methods (name)
        `)
        .eq('provider_id', targetProviderId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        listing_plan_name: row.listing_plans?.name || 'Listing Plan',
        payment_method_name: row.payment_methods?.name || 'Payment Method',
      }));
    } catch (err) {
      console.warn('Supabase provider payments fetch note:', err);
      return store.getProviderPayments().filter((p) => p.provider_id === providerIdOrProfileId || p.provider_id === 'prov-1');
    }
  },
};
