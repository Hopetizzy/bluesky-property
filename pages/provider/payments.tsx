import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Receipt,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  ExternalLink,
  Loader2,
  ShieldCheck,
  RefreshCw,
  FileText,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { listingPlansDb } from '@/lib/db/listingPlans';
import { ProviderPayment, ProviderListingPeriod, PaymentStatus } from '@/lib/types';

type PaymentFilterTab = 'all' | 'verified' | 'pending' | 'rejected';

function resolveDocumentUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('data:') || (pathOrUrl.startsWith('http') && pathOrUrl.includes('token='))) {
    return pathOrUrl;
  }
  if (pathOrUrl.includes('supabase.co/storage') && !pathOrUrl.includes('token=')) {
    const match = pathOrUrl.match(/\/payment-proofs-vault\/(.+)$/);
    if (match) {
      return `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(decodeURIComponent(match[1]))}`;
    }
  }
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  if (pathOrUrl.startsWith('/payments/')) {
    return `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(pathOrUrl.replace(/^\/payments\//, ''))}`;
  }
  if (pathOrUrl.startsWith('/vault/')) {
    return `/api/vault/view?path=${encodeURIComponent(pathOrUrl.replace(/^\/vault\//, ''))}`;
  }
  return `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(pathOrUrl)}`;
}

export default function ProviderPaymentsHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<ProviderPayment[]>([]);
  const [listingPeriod, setListingPeriod] = useState<ProviderListingPeriod | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<PaymentFilterTab>('all');

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
            .maybeSingle();

          let providerId = profile?.id;
          if (profile?.id) {
            const { data: provProf } = await supabase
              .from('provider_profiles')
              .select('id')
              .eq('profile_id', profile.id)
              .maybeSingle();
            if (provProf?.id) providerId = provProf.id;
          }

          if (providerId) {
            const period = await listingPlansDb.getProviderActivePeriod(providerId);
            setListingPeriod(period);

            const pmtList = await listingPlansDb.getProviderPayments(providerId);
            setPayments(pmtList);
            return;
          }
        }
      }

      // Fallback to store
      const periods = store.getListingPeriods();
      if (periods.length > 0) setListingPeriod(periods[0]);
      setPayments(store.getProviderPayments());
    } catch (err) {
      console.warn('Error loading provider payments:', err);
      setPayments(store.getProviderPayments());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (activeTab === 'all') return true;
      return p.status === activeTab;
    });
  }, [payments, activeTab]);

  const counts = useMemo(() => {
    return {
      all: payments.length,
      verified: payments.filter((p) => p.status === 'verified').length,
      pending: payments.filter((p) => p.status === 'pending').length,
      rejected: payments.filter((p) => p.status === 'rejected').length,
    };
  }, [payments]);

  // Compute active status with robust multi-layer fallback (listing_periods table, verified payment duration, or local store)
  const now = new Date().getTime();
  let effectiveExpiresAt = listingPeriod ? new Date(listingPeriod.expires_at).getTime() : 0;
  
  if (!effectiveExpiresAt) {
    // If listingPeriod table didn't return a record, stack verified payments additively
    const verifiedPayments = payments
      .filter((p) => p.status === 'verified')
      .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

    let accumulatedTime = 0;
    for (const pmt of verifiedPayments) {
      const pmtTime = new Date(pmt.verified_at || pmt.submitted_at).getTime();
      const durationDays = pmt.listing_plan_duration_days || (
        pmt.listing_plan_name?.includes('90') ? 90 :
        pmt.listing_plan_name?.includes('180') ? 180 :
        pmt.listing_plan_name?.includes('365') ? 365 :
        pmt.listing_plan_name?.includes('30') ? 30 : 90
      );
      const durationMs = durationDays * 24 * 3600 * 1000;
      if (accumulatedTime > pmtTime) {
        accumulatedTime += durationMs;
      } else {
        accumulatedTime = pmtTime + durationMs;
      }
    }
    effectiveExpiresAt = accumulatedTime;
  }

  const graceWindow = (listingPeriod?.grace_period_hours || 48) * 3600 * 1000;
  const isPeriodActive = effectiveExpiresAt > 0 && effectiveExpiresAt + graceWindow > now;
  const msLeft = Math.max(0, effectiveExpiresAt - now);
  const daysLeft = Math.floor(msLeft / (1000 * 3600 * 24));
  const hoursLeft = Math.floor((msLeft % (1000 * 3600 * 24)) / (1000 * 3600));

  return (
    <AppLayout title="Payment & Subscription History | Blue Sky Provider" headerTitle="Billing & Invoices">
      <div style={{ padding: '24px 16px 80px 16px', maxWidth: 960, margin: '0 auto' }}>
        {/* Header Navigation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => router.push('/provider')}
              className="btn btn-outline btn-sm"
              style={{
                width: 38,
                height: 38,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
              }}
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                Payment & Billing History
              </h1>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Track uploaded receipts, verification audits, and active listing tiers
              </span>
            </div>
          </div>

          <Link
            href="/provider/plans"
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 42,
              padding: '0 18px',
              fontSize: 14,
            }}
          >
            <CreditCard size={16} /> + Choose New Plan
          </Link>
        </div>

        {/* Current Access Tier Banner */}
        <div
          style={{
            backgroundColor: isPeriodActive ? '#FFFFFF' : '#FFFBEB',
            border: isPeriodActive ? '2px solid #BAE6FD' : '2px solid #FDE68A',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 22px',
            marginBottom: 24,
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isPeriodActive ? 'var(--color-primary-tint)' : '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isPeriodActive ? 'var(--color-primary)' : '#D97706',
              }}
            >
              <ShieldCheck size={26} />
            </div>

            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                Listing Access Status: {isPeriodActive ? `Active (${daysLeft} Days Remaining)` : 'Access Inactive / Expired'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {isPeriodActive && effectiveExpiresAt
                  ? `Access valid through ${new Date(effectiveExpiresAt).toLocaleDateString()} (+48h grace safety window included)`
                  : 'Subscribe to an access plan to publish listings globally and accept verified tenant applications.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge variant={isPeriodActive ? 'active' : 'expired'}>
              {isPeriodActive ? 'ACTIVE ACCESS' : 'EXPIRED'}
            </Badge>

            <Link href="/provider/plans" className="btn btn-outline btn-sm" style={{ backgroundColor: 'white' }}>
              <RefreshCw size={13} /> {isPeriodActive ? 'Extend Plan' : 'Activate Plan'}
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#EEF2F6',
            padding: 4,
            borderRadius: 'var(--radius-lg)',
            marginBottom: 20,
            overflowX: 'auto',
            gap: 4,
          }}
        >
          {(
            [
              { id: 'all', label: 'All Invoices', count: counts.all },
              { id: 'verified', label: 'Verified & Active', count: counts.verified },
              { id: 'pending', label: 'Audit In Progress', count: counts.pending },
              { id: 'rejected', label: 'Changes Needed', count: counts.rejected },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PaymentFilterTab)}
                style={{
                  flex: 1,
                  minWidth: 120,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--color-white)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 100,
                    backgroundColor: isActive ? 'var(--color-primary-light)' : '#E2E8F0',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
            <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
            <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Loading payment history...</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          /* Empty State */
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-xl)',
              border: '2px dashed var(--color-border)',
            }}
          >
            <Receipt size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 6 }}>
              {activeTab === 'all' ? 'No payment records found' : `No payments in "${activeTab}" status`}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 440, margin: '0 auto 20px auto' }}>
              When you purchase a listing plan or upload transfer receipts, all audit and transaction histories will appear here.
            </p>
            <Link href="/provider/plans" className="btn btn-primary" style={{ display: 'inline-flex', gap: 6 }}>
              <CreditCard size={16} /> Choose a Listing Plan
            </Link>
          </div>
        ) : (
          /* Payment Receipts List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredPayments.map((pmt) => {
              const isVerified = pmt.status === 'verified';
              const isRejected = pmt.status === 'rejected';
              const isPending = pmt.status === 'pending';

              return (
                <div
                  key={pmt.id}
                  style={{
                    backgroundColor: 'var(--color-white)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-card)',
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Badge
                          variant={
                            isVerified
                              ? 'published'
                              : isRejected
                              ? 'rejected'
                              : 'pending'
                          }
                        >
                          {isVerified
                            ? 'VERIFIED & ACTIVATED'
                            : isPending
                            ? 'AUDIT IN PROGRESS'
                            : 'ACTION REQUIRED'}
                        </Badge>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                          ID: {pmt.id.slice(0, 10)}...
                        </span>
                      </div>

                      <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-navy-dark)', margin: '4px 0 2px 0' }}>
                        {pmt.listing_plan_name || 'Listing Access Plan'}
                      </h3>

                      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        Payment Method: <strong>{pmt.payment_method_name || 'Direct Transfer'}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-navy-dark)' }}>
                        {pmt.currency_code} ${pmt.amount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        Submitted {new Date(pmt.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Audit Details */}
                  {isVerified && pmt.verified_at && (
                    <div
                      style={{
                        backgroundColor: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        fontSize: 12,
                        color: '#166534',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <CheckCircle2 size={16} color="#16A34A" />
                      <span>
                        Verified by Compliance Admin on {new Date(pmt.verified_at).toLocaleString()}. Access period active.
                      </span>
                    </div>
                  )}

                  {/* Rejection Details & Resubmit CTA */}
                  {isRejected && (
                    <div
                      style={{
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 14px',
                        fontSize: 13,
                        color: '#991B1B',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, marginBottom: 4 }}>
                        <AlertCircle size={16} color="#DC2626" />
                        Verification Issue Identified:
                      </div>
                      <div>
                        {pmt.rejection_reason || 'The uploaded receipt was unreadable or the transfer reference did not match our records.'}
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <Link
                          href={`/provider/payment?planId=${pmt.listing_plan_id}`}
                          className="btn btn-primary btn-sm"
                          style={{ display: 'inline-flex', fontSize: 12 }}
                        >
                          Resubmit Payment Proof
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Pending Details */}
                  {isPending && (
                    <div
                      style={{
                        backgroundColor: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        fontSize: 12,
                        color: '#92400E',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Clock size={16} color="#D97706" />
                      <span>
                        Receipt undergoing compliance audit. Average verification turnaround is 1 to 4 hours.
                      </span>
                    </div>
                  )}

                  {/* Footer Receipt Info */}
                  <div
                    style={{
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} />
                        <span>Receipt File: {pmt.proof_storage_path.split('/').pop() || 'receipt.png'}</span>
                      </div>
                      {pmt.proof_storage_path && (
                        <a
                          href={resolveDocumentUrl(pmt.proof_storage_path)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: 'var(--color-primary)',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            textDecoration: 'none',
                            fontSize: 12,
                          }}
                        >
                          <ExternalLink size={12} /> View Proof
                        </a>
                      )}
                    </div>

                    <Link
                      href="/provider/plans"
                      style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}
                    >
                      View All Plans & Durations →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
