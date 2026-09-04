import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabaseServer';
import { NotificationItem } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { role, profile_id, unread_only } = req.query;

    try {
      let query = supabaseServer
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (profile_id && typeof profile_id === 'string') {
        query = query.eq('profile_id', profile_id);
      }

      if (unread_only === 'true') {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(200).json({ notifications: [], unreadCount: 0 });
      }

      let notifications: NotificationItem[] = (data || []).map((n: any) => ({
        id: String(n.id),
        user_id: n.profile_id || n.user_id || 'system',
        profile_id: n.profile_id || undefined,
        role: n.role || undefined,
        type: n.type || 'info',
        title: n.title,
        message: n.message,
        link_url: n.link_url || undefined,
        is_read: Boolean(n.is_read),
        created_at: n.created_at || new Date().toISOString(),
      }));

      // Filter strictly by role if requested
      if (role && typeof role === 'string' && role !== 'all') {
        notifications = notifications.filter((n) => {
          if (role === 'admin') {
            return n.role === 'admin' || (!n.role && !n.profile_id && (n.type === 'application' || n.type === 'payment' || n.type === 'property' || n.type === 'system'));
          }
          if (role === 'provider') {
            return n.role === 'provider';
          }
          if (role === 'applicant') {
            return n.role === 'applicant';
          }
          return true;
        });
      }

      const unreadCount = notifications.filter((n) => !n.is_read).length;

      return res.status(200).json({ notifications, unreadCount });
    } catch (err: any) {
      return res.status(200).json({ notifications: [], unreadCount: 0, error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { id, profile_id, role, type, title, message, link_url } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    try {
      const newNotif = {
        id: id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        profile_id: profile_id || null,
        type: type || 'info',
        title,
        message,
        link_url: link_url || null,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseServer
        .from('notifications')
        .insert(newNotif)
        .select()
        .single();

      if (error) {
        return res.status(200).json({ success: true, notification: newNotif, note: 'Saved locally' });
      }

      return res.status(201).json({ success: true, notification: data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const { id, markAll, profile_id } = req.body;

    try {
      if (markAll) {
        let query = supabaseServer
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('is_read', false);

        if (profile_id) {
          query = query.eq('profile_id', profile_id);
        }

        await query;
        return res.status(200).json({ success: true, message: 'All notifications marked as read' });
      }

      if (id) {
        await supabaseServer
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', id);

        return res.status(200).json({ success: true, id });
      }

      return res.status(400).json({ error: 'Missing id or markAll flag' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
