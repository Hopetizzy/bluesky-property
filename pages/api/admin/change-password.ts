import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, oldPassword, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ success: false, error: 'Email and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
  }

  if (!isServerSupabaseConfigured()) {
    // Local / offline mock success
    return res.status(200).json({ success: true, message: 'Password updated successfully in local storage mode' });
  }

  try {
    // 1. Locate auth user by email
    const { data: usersData, error: userFindErr } = await supabaseServer.auth.admin.listUsers();
    if (userFindErr) throw userFindErr;

    const targetUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (targetUser) {
      // 2. Update auth user password directly with service role
      const { error: updateErr } = await supabaseServer.auth.admin.updateUserById(targetUser.id, {
        password: newPassword,
      });

      if (updateErr) throw updateErr;

      return res.status(200).json({
        success: true,
        message: 'Password updated successfully in database!',
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'User account not found in authentication system.',
      });
    }
  } catch (err: any) {
    console.error('API /api/admin/change-password error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to update password in database.',
    });
  }
}
