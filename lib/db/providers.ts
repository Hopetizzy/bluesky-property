import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { store } from '../store';

export interface ProviderAdminView {
  id: string;
  profile_id?: string;
  account_role: 'provider' | 'tenant';
  name: string;
  type: string;
  email: string;
  phone: string;
  license: string;
  country: string;
  office_address?: string;
  status: 'verified' | 'pending' | 'suspended';
  planName: string;
  daysLeft: number;
  activePropertiesCount: number;
  activeApplicationsCount?: number;
  latestApplicationRef?: string;
  latestApplicationStatus?: string;
  periodStartsAt?: string;
  periodExpiresAt?: string;
  created_at?: string;
}

export const providersDb = {
  // 1. Get all provider organizations with joined contact, listing period & property count
  async getProvidersForAdmin(): Promise<ProviderAdminView[]> {
    const fallbackList: ProviderAdminView[] = [
      {
        id: 'prov-1',
        account_role: 'provider',
        name: 'Pacific Heights Realty LLC',
        type: 'brokerage',
        email: 'manager@pacificheights.com',
        phone: '+1 (415) 555-0188',
        license: 'DRE #01928472',
        country: 'USA',
        office_address: '100 California Street, Suite 800, San Francisco, CA',
        status: 'verified',
        planName: '90 Days Listing Access',
        daysLeft: 62,
        activePropertiesCount: 2,
        periodStartsAt: '2026-08-01T00:00:00Z',
        periodExpiresAt: '2026-10-30T23:59:59Z',
      },
      {
        id: 'prov-2',
        account_role: 'provider',
        name: 'Kensington Residential UK',
        type: 'agent',
        email: 'lettings@kensingtonres.co.uk',
        phone: '+44 20 7946 0912',
        license: 'ARLA #884910',
        country: 'GBR',
        office_address: '12 Kensington High Street, London W8 4PT',
        status: 'verified',
        planName: '180 Days Listing Access',
        daysLeft: 165,
        activePropertiesCount: 2,
        periodStartsAt: '2026-08-15T00:00:00Z',
        periodExpiresAt: '2027-02-11T23:59:59Z',
      },
      {
        id: 'prov-3',
        account_role: 'provider',
        name: 'Austin Premier Properties',
        type: 'property_manager',
        email: 'contact@austinpremier.com',
        phone: '+1 (512) 555-0133',
        license: 'TREC #0582910',
        country: 'USA',
        office_address: '100 Congress Ave, Austin, TX 78701',
        status: 'pending',
        planName: '90 Days Access (Pending Payment Review)',
        daysLeft: 0,
        activePropertiesCount: 1,
      },
      {
        id: 'prov-4',
        account_role: 'provider',
        name: 'Sydney Harbour Estates',
        type: 'brokerage',
        email: 'leasing@sydneyharbour.com.au',
        phone: '+61 2 9250 1100',
        license: 'NSW Lic #2049182',
        country: 'AUS',
        office_address: '1 Macquarie Street, Sydney NSW 2000',
        status: 'verified',
        planName: '365 Days Annual Enterprise',
        daysLeft: 330,
        activePropertiesCount: 1,
        periodStartsAt: '2026-08-01T00:00:00Z',
        periodExpiresAt: '2027-08-01T23:59:59Z',
      },
      {
        id: 'tenant-1',
        account_role: 'tenant',
        name: 'Alexander Wright',
        type: 'tenant',
        email: 'alex.wright@gmail.com',
        phone: '+1 (310) 555-0199',
        license: 'N/A (Candidate)',
        country: 'USA',
        office_address: 'Beverly Hills, CA',
        status: 'verified',
        planName: '1 Active Rental Application',
        daysLeft: 0,
        activePropertiesCount: 0,
        activeApplicationsCount: 1,
        latestApplicationRef: 'APP-849201',
        latestApplicationStatus: 'approved',
      },
    ];

    // 1. Try Server-Side API endpoint (Bypasses RLS, gets live DB rows)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/providers');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          if (json.data.length > 0) {
            return json.data;
          }
          return [];
        }
      } catch (apiErr) {
        console.warn('API /api/admin/providers GET note:', apiErr);
      }
    }

    if (!isSupabaseConfigured()) {
      return fallbackList;
    }

    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .select(`
          id,
          company_name,
          provider_type,
          business_phone,
          license_number,
          office_address,
          country_code,
          verification_status,
          profiles (full_name, email, phone),
          provider_listing_periods (id, starts_at, expires_at, status, listing_plans (name)),
          properties (id)
        `);

      if (error) throw error;

      if (data && data.length > 0) {
        return data.map((p: any) => {
          const periods = p.provider_listing_periods || [];
          const activePeriod = periods.find((lp: any) => lp.status === 'active') || periods[0];
          let daysLeft = 0;
          if (activePeriod && activePeriod.expires_at) {
            const diffMs = new Date(activePeriod.expires_at).getTime() - Date.now();
            daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          }

          return {
            id: p.id,
            account_role: 'provider' as const,
            name: p.company_name || p.profiles?.full_name || 'Property Provider Partner',
            type: p.provider_type || 'brokerage',
            email: p.profiles?.email || 'contact@provider.com',
            phone: p.business_phone || p.profiles?.phone || '+1 (555) 000-0000',
            license: p.license_number || 'State Registered',
            country: p.country_code || 'USA',
            office_address: p.office_address,
            status: (p.verification_status as any) || 'verified',
            planName: activePeriod?.listing_plans?.name || (daysLeft > 0 ? 'Active Listing Plan' : 'No Active Plan'),
            daysLeft: daysLeft,
            activePropertiesCount: p.properties?.length || 0,
            periodStartsAt: activePeriod?.starts_at,
            periodExpiresAt: activePeriod?.expires_at,
          };
        });
      }

      return [];
    } catch (err) {
      console.warn('Supabase provider profiles fetch note:', err);
      return fallbackList;
    }
  },

  // 2. Toggle provider compliance / verification status in database
  async updateProviderVerification(providerId: string, status: 'verified' | 'pending' | 'suspended'): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/providers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId, status }),
        });
        const json = await res.json();
        if (json.success) return;
      } catch (apiErr) {
        console.warn('API /api/admin/providers PATCH note:', apiErr);
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('provider_profiles')
          .update({ verification_status: status })
          .eq('id', providerId);
      } catch (err) {
        console.error('Error updating provider verification in Supabase:', err);
      }
    }
  },
};
