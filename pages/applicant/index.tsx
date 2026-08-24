import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Clock, CheckCircle2, XCircle, Search, MessageSquare, Shield, ChevronRight, AlertCircle, Loader2, Sparkles, Building, ArrowUpRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { RentalApplication } from '@/lib/types';

export default function ApplicantDashboardPage() {
  const [userName, setUserName] = useState<string>('Applicant');
  const [userEmail, setUserEmail] = useState<string>('');
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [documentsCount, setDocumentsCount] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);

      try {
        let appList: RentalApplication[] = [];

        if (isSupabaseConfigured()) {
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            setUserEmail(user.email || '');

            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
              .maybeSingle();

            if (profile?.full_name) {
              setUserName(profile.full_name);
            } else if (user.user_metadata?.full_name) {
              setUserName(user.user_metadata.full_name);
            } else {
              setUserName(user.email?.split('@')[0] || 'Tenant');
            }

            // Fetch user's rental applications from database
            let profileId = profile?.id;
            const query = supabase
              .from('rental_applications')
              .select(`
                *,
                properties (title, street_address, city, state_province),
                property_units (unit_number_or_name, rent_amount, currency_code)
              `)
              .order('submitted_at', { ascending: false });

            if (profileId) {
              query.or(`applicant_id.eq.${profileId},applicant_email.eq.${user.email}`);
            } else {
              query.eq('applicant_email', user.email);
            }

            const { data: dbApps, error: appsErr } = await query;

            if (appsErr) {
              console.warn('Applications fetch note:', appsErr.message);
            } else if (dbApps && dbApps.length > 0) {
              appList = dbApps.map((row: any) => ({
                id: String(row.id),
                application_ref: row.application_ref,
                applicant_id: row.applicant_id,
                property_id: row.property_id,
                unit_id: row.unit_id,
                applicant_name: row.applicant_name,
                applicant_email: row.applicant_email,
                applicant_phone: row.applicant_phone,
                status: row.status,
                desired_move_in: row.desired_move_in,
                lease_term_months: row.lease_term_months,
                occupants_count: row.occupants_count,
                has_pets: row.has_pets,
                submitted_at: row.submitted_at || row.created_at,
                reviewed_at: row.reviewed_at,
                reviewed_by: row.reviewed_by,
                property_title: row.properties?.title || 'Residential Property',
                property_address: row.properties
                  ? `${row.properties.street_address}, ${row.properties.city}`
                  : 'Property Address',
                unit_name: row.property_units?.unit_number_or_name || 'Standard Unit',
                unit_rent: row.property_units?.rent_amount || 0,
                unit_currency: row.property_units?.currency_code || 'USD',
                documents: [],
              }));
            }

            // Fetch user-specific document count
            let docQuery = supabase
              .from('application_documents')
              .select('*', { count: 'exact', head: true });
            if (profileId) {
              const { data: userAppIds } = await supabase
                .from('rental_applications')
                .select('id')
                .eq('applicant_id', profileId);
              if (userAppIds && userAppIds.length > 0) {
                const ids = userAppIds.map((a: any) => a.id);
                docQuery = docQuery.in('application_id', ids);
              }
            }
            const { count: docCount } = await docQuery;
            setDocumentsCount(docCount || 0);
          } else {
            // Unauthenticated
            appList = [];
          }
        } else {
          // Offline fallback scoped to local user
          const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('bluesky_user_email') : null;
          appList = savedEmail
            ? store.getApplications().filter((a) => a.applicant_email === savedEmail)
            : [];
        }

        setApplications(appList);
        setUnreadMessages(0);
      } catch (err) {
        console.warn('Dashboard load note:', err);
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalApps = applications.length;
  const underReview = applications.filter((a) => a.status === 'under_review' || a.status === 'submitted').length;
  const approved = applications.filter((a) => a.status === 'approved').length;
  const rejected = applications.filter((a) => a.status === 'rejected').length;

  return (
    <AppLayout title="Tenant Dashboard | Blue Sky Property" headerTitle="Tenant Dashboard">
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px 16px 40px 16px',
        }}
      >
        {/* Welcome Hero Banner */}
        <div
          className="animate-fade-in-up"
          style={{
            marginBottom: 24,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            backgroundColor: 'var(--color-white)',
            padding: '24px 28px',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em', margin: 0 }}>
              Welcome back, {userName}!
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              Track your applications, verified identity credentials, and direct support communications.
            </p>
          </div>

          <Link href="/properties" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} /> Explore New Homes
          </Link>
        </div>

        {/* Responsive Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14,
            marginBottom: 28,
          }}
        >
          <div
            className="card"
            style={{
              padding: '20px 18px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Applied
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-navy-dark)', marginTop: 4 }}>
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : totalApps}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '20px 18px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              In Review
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#1D4ED8', marginTop: 4 }}>
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : underReview}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '20px 18px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Approved
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#15803D', marginTop: 4 }}>
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : approved}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '20px 18px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Declined
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#B91C1C', marginTop: 4 }}>
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : rejected}
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
            alignItems: 'start',
          }}
        >
          {/* Left Column: Recent Applications */}
          <div>
            <div className="flex-between" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                Recent Applications
              </h2>
              <Link href="/applicant/applications" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                View all ({applications.length}) <ChevronRight size={15} />
              </Link>
            </div>

            {isLoading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
                <Loader2 size={28} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto' }} />
              </div>
            ) : applications.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  backgroundColor: 'var(--color-white)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Building size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 10px auto' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-navy-dark)' }}>No applications submitted yet</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 16 }}>
                  Browse our verified rental listings worldwide and submit applications seamlessly.
                </p>
                <Link href="/properties" className="btn btn-primary btn-sm">
                  Browse Verified Listings
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {applications.slice(0, 4).map((app) => (
                  <Link
                    key={app.id}
                    href={`/applicant/applications/${app.id}`}
                    className="card"
                    style={{
                      margin: 0,
                      padding: '18px 20px',
                      borderRadius: 'var(--radius-xl)',
                      backgroundColor: 'var(--color-white)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 2 }}>
                        {app.property_title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                        {app.property_address} • Ref: <strong>{app.application_ref}</strong>
                      </div>
                      <Badge variant={app.status === 'approved' ? 'approved' : app.status === 'rejected' ? 'rejected' : 'under_review'}>
                        {app.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)' }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>Track</span>
                      <ChevronRight size={18} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Quick Vault & Support Hub */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Quick Actions Card */}
            <div
              style={{
                backgroundColor: 'var(--color-white)',
                padding: '22px 20px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 14 }}>
                Tenant Quick Hub
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link
                  href="/applicant/documents"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-surface-subtle)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={20} color="#16A34A" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                        Encrypted ID Vault
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        Passports, Paystubs & Proof of Address
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={18} color="var(--color-primary)" />
                </Link>

                <Link
                  href="/applicant/messages"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-surface-subtle)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: 'var(--color-primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare size={20} color="var(--color-primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                        Messages & Support
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        Direct landlord & platform inquiries
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={18} color="var(--color-primary)" />
                </Link>
              </div>
            </div>

            {/* Help & Assurance Card */}
            <div
              style={{
                backgroundColor: 'var(--color-primary-tint)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                padding: '20px',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Shield size={22} color="var(--color-primary)" />
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  Blue Sky Tenant Protection
                </h4>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                All landlords on Blue Sky are verified before listings go live. Your personal documents are restricted to official verifiers and never shared publicly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
