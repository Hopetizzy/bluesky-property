import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  CreditCard,
  Check,
  X,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ExternalLink,
  ShieldCheck,
  Calendar,
  DollarSign,
  Building,
  Search,
  TrendingUp,
  XCircle,
  AlertTriangle,
  Layers,
  Download,
  Maximize2,
  Mail,
  Phone,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { listingPlansDb } from '@/lib/db/listingPlans';
import { store } from '@/lib/store';
import { ProviderPayment } from '@/lib/types';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<ProviderPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [inspectingPayment, setInspectingPayment] = useState<ProviderPayment | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [zoomReceipt, setZoomReceipt] = useState(false);
  const [receiptLoadFailed, setReceiptLoadFailed] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState<string | null>(null);

  const presetReasons = [
    'Unverified reference on bank account statement',
    'Payment amount received does not match plan price',
    'Document proof is blurry, cropped, or unreadable',
    'Receipt missing transfer date or sender confirmation details',
    'Funds sent to incorrect bank account or channel',
  ];

  const loadPayments = async (isManual = false) => {
    setIsLoading(true);
    try {
      const list = await listingPlansDb.getAllPaymentsForAdmin();
      setPayments(list);
      if (isManual) {
        setRefreshFeedback(`Synced! ${list.length} payment record${list.length === 1 ? '' : 's'} loaded.`);
        setTimeout(() => setRefreshFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Error loading payments:', err);
      const fallback = store.getProviderPayments();
      setPayments(fallback);
      if (isManual) {
        setRefreshFeedback('Synced from local storage.');
        setTimeout(() => setRefreshFeedback(null), 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments(false);
  }, []);

  // Filtered payments by tab and search
  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesTab = activeTab === 'all' ? true : p.status === activeTab;
      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const provider = (p.provider_name || '').toLowerCase();
      const plan = (p.listing_plan_name || '').toLowerCase();
      const method = (p.payment_method_name || '').toLowerCase();
      const amount = (p.amount?.toString() || '').toLowerCase();
      const id = (p.id || '').toLowerCase();

      return provider.includes(q) || plan.includes(q) || method.includes(q) || amount.includes(q) || id.includes(q);
    });
  }, [payments, activeTab, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalVolume = payments
      .filter((p) => p.status === 'verified')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingCount = payments.filter((p) => p.status === 'pending').length;
    const verifiedCount = payments.filter((p) => p.status === 'verified').length;
    const rejectedCount = payments.filter((p) => p.status === 'rejected').length;

    return { totalVolume, pendingCount, verifiedCount, rejectedCount };
  }, [payments]);

  const handleVerify = async (payment: ProviderPayment) => {
    setIsActionLoading(true);
    try {
      await listingPlansDb.verifyPaymentAndActivatePeriod(payment, 'Super Admin');
      await loadPayments();
      setActionSuccessMsg(`Listing access activated successfully for ${payment.provider_name || 'Provider'}!`);
      setTimeout(() => {
        setActionSuccessMsg(null);
        setInspectingPayment(null);
      }, 1600);
    } catch (err) {
      console.error('Error verifying payment:', err);
      alert('Failed to verify payment. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (payment: ProviderPayment) => {
    if (!rejectionReason.trim()) {
      alert('Please select or specify a rejection reason.');
      return;
    }
    setIsActionLoading(true);
    try {
      await listingPlansDb.rejectPaymentProof(payment.id, rejectionReason.trim());
      await loadPayments();
      setIsRejecting(false);
      setRejectionReason('');
      setActionSuccessMsg(`Payment proof rejected. Notification logged in database.`);
      setTimeout(() => {
        setActionSuccessMsg(null);
        setInspectingPayment(null);
      }, 1600);
    } catch (err) {
      console.error('Error rejecting payment:', err);
      alert('Failed to reject payment. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getProofImageUrl = (pathOrUrl?: string) => {
    if (!pathOrUrl) return 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1000&q=80';
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
  };

  const handleDownloadProof = (url: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'payment_proof_document';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <AppLayout title="Payment Verification Desk | Blue Sky Operations" headerTitle="Payment Verification">
      <div style={{ padding: '24px 16px 80px 16px', maxWidth: 960, margin: '0 auto' }}>
        
        {/* Header Command Strip */}
        <div className="flex-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => router.push('/admin')}
              style={{
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-navy-dark)',
                width: 38,
                height: 38,
                transition: 'all 0.15s ease',
              }}
              title="Return to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em', margin: 0 }}>
                  Payment Verification Desk
                </h1>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    backgroundColor: '#EFF6FF',
                    color: '#1E40AF',
                    padding: '2px 8px',
                    borderRadius: 12,
                    border: '1px solid #DBEAFE',
                  }}
                >
                  Payments Desk
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2, margin: 0 }}>
                Audit provider listing payments, inspect bank transfer receipts, and activate listing periods
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {refreshFeedback && (
              <span
                className="animate-fade-in"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#16A34A',
                  backgroundColor: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  padding: '4px 10px',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Check size={13} /> {refreshFeedback}
              </span>
            )}
            <button
              onClick={() => loadPayments(true)}
              disabled={isLoading}
              className="btn btn-outline-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                padding: '8px 14px',
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh Desk
            </button>
          </div>
        </div>

        {/* Summary Metrics Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {/* Metric 1: Verified Volume */}
          <div
            className="card"
            style={{
              margin: 0,
              padding: 16,
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div className="flex-between" style={{ color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 600 }}>
              <span>Total Verified Revenue</span>
              <DollarSign size={16} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em' }}>
              ${metrics.totalVolume.toLocaleString()}
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              From {metrics.verifiedCount} verified subscriptions
            </span>
          </div>

          {/* Metric 2: Pending Audits */}
          <div
            className="card"
            style={{
              margin: 0,
              padding: 16,
              backgroundColor: metrics.pendingCount > 0 ? '#FFFBEB' : 'var(--color-white)',
              border: metrics.pendingCount > 0 ? '1px solid #FCD34D' : '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div className="flex-between" style={{ color: metrics.pendingCount > 0 ? '#B45309' : 'var(--color-text-secondary)', fontSize: 12, fontWeight: 600 }}>
              <span>Action Required</span>
              <Clock size={16} color={metrics.pendingCount > 0 ? '#D97706' : 'var(--color-text-muted)'} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: metrics.pendingCount > 0 ? '#B45309' : 'var(--color-navy-dark)', letterSpacing: '-0.02em' }}>
              {metrics.pendingCount} Pending
            </div>
            <span style={{ fontSize: 11, color: metrics.pendingCount > 0 ? '#92400E' : 'var(--color-text-muted)' }}>
              {metrics.pendingCount > 0 ? 'Receipts awaiting review' : 'All receipts up to date'}
            </span>
          </div>

          {/* Metric 3: Total Verified */}
          <div
            className="card"
            style={{
              margin: 0,
              padding: 16,
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div className="flex-between" style={{ color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 600 }}>
              <span>Active Verified</span>
              <CheckCircle2 size={16} color="#16A34A" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em' }}>
              {metrics.verifiedCount}
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Listing periods active & valid
            </span>
          </div>

          {/* Metric 4: Rejections */}
          <div
            className="card"
            style={{
              margin: 0,
              padding: 16,
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div className="flex-between" style={{ color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 600 }}>
              <span>Rejected / Flagged</span>
              <XCircle size={16} color="#DC2626" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em' }}>
              {metrics.rejectedCount}
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Deficient receipts returned
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search
              size={16}
              color="var(--color-text-muted)"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by provider, plan, method, or amount..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-white)',
                fontSize: 13,
                outline: 'none',
                color: 'var(--color-navy-dark)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--color-surface-subtle)',
              padding: 3,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            {[
              { id: 'all', label: 'All', count: payments.length },
              { id: 'pending', label: 'Pending', count: payments.filter((p) => p.status === 'pending').length },
              { id: 'verified', label: 'Verified', count: payments.filter((p) => p.status === 'verified').length },
              { id: 'rejected', label: 'Rejected', count: payments.filter((p) => p.status === 'rejected').length },
            ].map((t) => {
              const isSelected = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: isSelected ? 'var(--color-white)' : 'transparent',
                    color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t.label}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 10,
                      backgroundColor: isSelected ? '#EFF6FF' : 'rgba(0,0,0,0.06)',
                      color: isSelected ? '#1E40AF' : 'inherit',
                    }}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payments List */}
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px', margin: 0 }}>
            <CreditCard size={44} color="var(--color-text-muted)" style={{ margin: '0 auto 14px auto' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
              No Payment Proofs Found
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 16 }}>
              {searchQuery
                ? `No payment transactions match "${searchQuery}".`
                : 'There are no payment proofs matching this category.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-outline-secondary btn-sm"
                style={{ margin: '0 auto' }}
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((p) => {
              const isPending = p.status === 'pending';
              const isVerified = p.status === 'verified';
              const isRejected = p.status === 'rejected';

              return (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    margin: 0,
                    padding: 16,
                    backgroundColor: 'var(--color-white)',
                    border: isPending ? '1px solid #FCD34D' : '1px solid var(--color-border)',
                    boxShadow: isPending ? '0 2px 8px rgba(217, 119, 6, 0.08)' : 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: '#EFF6FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-primary)',
                          }}
                        >
                          <Building size={16} />
                        </div>
                        <div>
                          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                            {p.provider_name || 'Provider Partner'}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                            ID: {p.id}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 6, fontSize: 12 }}>
                        <span
                          style={{
                            backgroundColor: 'var(--color-surface-subtle)',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 600,
                            color: 'var(--color-navy-dark)',
                          }}
                        >
                          {p.listing_plan_name || 'Listing Access Plan'}
                          {p.listing_plan_duration_days && ` (${p.listing_plan_duration_days} Days)`}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}>•</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          Method: <strong>{p.payment_method_name || 'Bank Wire'}</strong>
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={
                        isVerified
                          ? 'approved'
                          : isRejected
                          ? 'rejected'
                          : 'warning'
                      }
                    >
                      {p.status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Rejection Notice if rejected */}
                  {isRejected && p.rejection_reason && (
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12,
                        color: '#991B1B',
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 6,
                      }}
                    >
                      <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <strong>Rejection Reason:</strong> {p.rejection_reason}
                      </div>
                    </div>
                  )}

                  {/* Bottom Strip: Amount + Actions */}
                  <div
                    className="flex-between"
                    style={{
                      borderTop: '1px solid var(--color-surface-subtle)',
                      paddingTop: 12,
                      marginTop: 6,
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                        ${p.amount?.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 6 }}>
                        {p.currency_code || 'USD'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 10 }}>
                        Submitted {new Date(p.submitted_at || Date.now()).toLocaleDateString()}
                      </span>
                      {p.verified_at && (
                        <span style={{ fontSize: 11, color: '#16A34A', marginLeft: 8, fontWeight: 600 }}>
                          • Verified on {new Date(p.verified_at).toLocaleDateString()} by {p.verified_by || 'Admin'}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingPayment(p);
                          setIsRejecting(false);
                          setRejectionReason('');
                          setActionSuccessMsg(null);
                        }}
                        className={isPending ? 'btn btn-primary btn-sm' : 'btn btn-outline-secondary btn-sm'}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Eye size={14} /> {isPending ? 'Audit & Activate' : 'Inspect Proof'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comprehensive Payment Audit Drawer / Modal */}
      <BottomSheet
        isOpen={!!inspectingPayment}
        onClose={() => {
          setInspectingPayment(null);
          setIsRejecting(false);
          setRejectionReason('');
          setZoomReceipt(false);
          setReceiptLoadFailed(false);
        }}
        title="Audit Payment Proof & Activate"
      >
        {inspectingPayment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {actionSuccessMsg && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #86EFAC',
                  color: '#065F46',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle2 size={18} color="#16A34A" /> {actionSuccessMsg}
              </div>
            )}

            {/* Receipt Proof Photo Preview Card */}
            <div>
              <div className="flex-between" style={{ marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                  Submitted Payment Receipt / Proof
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setZoomReceipt(!zoomReceipt)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Maximize2 size={12} /> {zoomReceipt ? 'Fit Window' : 'Expand'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadProof(
                        getProofImageUrl(inspectingPayment.proof_storage_path),
                        `receipt_${inspectingPayment.id || 'payment'}`
                      )
                    }
                    className="btn btn-outline-secondary btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      padding: '3px 8px',
                    }}
                  >
                    <Download size={12} /> Download Proof
                  </button>

                  <a
                    href={getProofImageUrl(inspectingPayment.proof_storage_path)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: 'var(--color-primary)',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={12} /> Full Res
                  </a>
                </div>
              </div>

              <div
                style={{
                  width: '100%',
                  height: zoomReceipt ? 380 : 220,
                  borderRadius: 10,
                  overflow: 'hidden',
                  backgroundColor: '#0F172A',
                  position: 'relative',
                  border: '1px solid var(--color-border)',
                  transition: 'height 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!receiptLoadFailed ? (
                  <img
                    src={getProofImageUrl(inspectingPayment.proof_storage_path)}
                    alt="Payment Receipt"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={() => setReceiptLoadFailed(true)}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <FileText size={48} color="#38BDF8" style={{ margin: '0 auto 8px auto' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>
                      Payment Proof Record
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                      {inspectingPayment.payment_method_name} • ${inspectingPayment.amount} {inspectingPayment.currency_code}
                    </div>
                    <div style={{ fontSize: 11, color: '#38BDF8', marginTop: 8 }}>
                      Ref: {inspectingPayment.proof_storage_path ? inspectingPayment.proof_storage_path.split('/').pop() : 'Direct Underwriting Submission'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Provider & Transaction Parameters Breakdown */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-subtle)',
                padding: 14,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: 13,
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Provider Name:</span>
                <strong style={{ color: 'var(--color-navy-dark)' }}>{inspectingPayment.provider_name || 'Provider Partner'}</strong>
              </div>

              {(inspectingPayment.provider_email || inspectingPayment.provider_phone) && (
                <div className="flex-between" style={{ flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Contact Details:</span>
                  <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                    {inspectingPayment.provider_email && (
                      <a href={`mailto:${inspectingPayment.provider_email}`} style={{ color: 'var(--color-primary)' }}>
                        {inspectingPayment.provider_email}
                      </a>
                    )}
                    {inspectingPayment.provider_phone && (
                      <span style={{ color: 'var(--color-text-muted)' }}>{inspectingPayment.provider_phone}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex-between" style={{ flexWrap: 'wrap', gap: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Listing Plan:</span>
                <strong style={{ color: 'var(--color-primary)' }}>
                  {inspectingPayment.listing_plan_name || 'Listing Plan'}
                  {inspectingPayment.listing_plan_duration_days && ` (${inspectingPayment.listing_plan_duration_days} Days)`}
                </strong>
              </div>

              <div className="flex-between" style={{ flexWrap: 'wrap', gap: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Amount Declared:</span>
                <strong style={{ fontSize: 16, color: 'var(--color-navy-dark)' }}>
                  ${inspectingPayment.amount?.toLocaleString()} {inspectingPayment.currency_code || 'USD'}
                </strong>
              </div>

              <div className="flex-between" style={{ flexWrap: 'wrap', gap: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Payment Method:</span>
                <span style={{ fontWeight: 600 }}>{inspectingPayment.payment_method_name || 'Bank Transfer'}</span>
              </div>

              <div className="flex-between" style={{ flexWrap: 'wrap', gap: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Submission Date:</span>
                <span>{new Date(inspectingPayment.submitted_at || Date.now()).toLocaleString()}</span>
              </div>

              <div className="flex-between" style={{ flexWrap: 'wrap', gap: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Current Status:</span>
                <Badge
                  variant={
                    inspectingPayment.status === 'verified'
                      ? 'approved'
                      : inspectingPayment.status === 'rejected'
                      ? 'rejected'
                      : 'warning'
                  }
                >
                  {inspectingPayment.status.toUpperCase()}
                </Badge>
              </div>

              {inspectingPayment.verified_at && (
                <div className="flex-between" style={{ flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {inspectingPayment.status === 'verified' ? 'Verified Stamp:' : 'Reviewed Stamp:'}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: inspectingPayment.status === 'verified' ? '#16A34A' : '#DC2626' }}>
                    {new Date(inspectingPayment.verified_at).toLocaleString()} by {inspectingPayment.verified_by || 'Admin'}
                  </span>
                </div>
              )}
            </div>

            {/* Automated Activation Notice */}
            <div
              style={{
                padding: 12,
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                fontSize: 12,
                color: '#1E40AF',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
                <ShieldCheck size={16} /> Automated Database Period Activation
              </div>
              Approving this payment will execute the database activation procedure (<code>activate_provider_listing_period</code>), extending or creating the provider&apos;s active listing access window with an automatic <strong>48-hour grace duration</strong>.
            </div>

            {/* Rejection Form */}
            {isRejecting && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={16} /> Reason for Payment Rejection
                </div>

                {/* Preset Quick Selectors */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#7F1D1D' }}>
                    Select Standard Rejection Reason:
                  </span>
                  {presetReasons.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionReason(preset)}
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: rejectionReason === preset ? '1px solid #DC2626' : '1px solid #FCA5A5',
                        backgroundColor: rejectionReason === preset ? '#FEE2E2' : 'white',
                        color: '#991B1B',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Or enter custom feedback explaining why payment proof was rejected..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #FCA5A5',
                    fontSize: 12,
                    outline: 'none',
                    backgroundColor: 'white',
                    fontFamily: 'inherit',
                  }}
                />

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(inspectingPayment)}
                    disabled={isActionLoading}
                    className="btn btn-danger btn-sm"
                  >
                    {isActionLoading ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isRejecting && (
              <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {inspectingPayment.status !== 'verified' && (
                  <button
                    type="button"
                    onClick={() => handleVerify(inspectingPayment)}
                    disabled={isActionLoading}
                    className="btn btn-primary"
                    style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <CheckCircle2 size={16} /> {isActionLoading ? 'Activating Period...' : 'Verify & Activate Listing Access'}
                  </button>
                )}

                {inspectingPayment.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    className="btn btn-outline-danger"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <X size={16} /> Reject Proof
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </AppLayout>
  );
}

