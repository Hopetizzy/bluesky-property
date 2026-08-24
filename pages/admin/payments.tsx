import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, CreditCard, Check, X, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { store } from '@/lib/store';
import { ProviderPayment, ProviderListingPeriod } from '@/lib/types';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<ProviderPayment[]>([]);
  const [inspectingPayment, setInspectingPayment] = useState<ProviderPayment | null>(null);

  useEffect(() => {
    setPayments(store.getProviderPayments());
  }, []);

  const handleVerify = (payment: ProviderPayment) => {
    // 1. Update Payment Status
    const updatedPayment: ProviderPayment = {
      ...payment,
      status: 'verified',
      verified_at: new Date().toISOString(),
      verified_by: 'Super Admin',
    };
    store.saveProviderPayment(updatedPayment);

    // 2. Compute Listing Access Period (Early Renewal or New)
    const existingPeriods = store.getListingPeriods().filter((p) => p.provider_id === payment.provider_id && p.status === 'active');
    const plans = store.getListingPlans();
    const matchedPlan = plans.find((p) => p.id === payment.listing_plan_id);
    const durationDays = matchedPlan ? matchedPlan.duration_days : 90;

    let startsAt = new Date();
    if (existingPeriods.length > 0 && new Date(existingPeriods[0].expires_at) > startsAt) {
      // Seamlessly extend from future expiration date
      startsAt = new Date(existingPeriods[0].expires_at);
    }

    const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 3600 * 1000);

    const newPeriod: ProviderListingPeriod = {
      id: `period-${Date.now()}`,
      provider_id: payment.provider_id,
      listing_plan_id: payment.listing_plan_id,
      payment_id: payment.id,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      grace_period_hours: 48,
      status: 'active',
    };

    store.saveListingPeriod(newPeriod);
    setPayments(store.getProviderPayments());
    setInspectingPayment(null);
    alert(`Payment verified! ${durationDays} Days listing access activated for ${payment.provider_name}.`);
  };

  const handleReject = (payment: ProviderPayment) => {
    const updatedPayment: ProviderPayment = {
      ...payment,
      status: 'rejected',
      rejection_reason: 'Proof image was unreadable or amount did not match.',
    };
    store.saveProviderPayment(updatedPayment);
    setPayments(store.getProviderPayments());
    setInspectingPayment(null);
    alert('Payment rejected.');
  };

  return (
    <AppLayout title="Payment Verification Desk | Blue Sky Admin" headerTitle="Payment Verification">
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
          <h1 style={{ fontSize: 18, fontWeight: 800 }}>Payment Verification</h1>
          <div style={{ width: 20 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {payments.map((p) => (
            <div key={p.id} className="card" style={{ margin: 0, padding: 14 }}>
              <div className="flex-between" style={{ marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                    {p.provider_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {p.listing_plan_name} • {p.payment_method_name}
                  </div>
                </div>
                <div className="price-text" style={{ fontSize: 18 }}>
                  ${p.amount.toLocaleString()}
                </div>
              </div>

              <div className="flex-between" style={{ borderTop: '1px solid var(--color-surface-subtle)', paddingTop: 10, marginTop: 6 }}>
                <Badge variant={p.status === 'verified' ? 'verified' : p.status === 'rejected' ? 'rejected' : 'pending'}>
                  {p.status.toUpperCase()}
                </Badge>

                <button
                  type="button"
                  onClick={() => setInspectingPayment(p)}
                  className="btn btn-outline-primary btn-sm"
                >
                  <Eye size={14} /> Inspect Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspect Receipt Bottom Sheet */}
      <BottomSheet
        isOpen={!!inspectingPayment}
        onClose={() => setInspectingPayment(null)}
        title="Inspect Payment Receipt"
      >
        {inspectingPayment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                backgroundColor: 'var(--color-surface-subtle)',
                textAlign: 'center',
              }}
            >
              <FileText size={40} color="var(--color-primary)" style={{ margin: '0 auto 8px auto' }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>{inspectingPayment.proof_storage_path}</div>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Wire Transfer Reference: WT-994827103-US
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--color-primary-tint)', padding: 12, borderRadius: 'var(--radius-md)', fontSize: 13 }}>
              <div><strong>Provider:</strong> {inspectingPayment.provider_name}</div>
              <div><strong>Plan:</strong> {inspectingPayment.listing_plan_name}</div>
              <div><strong>Amount:</strong> ${inspectingPayment.amount.toLocaleString()}</div>
              <div><strong>Method:</strong> {inspectingPayment.payment_method_name}</div>
              <div><strong>Submitted:</strong> {new Date(inspectingPayment.submitted_at).toLocaleString()}</div>
            </div>

            {inspectingPayment.status === 'pending' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => handleReject(inspectingPayment)}
                  className="btn btn-outline-danger"
                  style={{ height: 44 }}
                >
                  <X size={16} /> Reject Payment
                </button>

                <button
                  type="button"
                  onClick={() => handleVerify(inspectingPayment)}
                  className="btn btn-primary"
                  style={{ height: 44, backgroundColor: 'var(--color-success)' }}
                >
                  <Check size={16} /> Verify & Activate
                </button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </AppLayout>
  );
}
