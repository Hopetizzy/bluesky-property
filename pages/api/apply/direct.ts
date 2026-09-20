import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { randomBytes } from 'crypto';

const isUuid = (str?: string) =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isServerSupabaseConfigured()) {
    return res.status(200).json({ success: false, message: 'Supabase server key not configured' });
  }

  // GET: Fetch application link details by token
  if (req.method === 'GET') {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, error: 'Token is required' });
      }

      // 1. Fetch link
      const { data: link, error: linkErr } = await supabaseServer
        .from('admin_application_links')
        .select('*')
        .eq('token', token.toLowerCase().trim())
        .maybeSingle();

      if (linkErr) throw linkErr;

      if (!link) {
        return res.status(404).json({ success: false, error: 'Application portal link not found or expired' });
      }

      if (!link.is_active) {
        return res.status(410).json({ success: false, error: 'This application portal link has been deactivated by administration.' });
      }

      if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
        return res.status(410).json({ success: false, error: 'This application portal link has expired.' });
      }

      // 2. Fetch assigned properties if configured
      let assignedProperties: any[] = [];
      const assignedIds = Array.isArray(link.assigned_property_ids) ? link.assigned_property_ids.filter(isUuid) : [];

      if (assignedIds.length > 0) {
        const [propsRes, unitsRes, imagesRes] = await Promise.all([
          supabaseServer
            .from('properties')
            .select('id, title, slug, property_type, street_address, city, state_province, country_code')
            .in('id', assignedIds),
          supabaseServer
            .from('property_units')
            .select('id, property_id, unit_number_or_name, unit_type, rent_amount, currency_code, bedrooms, bathrooms')
            .in('property_id', assignedIds),
          supabaseServer
            .from('property_images')
            .select('property_id, storage_path, is_primary')
            .in('property_id', assignedIds),
        ]);

        const unitsByProp = new Map<string, any[]>();
        (unitsRes.data || []).forEach((u: any) => {
          const list = unitsByProp.get(u.property_id) || [];
          list.push(u);
          unitsByProp.set(u.property_id, list);
        });

        const imagesByProp = new Map<string, string>();
        (imagesRes.data || []).forEach((img: any) => {
          if (!imagesByProp.has(img.property_id) || img.is_primary) {
            imagesByProp.set(img.property_id, img.storage_path);
          }
        });

        assignedProperties = (propsRes.data || []).map((p: any) => ({
          ...p,
          image: imagesByProp.get(p.id) || '',
          units: unitsByProp.get(p.id) || [],
        }));
      }

      // 3. Fetch active payment methods
      const { data: paymentMethods } = await supabaseServer
        .from('payment_methods')
        .select('*')
        .eq('is_active', true);

      return res.status(200).json({
        success: true,
        data: {
          id: link.id,
          token: link.token,
          title: link.title || 'Direct Rental Application Portal',
          instructions: link.instructions || '',
          fee_enabled: Boolean(link.fee_enabled),
          fee_amount: Number(link.fee_amount) || 50,
          currency_code: link.currency_code || 'USD',
          assigned_properties: assignedProperties,
          has_assigned_properties: assignedProperties.length > 0,
          payment_methods: paymentMethods || [],
        },
      });
    } catch (err: any) {
      console.error('API /api/apply/direct GET error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST: Submit direct 6-step rental application
  if (req.method === 'POST') {
    try {
      const body = req.body;
      const {
        token,
        link_id,
        // Step 1: Personal info
        full_name,
        email,
        phone,
        dob,
        nationality,
        // Optional property choice
        property_id,
        unit_id,
        // Step 2 & 3: ID, SSN, Employment, Address
        ssn_number,
        employer,
        occupation,
        monthly_income,
        current_address,
        documents, // Array of { document_type, file_name, storage_path, mime_type, file_size_bytes }
        // Step 4: Lease preferences
        desired_move_in,
        lease_term_months,
        occupants_count,
        has_pets,
        pets_description,
        additional_notes,
        // Step 5: Application payment receipt
        payment_method_id,
        payment_method_name,
        payment_amount,
        proof_storage_path,
        proof_file_name,
      } = body;

      if (!email || !full_name || !phone) {
        return res.status(400).json({ success: false, error: 'Full name, email address, and phone number are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // 1. Auto-Provision or Find Applicant Profile
      let applicantProfileId: string | null = null;
      const { data: existingProfile } = await supabaseServer
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingProfile?.id) {
        applicantProfileId = existingProfile.id;
      } else {
        // Create applicant profile for guest
        const { data: newProfile, error: profileErr } = await supabaseServer
          .from('profiles')
          .insert({
            email: normalizedEmail,
            full_name: full_name.trim(),
            phone: phone.trim(),
            role: 'applicant',
            status: 'active',
            country_code: nationality === 'Canada' ? 'CAN' : nationality === 'United Kingdom' ? 'GBR' : 'USA',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (newProfile?.id) {
          applicantProfileId = newProfile.id;
        }
      }

      // 2. Generate unique application reference
      const refSuffix = randomBytes(3).toString('hex').toUpperCase();
      const applicationRef = `DIR-${refSuffix}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 3. Insert into direct_rental_applications
      const appPayload: any = {
        application_ref: applicationRef,
        link_id: link_id && isUuid(link_id) ? link_id : null,
        applicant_id: applicantProfileId,
        property_id: property_id && isUuid(property_id) ? property_id : null,
        unit_id: unit_id && isUuid(unit_id) ? unit_id : null,
        applicant_name: full_name.trim(),
        applicant_email: normalizedEmail,
        applicant_phone: phone.trim(),
        applicant_dob: dob || null,
        applicant_nationality: nationality || 'United States',
        applicant_address: current_address || null,
        applicant_employer: employer || null,
        applicant_occupation: occupation || null,
        applicant_income: monthly_income ? Number(monthly_income) : null,
        applicant_ssn: ssn_number || null,
        status: 'submitted',
        desired_move_in: desired_move_in || new Date().toISOString().split('T')[0],
        lease_term_months: Number(lease_term_months) || 12,
        occupants_count: Number(occupants_count) || 1,
        has_pets: Boolean(has_pets),
        pets_description: pets_description || null,
        additional_notes: additional_notes || null,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: insertedApp, error: appErr } = await supabaseServer
        .from('direct_rental_applications')
        .insert(appPayload)
        .select('*')
        .single();

      if (appErr) throw appErr;

      const directAppId = insertedApp.id;

      // 4. Insert uploaded documents into direct_application_documents
      if (Array.isArray(documents) && documents.length > 0) {
        const docRows = documents
          .filter((d: any) => d && (d.storage_path || d.previewUrl))
          .map((d: any) => ({
            direct_application_id: directAppId,
            document_type: d.document_type || 'other',
            file_name: d.file_name || d.name || 'document.pdf',
            storage_path: d.storage_path || d.previewUrl || '',
            file_size_bytes: d.file_size_bytes || d.bytes || 1024000,
            mime_type: d.mime_type || d.type || 'application/pdf',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

        if (docRows.length > 0) {
          await supabaseServer.from('direct_application_documents').insert(docRows);
        }
      }

      // 5. Insert payment proof if provided
      if (proof_storage_path) {
        await supabaseServer.from('direct_application_payments').insert({
          direct_application_id: directAppId,
          applicant_id: applicantProfileId,
          payment_method_id: payment_method_id && isUuid(payment_method_id) ? payment_method_id : null,
          payment_method_name: payment_method_name || 'Direct Transfer',
          amount: payment_amount !== undefined ? Number(payment_amount) : 50.0,
          currency_code: 'USD',
          proof_storage_path: proof_storage_path,
          proof_file_name: proof_file_name || 'payment_proof.jpg',
          status: 'pending',
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // 6. Notify Administrators of direct applicant intake
      try {
        await supabaseServer.from('notifications').insert({
          type: 'application',
          title: 'Direct Rental Application Intake',
          message: `New direct application #${applicationRef} submitted by ${full_name.trim()} (${normalizedEmail}).`,
          link_url: '/admin/applications',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      } catch (notifErr) {
        console.warn('Admin notification note:', notifErr);
      }

      return res.status(201).json({
        success: true,
        message: 'Rental application successfully submitted! Your reference ID is ' + applicationRef,
        application_ref: applicationRef,
        application_id: directAppId,
      });
    } catch (err: any) {
      console.error('API /api/apply/direct POST error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
