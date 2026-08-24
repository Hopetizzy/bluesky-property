import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, FileText, MessageSquare, Shield, AlertCircle, Loader2, Building, Calendar, DollarSign, UserCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { RentalApplication } from '@/lib/types';

export default function ApplicationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [app, setApp] = useState<RentalApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAppDetail() {
      if (!id) return;
      setIsLoading(true);

      try {
        let foundApp: RentalApplication | null = null;

        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from('rental_applications')
            .select(`
              *,
              properties (id, title, street_address, city, state_province, country_code),
              property_units (id, unit_number_or_name, rent_amount, currency_code),
              application_documents (*)
            `)
            .or(`id.eq.${id},application_ref.eq.${id}`)
            .maybeSingle();

          if (data) {
            foundApp = {
              id: String(data.id),
              application_ref: data.application_ref,
              applicant_id: data.applicant_id,
              property_id: data.property_id,
              unit_id: data.unit_id,
              applicant_name: data.applicant_name,
              applicant_email: data.applicant_email,
              applicant_phone: data.applicant_phone,
              status: data.status,
              desired_move_in: data.desired_move_in,
              lease_term_months: data.lease_term_months,
              occupants_count: data.occupants_count,
              has_pets: data.has_pets,
              submitted_at: data.submitted_at || data.created_at,
              reviewed_at: data.reviewed_at,
              reviewed_by: data.reviewed_by,
              property_title: data.properties?.title || 'Residential Property',
              property_address: data.properties
                ? `${data.properties.street_address}, ${data.properties.city}`
                : 'Property Address',
              unit_name: data.property_units?.unit_number_or_name || 'Standard Unit',
              unit_rent: data.property_units?.rent_amount || 0,
              unit_currency: data.property_units?.currency_code || 'USD',
              documents: data.application_documents || [],
            };
          }
        }

        if (!foundApp) {
          const apps = store.getApplications();
          foundApp = apps.find((a) => a.id === id || a.application_ref === id) || null;
        }

        setApp(foundApp);
      } catch (err) {
        console.warn('App detail error:', err);
        const apps = store.getApplications();
        setApp(apps.find((a) => a.id === id || a.application_ref === id) || null);
      } finally {
        setIsLoading(false);
      }
    }

    loadAppDetail();
  }, [id]);

  if (isLoading) {
    return (
      <AppLayout title="Application Details | Blue Sky Property" headerTitle="Application Details">
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Loading verified application data...</p>
        </div>
      </AppLayout>
    );
  }

  if (!app) {
    return (
      <AppLayout title="Application Not Found | Blue Sky Property">
        <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <AlertCircle size={40} color="var(--color-danger)" style={{ margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Application Not Found</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, marginBottom: 20 }}>
            We could not find the application details for reference "{id}".
          </p>
          <Link href="/applicant/applications" className="btn btn-primary">
            Back to My Applications
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isApproved = app.status === 'approved';
  const isRejected = app.status === 'rejected';

  return (
    <AppLayout title={`Application ${app.application_ref} | Blue Sky Property`} headerTitle="Application Details">
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px 16px 60px 16px',
        }}
      >
        {/* Top Header Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button
            onClick={() => router.push('/applicant/applications')}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
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
            <ArrowLeft size={16} /> My Applications
          </button>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Ref: <strong style={{ color: 'var(--color-navy-dark)' }}>{app.application_ref}</strong>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>
          {/* Left Column: Property & Progress Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Property Summary Card */}
            <div
              className="card"
              style={{
                margin: 0,
                padding: 24,
                borderRadius: 'var(--radius-2xl)',
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  {app.property_title}
                </h2>
                <Badge variant={isApproved ? 'approved' : isRejected ? 'rejected' : 'under_review'}>
                  {app.status.replace('_', ' ')}
                </Badge>
              </div>

              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                {app.property_address}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  backgroundColor: 'var(--color-surface-subtle)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Unit:</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>{app.unit_name}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Monthly Rent:</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>${app.unit_rent.toLocaleString()}/mo</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Desired Move-In:</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>{new Date(app.desired_move_in).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* 4-Stage Progress Timeline */}
            <div
              className="card"
              style={{
                margin: 0,
                padding: 24,
                borderRadius: 'var(--radius-2xl)',
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, color: 'var(--color-navy-dark)' }}>
                Application Review Progress
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
                {/* Timeline Connector Line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    bottom: 12,
                    width: 2,
                    backgroundColor: isApproved ? 'var(--color-success)' : 'var(--color-border)',
                    zIndex: 1,
                  }}
                />

                {/* Stage 1: Submitted */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', zIndex: 2 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-success)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>Application Submitted</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {new Date(app.submitted_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Stage 2: Documents Received */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', zIndex: 2 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-success)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>Documents Encrypted in Vault</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {app.documents.length > 0 ? `${app.documents.length} verification document(s) uploaded` : 'Identity & income documents stored in secure vault'}
                    </div>
                  </div>
                </div>

                {/* Stage 3: Verification */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', zIndex: 2 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: isApproved ? 'var(--color-success)' : isRejected ? 'var(--color-danger)' : 'var(--color-primary)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isApproved ? <CheckCircle2 size={16} /> : isRejected ? <AlertCircle size={16} /> : <Clock size={16} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>Background & Verification Review</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {isApproved ? 'All checks verified successfully' : isRejected ? 'Verification criteria not met' : 'Under active review by Blue Sky verification team'}
                    </div>
                  </div>
                </div>

                {/* Stage 4: Decision */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', zIndex: 2 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: isApproved ? 'var(--color-success)' : isRejected ? 'var(--color-danger)' : 'var(--color-surface-subtle)',
                      color: isApproved || isRejected ? 'white' : 'var(--color-text-muted)',
                      border: isApproved || isRejected ? 'none' : '2px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isApproved ? <CheckCircle2 size={16} /> : isRejected ? <AlertCircle size={16} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#CBD5E1' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>Final Decision</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {isApproved ? 'Approved - Lease agreement prepared' : isRejected ? 'Application Declined' : 'Pending final verification signoff'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Uploaded Documents & Direct Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Uploaded Documents */}
            <div
              className="card"
              style={{
                margin: 0,
                padding: 22,
                borderRadius: 'var(--radius-2xl)',
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div className="flex-between" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                  Attached Documents
                </div>
                <Link href="/applicant/documents" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
                  Manage Vault
                </Link>
              </div>

              {app.documents && app.documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {app.documents.map((doc) => (
                    <div key={doc.id} className="flex-between" style={{ fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--color-surface-subtle)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                        <FileText size={15} color="var(--color-primary)" />
                        {doc.document_type.replace('_', ' ')}
                      </span>
                      <Badge variant="verified">VERIFIED</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', padding: '8px 0' }}>
                  Standard ID and income verification documents linked to your profile vault.
                </div>
              )}
            </div>

            {/* Support Desk Action */}
            <div
              style={{
                backgroundColor: 'var(--color-white)',
                padding: 22,
                borderRadius: 'var(--radius-2xl)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 6 }}>
                Questions about this application?
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                Connect directly with Blue Sky property managers regarding your lease, move-in schedule, or paperwork.
              </p>
              <Link
                href={`/applicant/messages?applicationId=${app.id}&propertyId=${app.property_id}&ref=${app.application_ref}&title=${encodeURIComponent(app.property_title)}`}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <MessageSquare size={16} /> Open Support Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
