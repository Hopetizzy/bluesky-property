import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

const isUuid = (str?: string) =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const documentId = req.body?.documentId || req.query?.documentId || req.body?.id || req.query?.id;
    const storagePath = req.body?.storagePath || req.query?.storagePath || req.body?.storage_path;
    const fileName = req.body?.fileName || req.query?.fileName || req.body?.name;
    const bucket = req.body?.bucket || req.query?.bucket || 'applicant-vault';
    const userEmail = req.body?.userEmail || req.query?.userEmail;

    // 1. Delete database record from application_documents table if documentId is a UUID or matches
    if (isServerSupabaseConfigured() && documentId) {
      try {
        if (isUuid(String(documentId))) {
          await supabaseServer
            .from('application_documents')
            .delete()
            .eq('id', documentId);
        } else if (fileName) {
          await supabaseServer
            .from('application_documents')
            .delete()
            .eq('file_name', fileName);
        }
      } catch (dbErr) {
        console.warn('Database application_documents delete note:', dbErr);
      }
    }

    // 2. Delete from Supabase Storage bucket if configured
    if (isServerSupabaseConfigured() && (storagePath || fileName)) {
      try {
        const pathsToDelete: string[] = [];
        if (storagePath) {
          const cleanPath = String(storagePath).replace(/^\/+/, '').replace(/^applicant-vault\//, '').replace(/^vault\//, '');
          pathsToDelete.push(cleanPath);
          pathsToDelete.push(String(storagePath).replace(/^\/+/, ''));
        }
        if (fileName) {
          pathsToDelete.push(String(fileName));
          if (userEmail) {
            const folder = `vault_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
            pathsToDelete.push(`${folder}/${fileName}`);
          }
        }

        if (pathsToDelete.length > 0) {
          await supabaseServer.storage.from(bucket).remove(pathsToDelete);
        }
      } catch (storageErr) {
        console.warn('Supabase storage delete note:', storageErr);
      }
    }

    // 3. Remove from local public/vault directory if stored locally
    try {
      const publicVaultDir = path.join(process.cwd(), 'public', 'vault');
      const candidates: string[] = [];

      if (storagePath) {
        const cleanP = String(storagePath).replace(/^\/+/, '').replace(/^vault\//, '');
        candidates.push(path.join(publicVaultDir, cleanP));
      }
      if (fileName) {
        candidates.push(path.join(publicVaultDir, String(fileName)));
        if (userEmail) {
          const folder = `vault_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
          candidates.push(path.join(publicVaultDir, folder, String(fileName)));
        }
      }

      for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {}
        }
      }
    } catch (diskErr) {
      console.warn('Local disk vault delete note:', diskErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Document permanently deleted from vault',
      deletedId: documentId,
    });
  } catch (err: any) {
    console.error('API /api/vault/delete error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Delete operation failed' });
  }
}
