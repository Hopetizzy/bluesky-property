import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { ApplicationFeeSettings } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: Fetch application fee settings
  if (req.method === 'GET') {
    if (!isServerSupabaseConfigured()) {
      return res.status(200).json({
        success: true,
        data: { is_enabled: true, amount: 50, currency_code: 'USD' },
      });
    }

    try {
      const { data, error } = await supabaseServer
        .from('system_settings')
        .select('value')
        .eq('key', 'application_fee')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        return res.status(200).json({ success: true, data: data.value });
      }

      return res.status(200).json({
        success: true,
        data: { is_enabled: true, amount: 50, currency_code: 'USD' },
      });
    } catch (err: any) {
      console.warn('API /api/settings/application-fee GET note:', err.message);
      return res.status(200).json({
        success: true,
        data: { is_enabled: true, amount: 50, currency_code: 'USD' },
      });
    }
  }

  // POST: Update application fee settings (Admin)
  if (req.method === 'POST') {
    try {
      const body = req.body as ApplicationFeeSettings;
      if (body.is_enabled === undefined || body.amount === undefined) {
        return res.status(400).json({ success: false, error: 'Missing is_enabled or amount' });
      }

      const feePayload: ApplicationFeeSettings = {
        is_enabled: Boolean(body.is_enabled),
        amount: Number(body.amount) || 0,
        currency_code: body.currency_code || 'USD',
      };

      if (isServerSupabaseConfigured()) {
        const { error } = await supabaseServer
          .from('system_settings')
          .upsert({
            key: 'application_fee',
            value: feePayload,
            description: 'Tenant rental application background check and verification fee',
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      return res.status(200).json({ success: true, data: feePayload });
    } catch (err: any) {
      console.error('API /api/settings/application-fee POST error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
