import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Building2,
  Users,
  CreditCard,
  FileCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { store } from '@/lib/store';
import { Property, ProviderPayment, RentalApplication } from '@/lib/types';

export default function AdminDashboardPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<ProviderPayment[]>([]);
  const [applications, setApplications] = useState<RentalApplication[]>([]);

  useEffect(() => {
    setProperties(store.getProperties());
    setPayments(store.getProviderPayments());
    setApplications(store.getApplications());
  }, []);

  const totalProps = properties.length;
  const publishedProps = properties.filter((p) => p.status === 'approved').length;
  const pendingProps = properties.filter((p) => p.status === 'pending_verification').length;
  const rejectedProps = properties.filter((p) => p.status === 'rejected').length;

  const pendingPayments = payments.filter((p) => p.status === 'pending').length;
  const pendingApps = applications.filter((a) => a.status === 'under_review' || a.status === 'submitted').length;

  return (
    <AppLayout title="Super Admin Command Center | Blue Sky" headerTitle="Super Admin Console">
      <div style={{ padding: '20px 16px 80px 16px' }}>
        {/* Header Greeting */}
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
            Operations & Control Tower
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-navy-dark)', marginTop: 2 }}>
            Admin Overview ⚡
          </h1>
        </div>

        {/* Board 4 Metric Overview Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 20,
          }}
        >
          <div className="card" style={{ margin: 0, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-navy-dark)' }}>{totalProps}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>Total Props</div>
          </div>
          <div className="card" style={{ margin: 0, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-success)' }}>{publishedProps}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>Published</div>
          </div>
          <div className="card" style={{ margin: 0, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-warning)' }}>{pendingProps}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>Pending Review</div>
          </div>
        </div>

        {/* Board 4 ACTION REQUIRED Alert Cards */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 12 }}>
            ACTION REQUIRED
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Action 1: Pending Properties */}
            <Link
              href="/admin/properties"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: pendingProps > 0 ? '#FEF2F2' : 'var(--color-white)',
                border: pendingProps > 0 ? '1px solid #FECACA' : '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: pendingProps > 0 ? '#EF4444' : 'var(--color-surface-subtle)',
                    color: pendingProps > 0 ? 'white' : 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                    {pendingProps} Properties Awaiting Review
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Inspect addresses, photos & unit configurations
                  </div>
                </div>
              </div>
              <ChevronRight size={18} color="var(--color-text-muted)" />
            </Link>

            {/* Action 2: Pending Payments */}
            <Link
              href="/admin/payments"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: pendingPayments > 0 ? '#FEF3C7' : 'var(--color-white)',
                border: pendingPayments > 0 ? '1px solid #FDE68A' : '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: pendingPayments > 0 ? '#F59E0B' : 'var(--color-surface-subtle)',
                    color: pendingPayments > 0 ? 'white' : 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CreditCard size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                    {pendingPayments} Payment Proofs Awaiting Verification
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Verify wire/transfer receipts to unlock listing access
                  </div>
                </div>
              </div>
              <ChevronRight size={18} color="var(--color-text-muted)" />
            </Link>

            {/* Action 3: Pending Applications */}
            <Link
              href="/admin/applications"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: pendingApps > 0 ? '#E0F2FE' : 'var(--color-white)',
                border: pendingApps > 0 ? '1px solid #BAE6FD' : '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: pendingApps > 0 ? '#0284C7' : 'var(--color-surface-subtle)',
                    color: pendingApps > 0 ? 'white' : 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                    {pendingApps} Rental Applications in Review
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Inspect ID vaults and income verification files
                  </div>
                </div>
              </div>
              <ChevronRight size={18} color="var(--color-text-muted)" />
            </Link>
          </div>
        </div>

        {/* Direct First-Party Publishing Trigger */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 10 }}>
            FIRST-PARTY INVENTORY
          </div>
          <Link
            href="/admin/properties/create"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <PlusCircle size={18} /> + Publish Direct Blue Sky Property
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
