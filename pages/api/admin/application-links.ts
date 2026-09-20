import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { randomBytes } from 'crypto';

const isUuid = (str?: string) =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isServerSupabaseConfigured()) {
    return res.status(200).json({ success: false, message: 'Supabase server key not configured', data: [] });
  }

  // GET: List all admin-generated application links
  if (req.method === 'GET') {
    try {
      const { data: links, error } = await supabaseServer
        .from('admin_application_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Count submissions for each link
      const linkIds = (links || []).map((l: any) => l.id);
      let submissionsByLink = new Map<string, number>();

      if (linkIds.length > 0) {
        const { data: directApps } = await supabaseServer
          .from('direct_rental_applications')
          .select('link_id');

        (directApps || []).forEach((app: any) => {
          if (app.link_id) {
            submissionsByLink.set(app.link_id, (submissionsByLink.get(app.link_id) || 0) + 1);
          }
        });
      }

      // Fetch property titles for assigned properties
      const allPropIds = Array.from(
        new Set(
          (links || [])
            .flatMap((l: any) => (Array.isArray(l.assigned_property_ids) ? l.assigned_property_ids : []))
            .filter(isUuid)
        )
      );

      let propMap = new Map<string, string>();
      if (allPropIds.length > 0) {
        const { data: props } = await supabaseServer
          .from('properties')
          .select('id, title')
          .in('id', allPropIds);

        (props || []).forEach((p: any) => propMap.set(p.id, p.title));
      }

      const formatted = (links || []).map((l: any) => {
        const assignedIds = Array.isArray(l.assigned_property_ids) ? l.assigned_property_ids : [];
        const assignedProps = assignedIds.map((pid: string) => ({
          id: pid,
          title: propMap.get(pid) || 'Property Listing',
        }));

        return {
          id: l.id,
          token: l.token,
          title: l.title || 'Direct Rental Application Portal',
          instructions: l.instructions || '',
          assigned_property_ids: assignedIds,
          assigned_properties: assignedProps,
          fee_enabled: Boolean(l.fee_enabled),
          fee_amount: Number(l.fee_amount) || 50,
          currency_code: l.currency_code || 'USD',
          is_active: Boolean(l.is_active),
          expires_at: l.expires_at,
          submissions_count: submissionsByLink.get(l.id) || 0,
          created_at: l.created_at,
          updated_at: l.updated_at,
          portal_url: `/apply/${l.token}`,
        };
      });

      return res.status(200).json({ success: true, data: formatted });
    } catch (err: any) {
      console.error('API /api/admin/application-links GET error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST: Create a new admin-generated application link
  if (req.method === 'POST') {
    try {
      const {
        title,
        instructions,
        assigned_property_ids,
        fee_enabled,
        fee_amount,
        currency_code,
        expires_at,
      } = req.body;

      // Generate a sleek, unique 10-character alphanumeric token
      const token = randomBytes(5).toString('hex').toLowerCase();

      const payload = {
        token,
        title: title?.trim() || 'Direct Rental Application Portal',
        instructions: instructions?.trim() || null,
        assigned_property_ids: Array.isArray(assigned_property_ids) ? assigned_property_ids : [],
        fee_enabled: fee_enabled !== undefined ? Boolean(fee_enabled) : true,
        fee_amount: fee_amount !== undefined ? Number(fee_amount) : 50.0,
        currency_code: currency_code || 'USD',
        is_active: true,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseServer
        .from('admin_application_links')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Direct application link generated successfully',
        data: {
          ...data,
          portal_url: `/apply/${data.token}`,
        },
      });
    } catch (err: any) {
      console.error('API /api/admin/application-links POST error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE: Revoke / Delete application link
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body || req.query;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Link ID or token is required' });
      }

      let query = supabaseServer.from('admin_application_links').delete();
      if (isUuid(id)) {
        query = query.eq('id', id);
      } else {
        query = query.eq('token', id);
      }

      const { error } = await query;
      if (error) throw error;

      return res.status(200).json({ success: true, message: 'Application link removed successfully' });
    } catch (err: any) {
      console.error('API /api/admin/application-links DELETE error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
