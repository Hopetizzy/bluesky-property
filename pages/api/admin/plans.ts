import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { ListingPlan } from '@/lib/types';
import { randomUUID } from 'crypto';

const isUuid = (str?: string) =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isServerSupabaseConfigured()) {
    return res.status(200).json({ success: false, message: 'Supabase server key not configured', data: [] });
  }

  // GET: Fetch all listing plans
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseServer
        .from('listing_plans')
        .select('*')
        .order('duration_days', { ascending: true });

      if (error) throw error;
      const formatted = (data || []).map((row: any) => ({
        ...row,
        features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features || [],
      }));

      return res.status(200).json({ success: true, data: formatted });
    } catch (err: any) {
      console.error('API /api/admin/plans GET error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST: Create or Update listing plan
  if (req.method === 'POST') {
    try {
      const body = req.body as ListingPlan;
      if (!body.name || !body.duration_days || body.price === undefined) {
        return res.status(400).json({ success: false, error: 'Missing required plan fields (name, duration_days, price)' });
      }

      const planId = isUuid(body.id) ? body.id : randomUUID();

      const payload = {
        id: planId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        price: Number(body.price),
        currency_code: body.currency_code || 'USD',
        duration_days: Number(body.duration_days),
        is_popular: Boolean(body.is_popular),
        is_active: body.is_active ?? true,
        features: Array.isArray(body.features) ? body.features : [],
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseServer
        .from('listing_plans')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: {
          ...data,
          features: typeof data.features === 'string' ? JSON.parse(data.features) : data.features || [],
        },
      });
    } catch (err: any) {
      console.error('API /api/admin/plans POST error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE: Delete listing plan by ID
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Plan ID required' });
      }

      if (isUuid(id)) {
        // 1. Unlink referencing provider_listing_periods
        const { error: periodUnlinkErr } = await supabaseServer
          .from('provider_listing_periods')
          .update({ listing_plan_id: null })
          .eq('listing_plan_id', id);

        if (periodUnlinkErr) {
          await supabaseServer.from('provider_listing_periods').delete().eq('listing_plan_id', id);
        }

        // 2. Unlink referencing provider_payments
        const { error: payUnlinkErr } = await supabaseServer
          .from('provider_payments')
          .update({ listing_plan_id: null })
          .eq('listing_plan_id', id);

        if (payUnlinkErr) {
          await supabaseServer.from('provider_payments').delete().eq('listing_plan_id', id);
        }

        // 3. Delete the listing plan record
        const { error } = await supabaseServer.from('listing_plans').delete().eq('id', id);
        if (error) {
          await supabaseServer.from('provider_listing_periods').delete().eq('listing_plan_id', id);
          await supabaseServer.from('provider_payments').delete().eq('listing_plan_id', id);
          const { error: retryErr } = await supabaseServer.from('listing_plans').delete().eq('id', id);
          if (retryErr) throw retryErr;
        }
      }

      return res.status(200).json({ success: true, message: 'Plan deleted successfully' });
    } catch (err: any) {
      console.error('API /api/admin/plans DELETE error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
