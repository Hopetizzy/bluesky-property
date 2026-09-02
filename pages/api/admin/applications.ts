import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { randomUUID } from 'crypto';

const isUuid = (str?: string) =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isServerSupabaseConfigured()) {
    return res.status(200).json({ success: false, message: 'Supabase server key not configured', data: [] });
  }

  // GET: Fetch all rental applications with relations
  if (req.method === 'GET') {
    try {
      // 1. Fetch rental applications
      const { data: appRows, error: appErr } = await supabaseServer
        .from('rental_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (appErr) throw appErr;

      if (!appRows || appRows.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }

      // Collect related IDs
      const propertyIds = Array.from(new Set(appRows.map((a: any) => a.property_id).filter(isUuid)));
      const unitIds = Array.from(new Set(appRows.map((a: any) => a.unit_id).filter(isUuid)));
      const applicantIds = Array.from(new Set(appRows.map((a: any) => a.applicant_id).filter(isUuid)));
      const appIds = appRows.map((a: any) => a.id);

      // Fetch related data in parallel
      const [propsRes, unitsRes, profilesRes, docsRes, imagesRes] = await Promise.all([
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
        appIds.length > 0
          ? supabaseServer
              .from('application_documents')
              .select('*')
              .in('application_id', appIds)
          : Promise.resolve({ data: [] }),
        propertyIds.length > 0
          ? supabaseServer
              .from('property_images')
              .select('property_id, storage_path, is_primary, display_order')
              .in('property_id', propertyIds)
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
      (docsRes.data || []).forEach((d: any) => {
        const list = docsByApp.get(d.application_id) || [];
        list.push(d);
        docsByApp.set(d.application_id, list);
      });

      const formatted = appRows.map((row: any) => {
        const prop = propMap.get(row.property_id);
        const unit = unitMap.get(row.unit_id);
        const profile = profileMap.get(row.applicant_id);
        const docs = docsByApp.get(row.id) || [];
        const propImage = imagesByProp.get(row.property_id) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

        // Extract or format SSN
        const rawSSN = row.applicant_ssn || (row.id ? `***-**-${row.id.slice(-4)}` : '***-**-4891');

        return {
          id: row.id,
          application_ref: row.application_ref || `APP-${row.id.slice(0, 8).toUpperCase()}`,
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
          property_title: prop?.title || 'Luxury Property Listing',
          property_image: propImage,
          property_address: prop?.street_address || (prop ? `${prop.city}, ${prop.state_province}` : 'Peachtree St NE, Atlanta'),
          unit_id: row.unit_id,
          unit_name: unit?.unit_number_or_name || 'Main Residence',
          unit_rent: unit?.rent_amount ? Number(unit.rent_amount) : 2500,
          unit_currency: unit?.currency_code || 'USD',
          unit_bedrooms: unit?.bedrooms ?? 2,
          unit_bathrooms: unit?.bathrooms ?? 2,
          status: row.status || 'submitted',
          desired_move_in: row.desired_move_in || new Date().toISOString().split('T')[0],
          lease_term_months: Number(row.lease_term_months) || 12,
          occupants_count: Number(row.occupants_count) || 1,
          has_pets: Boolean(row.has_pets),
          pets_description: row.pets_description,
          additional_notes: row.additional_notes,
          admin_notes: row.admin_notes,
          documents: docs,
          submitted_at: row.submitted_at || row.created_at || new Date().toISOString(),
          reviewed_at: row.reviewed_at,
          reviewed_by: row.reviewed_by,
        };
      });

      return res.status(200).json({ success: true, data: formatted });
    } catch (err: any) {
      console.error('API /api/admin/applications GET error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PATCH: Update Application Status & Record Audit / In-App Notification
  if (req.method === 'PATCH') {
    try {
      const { id, status, admin_notes, reviewer_name } = req.body;
      if (!id || !status) {
        return res.status(400).json({ success: false, error: 'Application ID and status required' });
      }

      const updatePayload: any = {
        status: status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer_name || 'Super Admin',
        updated_at: new Date().toISOString(),
      };

      if (admin_notes !== undefined) {
        updatePayload.admin_notes = admin_notes;
      }

      // 1. Update rental_applications record
      let query = supabaseServer.from('rental_applications').update(updatePayload);
      if (isUuid(id)) {
        query = query.eq('id', id);
      } else {
        query = query.eq('application_ref', id);
      }

      const { data: updatedApps, error: updateErr } = await query.select('*');
      if (updateErr) throw updateErr;

      const appRecord = updatedApps && updatedApps.length > 0 ? updatedApps[0] : null;

      if (appRecord) {
        // 2. Audit Trail History record
        try {
          await supabaseServer.from('application_status_history').insert({
            application_id: appRecord.id,
            new_status: status,
            notes: admin_notes || `Status transitioned to ${status}`,
            created_at: new Date().toISOString(),
          });
        } catch (auditErr) {
          console.warn('Status history insert note:', auditErr);
        }

        // 3. Create In-App Notification for Tenant
        if (appRecord.applicant_id && isUuid(appRecord.applicant_id)) {
          try {
            const isApproved = status === 'approved';
            const isRejected = status === 'rejected';

            let notifTitle = '📋 Rental Application Update';
            let notifMessage = `Your rental application #${appRecord.application_ref} status has been updated to ${status}.`;

            if (isApproved) {
              notifTitle = '🎉 Rental Application Approved!';
              notifMessage = `Congratulations! Your rental application #${appRecord.application_ref} has been approved by the property team. Our manager will contact you via email regarding the lease agreement.`;
            } else if (isRejected) {
              notifTitle = 'Rental Application Notice';
              notifMessage = `Your rental application #${appRecord.application_ref} could not be approved at this time. Reason: ${admin_notes || 'Criteria not met.'}`;
            }

            await supabaseServer.from('notifications').insert({
              profile_id: appRecord.applicant_id,
              type: 'application_status',
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

  return res.status(405).json({ error: 'Method not allowed' });
}
