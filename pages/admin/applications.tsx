import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, CheckCircle2, X, Eye, FileText, User, Shield } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { store } from '@/lib/store';
import { RentalApplication } from '@/lib/types';

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [inspectingApp, setInspectingApp] = useState<RentalApplication | null>(null);

  useEffect(() => {
    setApplications(store.getApplications());
  }, []);

  const handleDecision = (app: RentalApplication, status: 'approved' | 'rejected') => {
    const updated: RentalApplication = {
      ...app,
      status: status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'Super Admin',
    };
    store.saveApplication(updated);
    setApplications(store.getApplications());
    setInspectingApp(null);
    alert(`Application ${app.application_ref} ${status}!`);
  };

  return (
    <AppLayout title="Rental Applications Audit | Blue Sky Admin" headerTitle="Applications Audit">
      <div style={{ padding: '16px 16px 80px 16px' }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <button
            onClick={() => router.push('/admin')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--color-navy-dark)',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 800 }}>Rental Applications</h1>
          <div style={{ width: 20 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {applications.map((app) => (
            <div key={app.id} className="card" style={{ margin: 0, padding: 14 }}>
              <div className="flex-between" style={{ marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                    {app.applicant_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Applied for: {app.property_title} ({app.unit_name})
                  </div>
                </div>
                <Badge variant={app.status === 'approved' ? 'approved' : app.status === 'rejected' ? 'rejected' : 'under_review'}>
                  {app.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex-between" style={{ borderTop: '1px solid var(--color-surface-subtle)', paddingTop: 10, marginTop: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Ref: {app.application_ref} • Income: ${app.applicant_income?.toLocaleString()}/mo
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingApp(app)}
                  className="btn btn-outline-primary btn-sm"
                >
                  <Eye size={14} /> Audit Application
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Bottom Sheet */}
      <BottomSheet
        isOpen={!!inspectingApp}
        onClose={() => setInspectingApp(null)}
        title="Audit Rental Application"
      >
        {inspectingApp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: 12, borderRadius: 'var(--radius-md)', fontSize: 13 }}>
              <div><strong>Applicant:</strong> {inspectingApp.applicant_name} ({inspectingApp.applicant_email})</div>
              <div><strong>Phone:</strong> {inspectingApp.applicant_phone}</div>
              <div><strong>Employer:</strong> {inspectingApp.applicant_employer || 'N/A'}</div>
              <div><strong>Monthly Income:</strong> ${inspectingApp.applicant_income?.toLocaleString()}</div>
              <div><strong>Target Property:</strong> {inspectingApp.property_title}</div>
              <div><strong>Target Unit:</strong> {inspectingApp.unit_name} (${inspectingApp.unit_rent}/mo)</div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={16} color="var(--color-primary)" /> Vault Documents ({inspectingApp.documents.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {inspectingApp.documents.map((d) => (
                  <div key={d.id} className="flex-between" style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', padding: '8px 10px', borderRadius: 6, fontSize: 12 }}>
                    <span>{d.document_type.replace('_', ' ')} ({d.file_name})</span>
                    <Badge variant="verified">VERIFIED</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => handleDecision(inspectingApp, 'rejected')}
                className="btn btn-outline-danger"
                style={{ height: 44 }}
              >
                <X size={16} /> Decline Application
              </button>

              <button
                type="button"
                onClick={() => handleDecision(inspectingApp, 'approved')}
                className="btn btn-primary"
                style={{ height: 44, backgroundColor: 'var(--color-success)' }}
              >
                <CheckCircle2 size={16} /> Approve Tenant
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </AppLayout>
  );
}
