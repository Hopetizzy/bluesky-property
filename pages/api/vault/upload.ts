import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { fileName, fileData, bucket = 'applicant-vault', folder = 'vault' } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ success: false, error: 'fileName and fileData (base64) are required' });
    }

    // Extract base64 payload & mime type
    let mimeType = 'application/octet-stream';
    let base64Content = fileData;

    const dataUriMatch = fileData.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUriMatch) {
      mimeType = dataUriMatch[1];
      base64Content = dataUriMatch[2];
    }

    const buffer = Buffer.from(base64Content, 'base64');
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueStoragePath = `${folder}/${Date.now()}_${safeName}`;

    // 1. Persist file to local public/vault directory so it can ALWAYS be read instantly
    try {
      const publicVaultDir = path.join(process.cwd(), 'public', 'vault');
      if (!fs.existsSync(publicVaultDir)) {
        fs.mkdirSync(publicVaultDir, { recursive: true });
      }

      const folderDir = path.join(publicVaultDir, folder);
      if (!fs.existsSync(folderDir)) {
        fs.mkdirSync(folderDir, { recursive: true });
      }

      // Save under folder and root vault paths
      fs.writeFileSync(path.join(folderDir, safeName), buffer);
      fs.writeFileSync(path.join(publicVaultDir, safeName), buffer);
      fs.writeFileSync(path.join(publicVaultDir, fileName), buffer);
      fs.writeFileSync(path.join(publicVaultDir, `${Date.now()}_${safeName}`), buffer);
    } catch (diskErr) {
      console.warn('Local disk vault save note:', diskErr);
    }

    let signedUrl = '';
    const viewUrl = `/api/vault/view?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(uniqueStoragePath)}`;

    // 2. Upload to Supabase Storage if configured
    if (isServerSupabaseConfigured()) {
      try {
        const { error: uploadErr } = await supabaseServer.storage
          .from(bucket)
          .upload(uniqueStoragePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadErr) {
          const { data: signedData } = await supabaseServer.storage
            .from(bucket)
            .createSignedUrl(uniqueStoragePath, 60 * 60 * 24 * 7); // 7 days

          if (signedData?.signedUrl) {
            signedUrl = signedData.signedUrl;
          }
        } else {
          console.warn('Supabase storage upload note:', uploadErr.message);
        }
      } catch (err: any) {
        console.warn('Storage operation note:', err?.message || err);
      }
    }

    return res.status(200).json({
      success: true,
      storage_path: uniqueStoragePath,
      view_url: signedUrl || viewUrl,
      preview_url: signedUrl || viewUrl,
      direct_url: viewUrl,
      file_name: fileName,
      file_size_bytes: buffer.length,
      mime_type: mimeType,
    });
  } catch (err: any) {
    console.error('Vault upload error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Vault upload failed' });
  }
}
