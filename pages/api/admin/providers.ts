import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isServerSupabaseConfigured()) {
    return res.status(200).json({ success: false, message: 'Supabase server key not configured', data: [] });
  }

  // GET: Fetch all provider organizations AND tenant accounts for Admin Directory
  if (req.method === 'GET') {
    try {
      // 1. Fetch all profiles, provider_profiles, listing periods, properties, plans, and rental applications in parallel
      const [profilesRes, provProfilesRes, periodsRes, propertiesRes, plansRes, applicationsRes] = await Promise.all([
        supabaseServer.from('profiles').select('id, full_name, email, phone, role, status, country_code, created_at'),
        supabaseServer.from('provider_profiles').select('*'),
        supabaseServer.from('provider_listing_periods').select('id, provider_id, listing_plan_id, starts_at, expires_at, status'),
        supabaseServer.from('properties').select('id, provider_id'),
        supabaseServer.from('listing_plans').select('id, name'),
        supabaseServer.from('rental_applications').select('id, applicant_id, application_ref, status, property_id, created_at'),
      ]);

      const allProfiles = profilesRes.data || [];
      const provProfiles = provProfilesRes.data || [];
      const plansMap = new Map((plansRes.data || []).map((pl: any) => [pl.id, pl]));

      // Index periods by provider_id
      const periodsByProv = new Map<string, any[]>();
      (periodsRes.data || []).forEach((p: any) => {
        const list = periodsByProv.get(p.provider_id) || [];
        list.push(p);
        periodsByProv.set(p.provider_id, list);
      });

      // Index properties count by provider_id
      const propertiesByProv = new Map<string, number>();
      (propertiesRes.data || []).forEach((pr: any) => {
        if (pr.provider_id) {
          propertiesByProv.set(pr.provider_id, (propertiesByProv.get(pr.provider_id) || 0) + 1);
        }
      });

      // Index applications by applicant_id
      const appsByApplicant = new Map<string, any[]>();
      (applicationsRes.data || []).forEach((app: any) => {
        if (app.applicant_id) {
          const list = appsByApplicant.get(app.applicant_id) || [];
          list.push(app);
          appsByApplicant.set(app.applicant_id, list);
        }
      });

      const providerProfileIds = new Set<string>();

      // 2. Format Providers
      const formattedProviders = provProfiles.map((p: any) => {
        const prof = allProfiles.find((prof: any) => prof.id === p.profile_id);
        if (p.profile_id) providerProfileIds.add(p.profile_id);

        const provPeriods = periodsByProv.get(p.id) || [];
        const activePeriod = provPeriods.find((lp: any) => lp.status === 'active') || provPeriods[0];
        
        let daysLeft = 0;
        if (activePeriod && activePeriod.expires_at) {
          const diffMs = new Date(activePeriod.expires_at).getTime() - Date.now();
          daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }

        const planName = activePeriod?.listing_plan_id 
          ? plansMap.get(activePeriod.listing_plan_id)?.name || 'Listing Plan'
          : (daysLeft > 0 ? 'Active Listing Plan' : 'No Active Plan');

        return {
          id: p.id,
          profile_id: p.profile_id,
          account_role: 'provider',
          name: p.company_name || prof?.full_name || 'Property Provider Partner',
          type: p.provider_type || 'brokerage',
          email: prof?.email || 'contact@provider.com',
          phone: p.business_phone || prof?.phone || '+1 (555) 000-0000',
          license: p.license_number || 'State Registered',
          country: p.country_code || 'USA',
          office_address: p.business_address || p.office_address || 'Operations Office',
          status: (p.verification_status as any) || 'verified',
          planName,
          daysLeft,
          activePropertiesCount: propertiesByProv.get(p.id) || 0,
          periodStartsAt: activePeriod?.starts_at,
          periodExpiresAt: activePeriod?.expires_at,
          created_at: p.created_at || prof?.created_at,
        };
      });

      // 3. Format Tenants / Applicants (All non-provider profiles + registered applicants)
      const tenantProfiles = allProfiles.filter(
        (prof: any) => prof.role === 'applicant' || !providerProfileIds.has(prof.id)
      );

      const formattedTenants = tenantProfiles.map((prof: any) => {
        const userApps = appsByApplicant.get(prof.id) || [];
        const latestApp = userApps.length > 0
          ? userApps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null;

        const hasApprovedApp = userApps.some((a) => a.status === 'approved');
        const hasPendingApp = userApps.some((a) => a.status === 'under_review' || a.status === 'submitted');

        let planName = 'Registered Tenant';
        if (hasApprovedApp) {
          planName = 'Approved Tenant (Lease Ready)';
        } else if (userApps.length > 0) {
          planName = `${userApps.length} Active Application${userApps.length !== 1 ? 's' : ''}`;
        }

        return {
          id: prof.id,
          profile_id: prof.id,
          account_role: 'tenant',
          name: prof.full_name || 'Tenant Candidate',
          type: 'tenant',
          email: prof.email || 'tenant@bluesky.com',
          phone: prof.phone || '+1 (555) 000-0000',
          license: 'N/A (Candidate)',
          country: prof.country_code || 'USA',
          office_address: 'Prospective Resident',
          status: prof.status === 'active' || hasApprovedApp ? 'verified' : (prof.status || 'verified'),
          planName,
          daysLeft: 0,
          activePropertiesCount: 0,
          activeApplicationsCount: userApps.length,
          latestApplicationRef: latestApp?.application_ref,
          latestApplicationStatus: latestApp?.status,
          created_at: prof.created_at,
        };
      });

      // Combine both datasets
      const combined = [...formattedProviders, ...formattedTenants];

      return res.status(200).json({
        success: true,
        data: combined,
        metrics: {
          total: combined.length,
          providersCount: formattedProviders.length,
          tenantsCount: formattedTenants.length,
        },
      });
    } catch (err: any) {
      console.error('API /api/admin/providers GET error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PATCH: Update provider verification status
  if (req.method === 'PATCH') {
    try {
      const { providerId, status } = req.body;
      if (!providerId || !status) {
        return res.status(400).json({ success: false, error: 'Provider ID and status are required' });
      }

      const { error } = await supabaseServer
        .from('provider_profiles')
        .update({ verification_status: status })
        .eq('id', providerId);

      if (error) throw error;

      return res.status(200).json({ success: true, message: 'Status updated' });
    } catch (err: any) {
      console.error('API /api/admin/providers PATCH error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE: Single or Bulk User/Provider Deletion with Admin Self-Protection
  if (req.method === 'DELETE') {
    try {
      const { id, ids, adminEmail, adminProfileId } = req.body || {};
      const targetIds: string[] = [];

      if (Array.isArray(ids) && ids.length > 0) {
        targetIds.push(...ids.filter((i: any) => typeof i === 'string' && i.length > 0));
      } else if (id && typeof id === 'string') {
        targetIds.push(id);
      } else if (req.query.id && typeof req.query.id === 'string') {
        targetIds.push(req.query.id as string);
      }

      if (targetIds.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid user ID(s) provided for deletion' });
      }

      // 1. Resolve Profile IDs & Provider IDs
      const { data: matchedProfiles } = await supabaseServer
        .from('profiles')
        .select('id, email, role, auth_user_id')
        .in('id', targetIds);

      const { data: matchedProviders } = await supabaseServer
        .from('provider_profiles')
        .select('id, profile_id')
        .in('id', targetIds);

      // Collect all profile IDs to delete, strictly excluding admins or current admin
      const profileIdsToDelete = new Set<string>();
      const providerProfileIdsToDelete = new Set<string>();

      (matchedProfiles || []).forEach((p: any) => {
        const isSelf = (adminEmail && p.email?.toLowerCase() === adminEmail.toLowerCase()) || (adminProfileId && p.id === adminProfileId);
        if (!isSelf && p.role !== 'admin') {
          profileIdsToDelete.add(p.id);
        }
      });

      (matchedProviders || []).forEach((prov: any) => {
        providerProfileIdsToDelete.add(prov.id);
        if (prov.profile_id && prov.profile_id !== adminProfileId) {
          profileIdsToDelete.add(prov.profile_id);
        }
      });

      const finalProfileIds = Array.from(profileIdsToDelete);
      const finalProviderIds = Array.from(providerProfileIdsToDelete);

      if (finalProfileIds.length === 0 && finalProviderIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Action cancelled: Cannot delete administrator profile or no valid non-admin users matched.',
        });
      }

      // 2. Cascade cleanup related records
      if (finalProviderIds.length > 0) {
        await Promise.all([
          supabaseServer.from('provider_payments').delete().in('provider_id', finalProviderIds),
          supabaseServer.from('provider_listing_periods').delete().in('provider_id', finalProviderIds),
          supabaseServer.from('properties').delete().in('provider_id', finalProviderIds),
          supabaseServer.from('provider_profiles').delete().in('id', finalProviderIds),
        ]);
      }

      if (finalProfileIds.length > 0) {
        await Promise.all([
          supabaseServer.from('rental_applications').delete().in('applicant_id', finalProfileIds),
          supabaseServer.from('direct_rental_applications').delete().in('applicant_id', finalProfileIds),
          supabaseServer.from('conversations').delete().in('applicant_id', finalProfileIds),
          supabaseServer.from('notifications').delete().in('profile_id', finalProfileIds),
          supabaseServer.from('provider_profiles').delete().in('profile_id', finalProfileIds),
        ]);

        // Delete from profiles
        const { error: deleteProfErr } = await supabaseServer
          .from('profiles')
          .delete()
          .in('id', finalProfileIds);

        if (deleteProfErr) throw deleteProfErr;
      }

      return res.status(200).json({
        success: true,
        message: `Successfully deleted ${finalProfileIds.length + finalProviderIds.length} user account(s).`,
        deletedCount: finalProfileIds.length + finalProviderIds.length,
      });
    } catch (err: any) {
      console.error('API /api/admin/providers DELETE error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
