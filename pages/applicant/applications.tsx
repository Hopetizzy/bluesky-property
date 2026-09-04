import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, ChevronRight, FileText, CheckCircle2, Clock, XCircle, Search, Building, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { RentalApplication } from '@/lib/types';

export default function MyApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'under_review' | 'approved' | 'rejected'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadApplications() {
      setIsLoading(true);
      try {
        let appList: RentalApplication[] = [];

        if (isSupabaseConfigured()) {
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
              .maybeSingle();

            const profileId = profile?.id;
            const query = supabase
              .from('rental_applications')
              .select(`
                *,
                properties (
                  title,
                  street_address,
                  city,
                  state_province,
                  property_images (storage_path, is_primary, sort_order)
                ),
                property_units (unit_number_or_name, rent_amount, currency_code)
              `)
              .order('submitted_at', { ascending: false });

            if (profileId) {
              query.or(`applicant_id.eq.${profileId},applicant_email.eq.${user.email}`);
            } else {
              query.eq('applicant_email', user.email);
            }

            const { data: dbApps } = await query;

            if (dbApps && dbApps.length > 0) {
              appList = dbApps.map((row: any) => {
                const primaryImg =
                  row.properties?.property_images?.find((pi: any) => pi.is_primary)?.storage_path ||
                  row.properties?.property_images?.[0]?.storage_path ||
                  row.property_image ||
                  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

                return {
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
                  property_image: primaryImg,
                  unit_name: row.property_units?.unit_number_or_name || 'Standard Unit',
                  unit_rent: row.property_units?.rent_amount || 0,
                  unit_currency: row.property_units?.currency_code || 'USD',
                  documents: [],
                };
              });
            }
          } else {
            appList = [];
          }
        } else {
          const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('bluesky_user_email') : null;
          appList = savedEmail
            ? store.getApplications().filter((a) => a.applicant_email === savedEmail)
            : [];
        }

        setApplications(appList);
      } catch (err) {
        console.warn('Applications load note:', err);
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadApplications();
  }, []);

  const filtered = applications.filter((a) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'under_review') return a.status === 'under_review' || a.status === 'submitted';
    return a.status === activeTab;
  });

  return (
    <AppLayout title="My Applications | Blue Sky Property" headerTitle="My Applications">
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px 16px 40px 16px',
        }}
      >
        {/* Top Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button
            onClick={() => router.push('/applicant')}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              color: 'var(--color-navy-dark)',
              backgroundColor: 'var(--color-white)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-navy-dark)' }}>My Rental Applications</h1>
          <div style={{ width: 40 }} />
        </div>

        {/* Status Segmented Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--color-surface-subtle)',
            padding: 4,
            borderRadius: 'var(--radius-lg)',
            marginBottom: 24,
            border: '1px solid var(--color-border)',
          }}
        >
          {(['all', 'under_review', 'approved', 'rejected'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                flex: 1,
                height: 38,
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: activeTab === t ? 'var(--color-white)' : 'transparent',
                color: activeTab === t ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === t ? 800 : 600,
                fontSize: 12,
                cursor: 'pointer',
                boxShadow: activeTab === t ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease',
              }}
            >
              {t === 'under_review' ? 'In Review' : t}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto 10px auto' }} />
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading your applications from database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              borderRadius: 'var(--radius-2xl)',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              maxWidth: 480,
              margin: '0 auto',
            }}
          >
            <FileText size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-navy-dark)' }}>No Applications in this category</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 16 }}>
              Browse our verified rental listings worldwide and submit applications online.
            </p>
            <Link href="/properties" className="btn btn-primary btn-sm">
              Explore Available Properties
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map((app) => (
              <Link
                key={app.id}
                href={`/applicant/applications/${app.id}`}
                className="card"
                style={{
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 0,
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Property Image Banner */}
                <div
                  style={{
                    position: 'relative',
                    height: 140,
                    width: '100%',
                    backgroundColor: 'var(--color-surface-subtle)',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={app.property_image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
                    alt={app.property_title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <Badge variant={app.status === 'approved' ? 'approved' : app.status === 'rejected' ? 'rejected' : 'under_review'}>
                      {app.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 4 }}>
                      {app.property_title}
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                      {app.property_address}
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 14 }}>
                      {app.unit_name} • ${app.unit_rent.toLocaleString()}/month
                    </div>
                  </div>

                  <div className="flex-between" style={{ borderTop: '1px solid var(--color-surface-subtle)', paddingTop: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Ref: <strong>{app.application_ref}</strong> • {new Date(app.submitted_at).toLocaleDateString()}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      View Progress <ChevronRight size={15} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
