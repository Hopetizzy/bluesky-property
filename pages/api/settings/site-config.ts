import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';

export interface SiteConfigSettings {
  support_email: string;
  support_phone: string;
  office_address: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfigSettings = {
  support_email: 'support@blueskyproperty.com',
  support_phone: '+1 (800) 555-0199',
  office_address: '9454 Wilshire Blvd, Suite 600, Beverly Hills, CA 90212',
  facebook_url: 'https://facebook.com/blueskyproperty',
  twitter_url: 'https://twitter.com/blueskyprop',
  instagram_url: 'https://instagram.com/blueskyproperty',
  linkedin_url: 'https://linkedin.com/company/blueskyproperty',
  youtube_url: 'https://youtube.com/@blueskyproperty',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: Fetch current site settings from system_settings
  if (req.method === 'GET') {
    if (!isServerSupabaseConfigured()) {
      return res.status(200).json({ success: true, data: DEFAULT_SITE_CONFIG });
    }

    try {
      const { data, error } = await supabaseServer
        .from('system_settings')
        .select('*')
        .eq('key', 'site_config')
        .maybeSingle();

      if (error) throw error;

      const config: SiteConfigSettings = data?.value
        ? { ...DEFAULT_SITE_CONFIG, ...data.value }
        : DEFAULT_SITE_CONFIG;

      return res.status(200).json({ success: true, data: config });
    } catch (err: any) {
      console.warn('API /api/settings/site-config GET note:', err);
      return res.status(200).json({ success: true, data: DEFAULT_SITE_CONFIG });
    }
  }

  // POST: Update site settings in system_settings
  if (req.method === 'POST') {
    const configPayload = req.body;

    if (!configPayload || typeof configPayload !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid settings payload' });
    }

    const updatedConfig: SiteConfigSettings = {
      support_email: configPayload.support_email?.trim() || DEFAULT_SITE_CONFIG.support_email,
      support_phone: configPayload.support_phone?.trim() || DEFAULT_SITE_CONFIG.support_phone,
      office_address: configPayload.office_address?.trim() || DEFAULT_SITE_CONFIG.office_address,
      facebook_url: configPayload.facebook_url?.trim() || DEFAULT_SITE_CONFIG.facebook_url,
      twitter_url: configPayload.twitter_url?.trim() || DEFAULT_SITE_CONFIG.twitter_url,
      instagram_url: configPayload.instagram_url?.trim() || DEFAULT_SITE_CONFIG.instagram_url,
      linkedin_url: configPayload.linkedin_url?.trim() || DEFAULT_SITE_CONFIG.linkedin_url,
      youtube_url: configPayload.youtube_url?.trim() || DEFAULT_SITE_CONFIG.youtube_url,
    };

    if (!isServerSupabaseConfigured()) {
      return res.status(200).json({
        success: true,
        message: 'Settings saved in local mode!',
        data: updatedConfig,
      });
    }

    try {
      const { error } = await supabaseServer
        .from('system_settings')
        .upsert({
          key: 'site_config',
          value: updatedConfig,
          description: 'Global Brand support contact information and social media links displayed on site footer',
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Brand support & social links updated successfully in database!',
        data: updatedConfig,
      });
    } catch (err: any) {
      console.error('API /api/settings/site-config POST error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
