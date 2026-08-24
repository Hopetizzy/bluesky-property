import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { store } from '../store';
import { RentalApplication, ApplicationDocument, ApplicationStatus } from '../types';

export const applicationsDb = {
  // 1. Get applications for applicant
  async getApplications(): Promise<RentalApplication[]> {
    if (!isSupabaseConfigured()) {
      return store.getApplications();
    }

    try {
      const { data, error } = await supabase
        .from('rental_applications')
        .select(`
          *,
          application_documents (*)
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        documents: row.application_documents || [],
      }));
    } catch {
      return store.getApplications();
    }
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
  async updateApplicationStatus(id: string, status: ApplicationStatus, reviewerName: string): Promise<void> {
    const apps = store.getApplications();
    const target = apps.find((a) => a.id === id);
    if (target) {
      target.status = status;
      target.reviewed_at = new Date().toISOString();
      target.reviewed_by = reviewerName;
      store.saveApplication(target);
    }

    if (isSupabaseConfigured()) {
      await supabase
        .from('rental_applications')
        .update({
          status: status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerName,
        })
        .eq('id', id);
    }
  },
};
