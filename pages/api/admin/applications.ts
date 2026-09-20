import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { randomUUID } from 'crypto';

const isUuid = (str?: string) =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isServerSupabaseConfigured()) {
    return res.status(200).json({ success: false, message: 'Supabase server key not configured', data: [] });
  }

  // GET: Fetch all rental applications (Standard + Direct Portal) with relations
  if (req.method === 'GET') {
    try {
      // 1. Fetch standard rental applications and direct rental applications in parallel
      const [stdAppsRes, directAppsRes] = await Promise.all([
        supabaseServer.from('rental_applications').select('*').order('submitted_at', { ascending: false }),
        supabaseServer.from('direct_rental_applications').select('*').order('submitted_at', { ascending: false }),
      ]);

      const standardRows = stdAppsRes.data || [];
      const directRows = directAppsRes.data || [];

      const allRows = [
        ...standardRows.map((r: any) => ({ ...r, _table: 'rental_applications', is_direct: false })),
        ...directRows.map((r: any) => ({ ...r, _table: 'direct_rental_applications', is_direct: true })),
      ];

      if (allRows.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }

      // Collect related IDs
      const propertyIds = Array.from(new Set(allRows.map((a: any) => a.property_id).filter(isUuid)));
      const unitIds = Array.from(new Set(allRows.map((a: any) => a.unit_id).filter(isUuid)));
      const applicantIds = Array.from(new Set(allRows.map((a: any) => a.applicant_id).filter(isUuid)));
      const stdAppIds = standardRows.map((a: any) => a.id);
      const directAppIds = directRows.map((a: any) => a.id);

      // Fetch related data in parallel
      const [
        propsRes,
        unitsRes,
        profilesRes,
        stdDocsRes,
        directDocsRes,
        imagesRes,
        stdPaymentsRes,
        directPaymentsRes,
      ] = await Promise.all([
        propertyIds.length > 0
          ? supabaseServer
              .from('properties')
              .select('id, title, slug, property_type, street_address, city, state_province, country_name, country_code')
              .in('id', propertyIds)
          : Promise.resolve({ data: [] }),
        unitIds.length > 0
          ? supabaseServer
              .from('property_units')
              .select('id, unit_number_or_name, unit_type, rent_amount, currency_code, security_deposit, bedrooms, bathrooms')
              .in('id', unitIds)
          : Promise.resolve({ data: [] }),
        applicantIds.length > 0
          ? supabaseServer
              .from('profiles')
              .select('id, full_name, email, phone, avatar_url')
              .in('id', applicantIds)
          : Promise.resolve({ data: [] }),
        stdAppIds.length > 0
          ? supabaseServer.from('application_documents').select('*').in('application_id', stdAppIds)
          : Promise.resolve({ data: [] }),
        directAppIds.length > 0
          ? supabaseServer.from('direct_application_documents').select('*').in('direct_application_id', directAppIds)
          : Promise.resolve({ data: [] }),
        propertyIds.length > 0
          ? supabaseServer.from('property_images').select('property_id, storage_path, is_primary, display_order').in('property_id', propertyIds)
          : Promise.resolve({ data: [] }),
        stdAppIds.length > 0
          ? supabaseServer.from('application_payments').select('*').in('application_id', stdAppIds).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        directAppIds.length > 0
          ? supabaseServer.from('direct_application_payments').select('*').in('direct_application_id', directAppIds).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      const propMap = new Map((propsRes.data || []).map((p: any) => [p.id, p]));
      const unitMap = new Map((unitsRes.data || []).map((u: any) => [u.id, u]));
      const profileMap = new Map((profilesRes.data || []).map((prof: any) => [prof.id, prof]));

      const imagesByProp = new Map<string, string>();
      (imagesRes.data || []).forEach((img: any) => {
        if (!imagesByProp.has(img.property_id) || img.is_primary) {
          imagesByProp.set(img.property_id, img.storage_path);
        }
      });

      const docsByApp = new Map<string, any[]>();
      (stdDocsRes.data || []).forEach((d: any) => {
        const list = docsByApp.get(d.application_id) || [];
        list.push(d);
        docsByApp.set(d.application_id, list);
      });
      (directDocsRes.data || []).forEach((d: any) => {
        const list = docsByApp.get(d.direct_application_id) || [];
        list.push(d);
        docsByApp.set(d.direct_application_id, list);
      });

      const paymentsByApp = new Map<string, any[]>();
      (stdPaymentsRes.data || []).forEach((p: any) => {
        const list = paymentsByApp.get(p.application_id) || [];
        list.push(p);
        paymentsByApp.set(p.application_id, list);
      });
      (directPaymentsRes.data || []).forEach((p: any) => {
        const list = paymentsByApp.get(p.direct_application_id) || [];
        list.push(p);
        paymentsByApp.set(p.direct_application_id, list);
      });

      const formatted = allRows.map((row: any) => {
        const prop = propMap.get(row.property_id);
        const unit = unitMap.get(row.unit_id);
        const profile = profileMap.get(row.applicant_id);
        const docs = docsByApp.get(row.id) || [];
        const appPayments = paymentsByApp.get(row.id) || [];
        const propImage =
          imagesByProp.get(row.property_id) ||
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

        const rawSSN = row.applicant_ssn || (row.id ? `***-**-${row.id.slice(-4)}` : '***-**-4891');

        return {
          id: row.id,
          application_ref: row.application_ref || `APP-${row.id.slice(0, 8).toUpperCase()}`,
          is_direct: Boolean(row.is_direct),
          source: row.is_direct ? 'direct' : 'listing',
          link_id: row.link_id || null,
          applicant_id: row.applicant_id,
          applicant_name: row.applicant_name || profile?.full_name || 'Applicant',
          applicant_email: row.applicant_email || profile?.email || 'applicant@bluesky.com',
          applicant_phone: row.applicant_phone || profile?.phone || '+1 (555) 000-0000',
          applicant_dob: row.applicant_dob,
          applicant_nationality: row.applicant_nationality || 'United States',
          applicant_address: row.applicant_address || '',
          applicant_employer: row.applicant_employer || '',
          applicant_occupation: row.applicant_occupation || '',
          applicant_income: row.applicant_income ? Number(row.applicant_income) : 0,
          applicant_ssn: rawSSN,
          property_id: row.property_id,
          property_title: prop?.title || (row.is_direct ? 'General Intake Application' : 'Luxury Property Listing'),
          property_image: propImage,
          property_address: prop?.street_address || (prop ? `${prop.city}, ${prop.state_province}` : 'Direct Tenant Portal'),
          unit_id: row.unit_id,
          unit_name: unit?.unit_number_or_name || 'Main Residence',
          unit_rent: unit?.rent_amount ? Number(unit.rent_amount) : 0,
          unit_currency: unit?.currency_code || 'USD',
          unit_bedrooms: unit?.bedrooms ?? 1,
          unit_bathrooms: unit?.bathrooms ?? 1,
          status: row.status || 'submitted',
          desired_move_in: row.desired_move_in || new Date().toISOString().split('T')[0],
          lease_term_months: Number(row.lease_term_months) || 12,
          occupants_count: Number(row.occupants_count) || 1,
          has_pets: Boolean(row.has_pets),
          pets_description: row.pets_description,
          additional_notes: row.additional_notes,
          admin_notes: row.admin_notes,
          documents: docs,
          payment: appPayments[0] || null,
          payments: appPayments,
          submitted_at: row.submitted_at || row.created_at || new Date().toISOString(),
          reviewed_at: row.reviewed_at,
          reviewed_by: row.reviewed_by,
        };
      });

      // Sort by submitted_at desc
      formatted.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

      return res.status(200).json({ success: true, data: formatted });
    } catch (err: any) {
      console.error('API /api/admin/applications GET error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PATCH: Update Application Status & Record Audit / In-App Notification
  if (req.method === 'PATCH') {
    try {
      const { id, status, admin_notes } = req.body;

      if (!id || !status) {
        return res.status(400).json({ success: false, error: 'Application ID and new status required' });
      }

      const updatePayload: any = {
        status,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (admin_notes !== undefined) {
        updatePayload.admin_notes = admin_notes;
      }

      // Try updating standard rental_applications first
      let updatedApps: any[] | null = null;
      let appRecord: any = null;

      let stdQuery = supabaseServer.from('rental_applications').update(updatePayload);
      if (isUuid(id)) {
        stdQuery = stdQuery.eq('id', id);
      } else {
        stdQuery = stdQuery.eq('application_ref', id);
      }
      const { data: stdData } = await stdQuery.select('*');

      if (stdData && stdData.length > 0) {
        appRecord = stdData[0];
      } else {
        // Try updating direct_rental_applications
        let directQuery = supabaseServer.from('direct_rental_applications').update(updatePayload);
        if (isUuid(id)) {
          directQuery = directQuery.eq('id', id);
        } else {
          directQuery = directQuery.eq('application_ref', id);
        }
        const { data: directData } = await directQuery.select('*');
        if (directData && directData.length > 0) {
          appRecord = directData[0];
        }
      }

      if (appRecord) {
        // Create In-App Notification if applicant has a profile
        if (appRecord.applicant_id && isUuid(appRecord.applicant_id)) {
          try {
            const isApproved = status === 'approved';
            const isRejected = status === 'rejected';

            let notifTitle = 'Rental Application Update';
            let notifMessage = `Your rental application #${appRecord.application_ref} status has been updated to ${status}.`;

            if (isApproved) {
              notifTitle = 'Rental Application Approved';
              notifMessage = `Congratulations! Your rental application #${appRecord.application_ref} has been approved by the property team. Our manager will contact you via email regarding the lease agreement.`;
            } else if (isRejected) {
              notifTitle = 'Rental Application Notice';
              notifMessage = `Your rental application #${appRecord.application_ref} could not be approved at this time. Reason: ${admin_notes || 'Criteria not met.'}`;
            }

            await supabaseServer.from('notifications').insert({
              profile_id: appRecord.applicant_id,
              type: 'application',
              title: notifTitle,
              message: notifMessage,
              link_url: '/applicant/applications',
              is_read: false,
              created_at: new Date().toISOString(),
            });
          } catch (notifErr) {
            console.warn('In-app notification dispatch note:', notifErr);
          }
        }
      }

      return res.status(200).json({ success: true, message: `Application updated to ${status}`, data: appRecord });
    } catch (err: any) {
      console.error('API /api/admin/applications PATCH error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE: Single or Bulk Rental Application Deletion
  if (req.method === 'DELETE') {
    try {
      const { id, ids } = req.body || {};
      const targetIds: string[] = [];

      if (Array.isArray(ids) && ids.length > 0) {
        targetIds.push(...ids.filter((i: any) => typeof i === 'string' && i.length > 0));
      } else if (id && typeof id === 'string') {
        targetIds.push(id);
      } else if (req.query.id && typeof req.query.id === 'string') {
        targetIds.push(req.query.id as string);
      }

      if (targetIds.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid application ID(s) provided for deletion' });
      }

      const uuidTargets = targetIds.filter(isUuid);
      const refTargets = targetIds.filter((t) => !isUuid(t));

      // 1. Fetch document and payment proof files from Supabase Storage
      try {
        const [stdDocsRes, directDocsRes, stdPayRes, directPayRes] = await Promise.all([
          uuidTargets.length > 0
            ? supabaseServer.from('application_documents').select('storage_path').in('application_id', uuidTargets)
            : Promise.resolve({ data: [] }),
          uuidTargets.length > 0
            ? supabaseServer.from('direct_application_documents').select('storage_path').in('direct_application_id', uuidTargets)
            : Promise.resolve({ data: [] }),
          uuidTargets.length > 0
            ? supabaseServer.from('application_payments').select('proof_storage_path, storage_path').in('application_id', uuidTargets)
            : Promise.resolve({ data: [] }),
          uuidTargets.length > 0
            ? supabaseServer.from('direct_application_payments').select('proof_storage_path, storage_path').in('direct_application_id', uuidTargets)
            : Promise.resolve({ data: [] }),
        ]);

        const extractBucketKey = (raw?: string | null, bucket = 'applicant-vault') => {
          if (!raw || typeof raw !== 'string') return null;
          let p = raw.trim();
          if (p.startsWith('data:') || p.startsWith('blob:')) return null;
          if (p.includes('/api/vault/view')) {
            try {
              const urlObj = new URL(p, 'http://localhost');
              const pathParam = urlObj.searchParams.get('path');
              if (pathParam) p = decodeURIComponent(pathParam);
            } catch (e) {}
          }
          if (p.includes(`/storage/v1/object/public/${bucket}/`)) {
            p = p.split(`/storage/v1/object/public/${bucket}/`)[1] || p;
          } else if (p.includes('/storage/v1/object/public/')) {
            p = p.split('/storage/v1/object/public/')[1] || p;
          }
          if (p.startsWith(`${bucket}/`)) {
            p = p.replace(new RegExp(`^${bucket}/`), '');
          }
          p = p.replace(/^\/+/, '');
          if (p.startsWith('http://') || p.startsWith('https://')) return null;
          return p.length > 0 ? p : null;
        };

        const allDocKeys = Array.from(
          new Set(
            [...(stdDocsRes.data || []), ...(directDocsRes.data || [])]
              .map((d: any) => extractBucketKey(d.storage_path, 'applicant-vault'))
              .filter(Boolean) as string[]
          )
        );

        const allPayKeys = Array.from(
          new Set(
            [...(stdPayRes.data || []), ...(directPayRes.data || [])]
              .map((p: any) => extractBucketKey(p.proof_storage_path || p.storage_path, 'payment-proofs-vault'))
              .filter(Boolean) as string[]
          )
        );

        if (allDocKeys.length > 0) {
          const { error: docRemErr } = await supabaseServer.storage.from('applicant-vault').remove(allDocKeys);
          if (docRemErr) console.warn('Applicant vault files removal note:', docRemErr.message);
        }

        if (allPayKeys.length > 0) {
          const { error: payRemErr } = await supabaseServer.storage.from('payment-proofs-vault').remove(allPayKeys);
          if (payRemErr) console.warn('Payment proofs storage removal note:', payRemErr.message);
        }
      } catch (storageErr) {
        console.warn('Storage cleanup note during application delete:', storageErr);
      }

      // 2. Delete cascading documents & payments for standard and direct applications
      await Promise.all([
        uuidTargets.length > 0 ? supabaseServer.from('application_documents').delete().in('application_id', uuidTargets) : Promise.resolve(),
        uuidTargets.length > 0 ? supabaseServer.from('application_payments').delete().in('application_id', uuidTargets) : Promise.resolve(),
        uuidTargets.length > 0 ? supabaseServer.from('application_status_history').delete().in('application_id', uuidTargets) : Promise.resolve(),
        uuidTargets.length > 0 ? supabaseServer.from('direct_application_documents').delete().in('direct_application_id', uuidTargets) : Promise.resolve(),
        uuidTargets.length > 0 ? supabaseServer.from('direct_application_payments').delete().in('direct_application_id', uuidTargets) : Promise.resolve(),
      ]);

      // 2. Delete standard applications
      if (uuidTargets.length > 0) {
        await supabaseServer.from('rental_applications').delete().in('id', uuidTargets);
        await supabaseServer.from('direct_rental_applications').delete().in('id', uuidTargets);
      }
      if (refTargets.length > 0) {
        await supabaseServer.from('rental_applications').delete().in('application_ref', refTargets);
        await supabaseServer.from('direct_rental_applications').delete().in('application_ref', refTargets);
      }

      return res.status(200).json({
        success: true,
        message: `Successfully deleted ${targetIds.length} rental application(s).`,
        deletedCount: targetIds.length,
        deletedIds: targetIds,
      });
    } catch (err: any) {
      console.error('API /api/admin/applications DELETE error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
