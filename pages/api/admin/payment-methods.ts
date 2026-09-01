import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { PaymentMethod } from '@/lib/types';
import { randomUUID } from 'crypto';

const isUuid = (str?: string) =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isServerSupabaseConfigured()) {
    return res.status(200).json({ success: false, message: 'Supabase server key not configured', data: [] });
  }

  // GET: Fetch all payment methods
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseServer
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    } catch (err: any) {
      console.error('API /api/admin/payment-methods GET error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST: Create or Update Payment Method
  if (req.method === 'POST') {
    try {
      const body = req.body as PaymentMethod;
      if (!body.name || !body.type || !body.instructions) {
        return res.status(400).json({ success: false, error: 'Missing required payment method fields (name, type, instructions)' });
      }

      const methodId = isUuid(body.id) ? body.id : randomUUID();

      const payload = {
        id: methodId,
        name: body.name.trim(),
        type: body.type,
        currency_code: body.currency_code || 'USD',
        instructions: body.instructions.trim(),
        account_name: body.account_name?.trim() || null,
        account_number: body.account_number?.trim() || null,
        routing_or_swift: body.routing_or_swift?.trim() || null,
        bank_name: body.bank_name?.trim() || null,
        paypal_email: body.paypal_email?.trim() || null,
        zelle_identifier: body.zelle_identifier?.trim() || null,
        is_active: body.is_active ?? true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseServer
        .from('payment_methods')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      console.error('API /api/admin/payment-methods POST error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE: Delete payment method
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Payment method ID required' });
      }

      if (isUuid(id)) {
        // 1. Attempt to unlink referencing provider_payments
        const { error: unlinkErr } = await supabaseServer
          .from('provider_payments')
          .update({ payment_method_id: null })
          .eq('payment_method_id', id);

        // 2. If unlinking was blocked by NOT NULL constraint, remove referencing payments
        if (unlinkErr) {
          await supabaseServer.from('provider_payments').delete().eq('payment_method_id', id);
        }

        // 3. Delete the payment method record
        const { error } = await supabaseServer.from('payment_methods').delete().eq('id', id);
        if (error) {
          // If still constrained, purge any remaining referencing rows and retry
          await supabaseServer.from('provider_payments').delete().eq('payment_method_id', id);
          const { error: retryErr } = await supabaseServer.from('payment_methods').delete().eq('id', id);
          if (retryErr) throw retryErr;
        }
      }

      return res.status(200).json({ success: true, message: 'Payment method deleted successfully' });
    } catch (err: any) {
      console.error('API /api/admin/payment-methods DELETE error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
