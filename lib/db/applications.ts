import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { store } from '../store';
import { RentalApplication, ApplicationDocument, ApplicationStatus } from '../types';

export const applicationsDb = {
  // 1. Get applications (Admin / Applicant)
  async getApplications(): Promise<RentalApplication[]> {
    // 1. Try Next.js Server-Side Service Role API endpoint (bypasses RLS to guarantee DB read)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/applications');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          json.data.forEach((app: RentalApplication) => store.saveApplication(app));
          return json.data;
        }
      } catch (apiErr) {
        console.warn('API /api/admin/applications fetch fallback note:', apiErr);
      }
    }

    // 2. Direct Supabase Client fallback
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('rental_applications')
          .select(`
            *,
            application_documents (*)
          `)
          .order('submitted_at', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          const mapped = data.map((row: any) => ({
            ...row,
            documents: row.application_documents || [],
          }));
          mapped.forEach((app: any) => store.saveApplication(app));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase client getApplications note:', err);
      }
    }

    return store.getApplications();
  },

  // 2. Submit new Rental Application
  async submitApplication(app: RentalApplication): Promise<RentalApplication> {
    store.saveApplication(app);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('rental_applications').insert({
          id: app.id,
          application_ref: app.application_ref,
          applicant_id: app.applicant_id,
          property_id: app.property_id,
          unit_id: app.unit_id,
          applicant_name: app.applicant_name,
          applicant_email: app.applicant_email,
          applicant_phone: app.applicant_phone,
          applicant_dob: app.applicant_dob,
          applicant_nationality: app.applicant_nationality,
          applicant_address: app.applicant_address,
          applicant_employer: app.applicant_employer,
          applicant_occupation: app.applicant_occupation,
          applicant_income: app.applicant_income,
          status: app.status,
          desired_move_in: app.desired_move_in,
          lease_term_months: app.lease_term_months,
          occupants_count: app.occupants_count,
          has_pets: app.has_pets,
          additional_notes: app.additional_notes,
          submitted_at: app.submitted_at,
        });

        if (error) console.error('Supabase app insert error:', error);
      } catch (err) {
        console.error('Supabase app submit error:', err);
      }
    }

    return app;
  },

  // 3. Update Application Status (Admin Audit Decision)
  async updateApplicationStatus(id: string, status: ApplicationStatus, reviewerName: string, adminNotes?: string): Promise<void> {
    const apps = store.getApplications();
    const target = apps.find((a) => a.id === id);
    if (target) {
      target.status = status;
      target.reviewed_at = new Date().toISOString();
      target.reviewed_by = reviewerName;
      if (adminNotes !== undefined) target.admin_notes = adminNotes;
      store.saveApplication(target);
    }

    // 1. Try Next.js Server-Side Service Role API endpoint (guarantees DB write, audit history, & notification)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/applications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status, reviewer_name: reviewerName, admin_notes: adminNotes }),
        });
        const json = await res.json();
        if (json.success) return;
      } catch (apiErr) {
        console.warn('API /api/admin/applications PATCH note:', apiErr);
      }
    }

    // 2. Direct Supabase Client fallback
    if (isSupabaseConfigured()) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          await supabase
            .from('rental_applications')
            .update({
              status: status,
              reviewed_at: new Date().toISOString(),
              reviewed_by: reviewerName,
              admin_notes: adminNotes,
            })
            .eq('id', id);
        }
      } catch (err) {
        console.error('Supabase updateApplicationStatus error:', err);
      }
    }
  },
};
