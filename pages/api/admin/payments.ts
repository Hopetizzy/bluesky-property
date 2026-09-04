import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { ProviderPayment } from '@/lib/types';

const isUuid = (str?: string) =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isServerSupabaseConfigured()) {
    return res.status(200).json({ success: false, message: 'Supabase server key not configured', data: [] });
  }

  // GET: Fetch all provider payments for admin verification console
  if (req.method === 'GET') {
    try {
      // 1. Fetch all provider payments
      const { data: paymentsData, error: paymentsError } = await supabaseServer
        .from('provider_payments')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      if (!paymentsData || paymentsData.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }

      // 2. Fetch related listing plans, payment methods, provider profiles, and user profiles to build rich view
      const [plansRes, methodsRes, providersRes, profilesRes] = await Promise.all([
        supabaseServer.from('listing_plans').select('id, name, duration_days, price, currency_code'),
        supabaseServer.from('payment_methods').select('id, name, type'),
        supabaseServer.from('provider_profiles').select('id, profile_id, company_name, business_phone, license_number, office_address'),
        supabaseServer.from('profiles').select('id, full_name, email, phone'),
      ]);

      const plansMap = new Map((plansRes.data || []).map((p: any) => [p.id, p]));
      const methodsMap = new Map((methodsRes.data || []).map((m: any) => [m.id, m]));
      const providersMap = new Map((providersRes.data || []).map((prov: any) => [prov.id, prov]));
      const profilesMap = new Map((profilesRes.data || []).map((prof: any) => [prof.id, prof]));

      const formatted: ProviderPayment[] = await Promise.all(
        paymentsData.map(async (row: any) => {
          const plan = plansMap.get(row.listing_plan_id);
          const method = methodsMap.get(row.payment_method_id);
          
          // Find provider profile either by provider_id or match
          let prov = providersMap.get(row.provider_id);
          if (!prov) {
            // Check if row.provider_id matches a profile_id directly
            prov = (providersRes.data || []).find((p: any) => p.profile_id === row.provider_id);
          }

          let userProfile = prov?.profile_id ? profilesMap.get(prov.profile_id) : null;
          if (!userProfile && row.provider_id) {
            userProfile = profilesMap.get(row.provider_id) || null;
          }

          const providerName =
            prov?.company_name ||
            userProfile?.full_name ||
            userProfile?.email ||
            'Property Provider';

          const providerEmail = userProfile?.email || '';
          const providerPhone = prov?.business_phone || userProfile?.phone || '';

          let proofUrl = row.proof_storage_path || '';
          if (proofUrl) {
            if (!proofUrl.startsWith('http') && !proofUrl.startsWith('data:')) {
              try {
                const cleanP = proofUrl.replace(/^\/+/, '').replace(/^payments\//, '');
                const { data: signedData } = await supabaseServer.storage
                  .from('payment-proofs-vault')
                  .createSignedUrl(cleanP, 60 * 60 * 24 * 7);
                if (signedData?.signedUrl) {
                  proofUrl = signedData.signedUrl;
                } else {
                  proofUrl = `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(cleanP)}`;
                }
              } catch {
                proofUrl = `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(proofUrl)}`;
              }
            } else if (proofUrl.includes('supabase.co/storage') && !proofUrl.includes('token=')) {
              const keyMatch = proofUrl.match(/\/payment-proofs-vault\/(.+)$/);
              if (keyMatch) {
                const key = decodeURIComponent(keyMatch[1]);
                try {
                  const { data: signedData } = await supabaseServer.storage
                    .from('payment-proofs-vault')
                    .createSignedUrl(key, 60 * 60 * 24 * 7);
                  proofUrl = signedData?.signedUrl || `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(key)}`;
                } catch {
                  proofUrl = `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(key)}`;
                }
              }
            }
          }

          return {
            id: row.id,
            provider_id: row.provider_id,
            provider_name: providerName,
            provider_email: providerEmail,
            provider_phone: providerPhone,
            listing_plan_id: row.listing_plan_id,
            listing_plan_name: plan?.name || 'Listing Access Plan',
            listing_plan_duration_days: plan?.duration_days,
            payment_method_id: row.payment_method_id,
            payment_method_name: method?.name || 'Bank Transfer',
            payment_method_type: method?.type,
            amount: Number(row.amount) || 0,
            currency_code: row.currency_code || 'USD',
            proof_storage_path: proofUrl,
            status: row.status,
            rejection_reason: row.rejection_reason,
            submitted_at: row.submitted_at || row.created_at,
            verified_at: row.verified_at,
            verified_by: row.verified_by,
          };
        })
      );

      return res.status(200).json({ success: true, data: formatted });
    } catch (err: any) {
      console.error('API /api/admin/payments GET error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST: Verify or Reject a Payment Proof
  if (req.method === 'POST') {
    try {
      const { action, paymentId, rejectionReason, adminName } = req.body;

      if (!paymentId) {
        return res.status(400).json({ success: false, error: 'Payment ID is required' });
      }

      const timestamp = new Date().toISOString();

      if (action === 'reject') {
        if (!rejectionReason) {
          return res.status(400).json({ success: false, error: 'Rejection reason is required' });
        }

        if (isUuid(paymentId)) {
          const { error } = await supabaseServer
            .from('provider_payments')
            .update({
              status: 'rejected',
              rejection_reason: rejectionReason.trim(),
              verified_at: timestamp,
              updated_at: timestamp,
            })
            .eq('id', paymentId);

          if (error) throw error;
        }

        // Create In-App Notification for Provider
        try {
          await supabaseServer.from('notifications').insert({
            profile_id: null,
            type: 'payment',
            title: 'Payment Verification Notice',
            message: `A submitted payment proof was not approved.${rejectionReason ? ` Reason: ${rejectionReason.trim()}` : ''} Please submit a valid payment receipt.`,
            link_url: '/provider/payment',
            is_read: false,
            created_at: timestamp,
          });
        } catch (notifErr) {
          console.warn('Payment rejection notification note:', notifErr);
        }

        return res.status(200).json({ success: true, message: 'Payment rejected successfully' });
      }

      if (action === 'verify') {
        // 1. Fetch current payment details
        let paymentRow: any = null;
        if (isUuid(paymentId)) {
          const { data, error } = await supabaseServer
            .from('provider_payments')
            .select('*')
            .eq('id', paymentId)
            .maybeSingle();

          if (error) throw error;
          paymentRow = data;
        }

        // 2. Determine duration from plan
        let durationDays = 90;
        if (paymentRow?.listing_plan_id && isUuid(paymentRow.listing_plan_id)) {
          const { data: planData } = await supabaseServer
            .from('listing_plans')
            .select('duration_days')
            .eq('id', paymentRow.listing_plan_id)
            .maybeSingle();
          if (planData?.duration_days) {
            durationDays = planData.duration_days;
          }
        }

        const startsAt = new Date();
        const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

        // 3. Update payment status in database
        if (isUuid(paymentId)) {
          await supabaseServer
            .from('provider_payments')
            .update({
              status: 'verified',
              verified_at: timestamp,
              updated_at: timestamp,
            })
            .eq('id', paymentId);
        }

        // 4. Create or update listing period
        if (paymentRow?.provider_id && isUuid(paymentRow.provider_id)) {
          let resolvedProviderId = paymentRow.provider_id;
          try {
            const { data: provMatch } = await supabaseServer
              .from('provider_profiles')
              .select('id')
              .or(`id.eq.${paymentRow.provider_id},profile_id.eq.${paymentRow.provider_id}`)
              .maybeSingle();

            if (provMatch?.id) {
              resolvedProviderId = provMatch.id;
            }
          } catch (provLookupErr) {
            console.warn('Provider profile lookup note:', provLookupErr);
          }

          // Upsert period
          const periodPayload: any = {
            provider_id: resolvedProviderId,
            listing_plan_id: paymentRow.listing_plan_id,
            payment_id: isUuid(paymentId) ? paymentId : null,
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            grace_period_hours: 48,
            status: 'active',
          };

          await supabaseServer.from('provider_listing_periods').insert(periodPayload);

          // Update provider verification status if needed
          await supabaseServer
            .from('provider_profiles')
            .update({ verification_status: 'verified' })
            .eq('id', resolvedProviderId);
        }

        // Create In-App Notification for Provider confirming verified access
        try {
          await supabaseServer.from('notifications').insert({
            profile_id: paymentRow?.provider_id || null,
            type: 'payment',
            title: 'Payment Verified - Listing Access Active',
            message: `Your payment for ${paymentRow?.listing_plan_name || 'Listing Plan'} has been verified. Your listing period is active.`,
            link_url: '/provider/payments',
            is_read: false,
            created_at: timestamp,
          });
        } catch (notifErr) {
          console.warn('Payment verification notification note:', notifErr);
        }

        return res.status(200).json({
          success: true,
          message: 'Payment verified and listing access activated',
          startsAt: startsAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        });
      }

      return res.status(400).json({ success: false, error: 'Invalid action specified' });
    } catch (err: any) {
      console.error('API /api/admin/payments POST error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
