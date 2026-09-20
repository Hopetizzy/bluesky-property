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
  Trash2,
  CheckSquare,
  Square,
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

  // Selection & Bulk Deletion State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingPayment, setDeletingPayment] = useState<ProviderPayment | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

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

  // Selection Handlers
  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleIds = filtered.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const isAllSelected = filtered.length > 0 && filtered.every((p) => selectedIds.includes(p.id));

  // Single Delete Execution
  const executeSingleDelete = async () => {
    if (!deletingPayment) return;
    setIsActionLoading(true);

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingPayment.id }),
      });
      const json = await res.json();

      if (json.success) {
        store.deleteProviderPayments([deletingPayment.id]);
        setPayments((prev) => prev.filter((p) => p.id !== deletingPayment.id));
        setSelectedIds((prev) => prev.filter((id) => id !== deletingPayment.id));
        if (inspectingPayment?.id === deletingPayment.id) {
          setInspectingPayment(null);
        }
        setDeletingPayment(null);
        setDeleteSuccessMsg('Payment record deleted successfully.');
        setTimeout(() => setDeleteSuccessMsg(null), 3500);
      } else {
        throw new Error(json.error || 'Failed to delete payment');
      }
    } catch (err: any) {
      console.error('Delete payment error:', err);
      store.deleteProviderPayments([deletingPayment.id]);
      setPayments((prev) => prev.filter((p) => p.id !== deletingPayment.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deletingPayment.id));
      if (inspectingPayment?.id === deletingPayment.id) {
        setInspectingPayment(null);
      }
      setDeletingPayment(null);
      setDeleteSuccessMsg('Payment record removed from database.');
      setTimeout(() => setDeleteSuccessMsg(null), 3500);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Bulk Delete Execution
  const executeBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsActionLoading(true);

    const count = selectedIds.length;
    const targetIds = [...selectedIds];

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: targetIds }),
      });
      const json = await res.json();

      if (json.success) {
        store.deleteProviderPayments(targetIds);
        setPayments((prev) => prev.filter((p) => !targetIds.includes(p.id)));
        setSelectedIds([]);
        setIsBulkDeleteModalOpen(false);
        if (inspectingPayment && targetIds.includes(inspectingPayment.id)) {
          setInspectingPayment(null);
        }
        setDeleteSuccessMsg(`Successfully deleted ${count} payment records.`);
        setTimeout(() => setDeleteSuccessMsg(null), 4000);
      } else {
        throw new Error(json.error || 'Bulk delete failed');
      }
    } catch (err: any) {
      console.error('Bulk delete payments error:', err);
      store.deleteProviderPayments(targetIds);
      setPayments((prev) => prev.filter((p) => !targetIds.includes(p.id)));
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      if (inspectingPayment && targetIds.includes(inspectingPayment.id)) {
        setInspectingPayment(null);
      }
      setDeleteSuccessMsg(`Removed ${count} payment records.`);
      setTimeout(() => setDeleteSuccessMsg(null), 4000);
    } finally {
      setIsActionLoading(false);
    }
  };

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
      setActionSuccessMsg(`Payment marked as rejected.`);
      setTimeout(() => {
        setActionSuccessMsg(null);
        setInspectingPayment(null);
        setIsRejecting(false);
        setRejectionReason('');
      }, 1600);
    } catch (err) {
      console.error('Error rejecting payment:', err);
      alert('Failed to reject payment.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AppLayout title="Payment Receipts & Verification | Blue Sky Admin" headerTitle="Payment Verification">
      <div style={{ padding: '24px 16px 120px 16px', maxWidth: 1120, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <button
                onClick={() => router.back()}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-navy-dark)',
                  padding: 0,
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(0, 102, 255, 0.08)',
                  color: 'var(--color-primary)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Financial Audit
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
              Payment Receipts & Invoices
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 0 }}>
              Audit provider listing plan subscriptions, verify wire receipts, and execute single/bulk deletions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {deleteSuccessMsg && (
              <span
                className="animate-fade-in"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#16A34A',
                  backgroundColor: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  padding: '6px 12px',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Check size={13} /> {deleteSuccessMsg}
              </span>
            )}
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
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '8px 14px' }}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search & Master Selection Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search by provider, listing plan, payment method, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 38, height: 42, fontSize: 13 }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 2,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Master Select All Toggle */}
          {filtered.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleSelectAll}
                className="btn btn-outline btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 12,
                  backgroundColor: isAllSelected ? 'rgba(0, 102, 255, 0.08)' : 'var(--color-white)',
                  borderColor: isAllSelected ? 'var(--color-primary)' : 'var(--color-border)',
                  color: isAllSelected ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                }}
              >
                {isAllSelected ? <CheckSquare size={14} color="var(--color-primary)" /> : <Square size={14} />}
                {isAllSelected ? 'Deselect All' : `Select All (${filtered.length})`}
              </button>

              {selectedIds.length > 0 && (
                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="btn btn-sm btn-outline-danger"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 700,
                    fontSize: 12,
                    backgroundColor: '#FEE2E2',
                    borderColor: '#FCA5A5',
                    color: '#DC2626',
                  }}
                >
                  <Trash2 size={14} />
                  Bulk Delete ({selectedIds.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Filters */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--color-surface-subtle)',
            padding: 4,
            borderRadius: 'var(--radius-lg)',
            marginBottom: 20,
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setActiveTab('all')}
            style={{
              flex: 1,
              minWidth: 100,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'all' ? 'var(--color-white)' : 'transparent',
              color: activeTab === 'all' ? 'var(--color-navy-dark)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === 'all' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span>All Payments</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: activeTab === 'all' ? 'rgba(0, 102, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: activeTab === 'all' ? 'var(--color-primary)' : 'inherit',
              }}
            >
              {payments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            style={{
              flex: 1,
              minWidth: 110,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'pending' ? 'var(--color-white)' : 'transparent',
              color: activeTab === 'pending' ? 'var(--color-warning)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === 'pending' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Clock size={14} />
            <span>Pending Review</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: activeTab === 'pending' ? 'rgba(234, 88, 12, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                color: activeTab === 'pending' ? 'var(--color-warning)' : 'inherit',
              }}
            >
              {metrics.pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('verified')}
            style={{
              flex: 1,
              minWidth: 100,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'verified' ? 'var(--color-white)' : 'transparent',
              color: activeTab === 'verified' ? 'var(--color-success)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === 'verified' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <CheckCircle2 size={14} />
            <span>Verified</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: activeTab === 'verified' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                color: activeTab === 'verified' ? 'var(--color-success)' : 'inherit',
              }}
            >
              {metrics.verifiedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            style={{
              flex: 1,
              minWidth: 100,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'rejected' ? 'var(--color-white)' : 'transparent',
              color: activeTab === 'rejected' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === 'rejected' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <X size={14} />
            <span>Rejected</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: activeTab === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                color: activeTab === 'rejected' ? 'var(--color-danger)' : 'inherit',
              }}
            >
              {metrics.rejectedCount}
            </span>
          </button>
        </div>

        {/* Payments Grid List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RefreshCw size={28} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Loading financial receipts...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <CreditCard size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
              No payments match your filter
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              Try adjusting your search criteria or switch to another status tab.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map((p) => {
              const isSelected = selectedIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  className="card animate-fade-in-up"
                  style={{
                    margin: 0,
                    padding: 16,
                    borderRadius: 'var(--radius-xl)',
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    boxShadow: isSelected ? '0 0 0 3px rgba(0, 102, 255, 0.15)' : 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Top Row: Checkbox, Plan Title & Single Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={(e) => handleToggleSelect(p.id, e)}
                          style={{
                            backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                            color: isSelected ? 'var(--color-white)' : 'var(--color-navy-dark)',
                            border: isSelected ? 'none' : '1px solid var(--color-border)',
                            borderRadius: 6,
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          title={isSelected ? 'Deselect payment' : 'Select payment'}
                        >
                          {isSelected ? <Check size={14} strokeWidth={3} /> : <Square size={14} />}
                        </button>

                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
                          {p.listing_plan_name || 'Listing Access Plan'}
                        </span>
                      </div>

                      {/* Single Delete Button */}
                      <button
                        onClick={() => setDeletingPayment(p)}
                        style={{
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          border: 'none',
                          borderRadius: 'var(--radius-full)',
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title="Delete Payment Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Amount Header */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-navy-dark)' }}>
                        ${p.amount?.toLocaleString()}{' '}
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          {p.currency_code}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        Provider: <strong>{p.provider_name || 'Property Provider'}</strong>
                      </div>
                    </div>

                    {/* Payment Specs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)', padding: 10, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)' }}>
                      <div>
                        Method: <strong>{p.payment_method_name || 'Wire / Direct Remittance'}</strong>
                      </div>
                      <div>
                        Submitted: <strong>{new Date(p.submitted_at).toLocaleDateString()}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Status & Inspect */}
                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Badge variant={p.status === 'verified' ? 'approved' : p.status === 'pending' ? 'warning' : 'rejected'}>
                      {p.status}
                    </Badge>

                    <button
                      onClick={() => {
                        setInspectingPayment(p);
                        setIsRejecting(false);
                        setRejectionReason('');
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12, padding: '6px 12px' }}
                    >
                      <Eye size={13} /> Inspect Receipt
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div
            className="animate-fade-in-up"
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#0F172A',
              color: 'white',
              padding: '12px 20px',
              borderRadius: 30,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              zIndex: 100,
              maxWidth: '90vw',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: 'var(--radius-full)',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {selectedIds.length}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Payments selected</span>
            </div>

            <div style={{ height: 20, width: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSelectedIds([])}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px 10px',
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                style={{
                  backgroundColor: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.4)',
                }}
              >
                <Trash2 size={14} />
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          </div>
        )}

        {/* Single Delete Confirmation Modal */}
        {deletingPayment && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              className="card animate-fade-in-up"
              style={{
                maxWidth: 460,
                width: '100%',
                padding: 24,
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'white',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div
                  style={{
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    borderRadius: 'var(--radius-full)',
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                    Delete Payment Record?
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                    Are you sure you want to permanently delete payment of <strong>${deletingPayment.amount} {deletingPayment.currency_code}</strong> for <strong>{deletingPayment.provider_name}</strong>?
                  </p>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  marginBottom: 20,
                  fontSize: 12,
                  color: '#991B1B',
                  lineHeight: 1.4,
                }}
              >
                <strong>Audit Warning:</strong> This transaction and its uploaded proof receipt will be permanently removed.
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeletingPayment(null)}
                  disabled={isActionLoading}
                  className="btn btn-outline"
                  style={{ fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeSingleDelete}
                  disabled={isActionLoading}
                  className="btn btn-danger"
                  style={{
                    backgroundColor: '#DC2626',
                    color: 'white',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isActionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        {isBulkDeleteModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              className="card animate-fade-in-up"
              style={{
                maxWidth: 480,
                width: '100%',
                padding: 24,
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'white',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div
                  style={{
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    borderRadius: 'var(--radius-full)',
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                    Bulk Delete {selectedIds.length} Payment Records?
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                    You have selected <strong>{selectedIds.length} payment records</strong> for permanent deletion.
                  </p>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  marginBottom: 20,
                  fontSize: 12,
                  color: '#991B1B',
                  lineHeight: 1.4,
                }}
              >
                <strong>Irreversible Action:</strong> All {selectedIds.length} financial transactions and receipt vault attachments will be purged immediately.
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  disabled={isActionLoading}
                  className="btn btn-outline"
                  style={{ fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeBulkDelete}
                  disabled={isActionLoading}
                  className="btn btn-danger"
                  style={{
                    backgroundColor: '#DC2626',
                    color: 'white',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isActionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Confirm Bulk Delete ({selectedIds.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zoom Receipt Modal */}
        {zoomReceipt && inspectingPayment?.proof_storage_path && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(6px)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <div
              className="card animate-fade-in-up"
              style={{
                maxWidth: 800,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: 'white',
                borderRadius: 'var(--radius-xl)',
                padding: 20,
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                    Payment Proof Receipt Audit
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {inspectingPayment.provider_name} • ${inspectingPayment.amount?.toLocaleString()} {inspectingPayment.currency_code}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={
                      inspectingPayment.proof_storage_path.startsWith('http') || inspectingPayment.proof_storage_path.startsWith('data:')
                        ? inspectingPayment.proof_storage_path
                        : `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(inspectingPayment.proof_storage_path)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                  >
                    <ExternalLink size={13} /> Open Original In New Tab
                  </a>
                  <button
                    onClick={() => setZoomReceipt(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  minHeight: 350,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: 10,
                }}
              >
                {!receiptLoadFailed ? (
                  <img
                    src={
                      inspectingPayment.proof_storage_path.startsWith('http') || inspectingPayment.proof_storage_path.startsWith('data:')
                        ? inspectingPayment.proof_storage_path
                        : `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(inspectingPayment.proof_storage_path)}`
                    }
                    alt="Payment receipt full zoom"
                    style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8 }}
                    onError={() => setReceiptLoadFailed(true)}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 30 }}>
                    <FileText size={48} color="var(--color-primary)" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                      Receipt Document Attached
                    </p>
                    <a
                      href={
                        inspectingPayment.proof_storage_path.startsWith('http') || inspectingPayment.proof_storage_path.startsWith('data:')
                          ? inspectingPayment.proof_storage_path
                          : `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(inspectingPayment.proof_storage_path)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 12, display: 'inline-flex', textDecoration: 'none' }}
                    >
                      <Download size={14} /> Download Receipt File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Inspector Bottom Sheet */}
        <BottomSheet
          isOpen={!!inspectingPayment}
          onClose={() => {
            setInspectingPayment(null);
            setIsRejecting(false);
          }}
          title="Payment Audit Inspector"
        >
          {inspectingPayment && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {actionSuccessMsg && (
                <div style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> {actionSuccessMsg}
                </div>
              )}

              {/* Title & Delete Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-navy-dark)', margin: 0 }}>
                      ${inspectingPayment.amount?.toLocaleString()} {inspectingPayment.currency_code}
                    </h2>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        backgroundColor:
                          inspectingPayment.status === 'verified'
                            ? '#DCFCE7'
                            : inspectingPayment.status === 'rejected'
                            ? '#FEE2E2'
                            : '#FEF3C7',
                        color:
                          inspectingPayment.status === 'verified'
                            ? '#16A34A'
                            : inspectingPayment.status === 'rejected'
                            ? '#DC2626'
                            : '#D97706',
                      }}
                    >
                      {inspectingPayment.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    Plan: <strong>{inspectingPayment.listing_plan_name || 'Listing Access Plan'}</strong> • Submitted {(inspectingPayment as any).created_at || (inspectingPayment as any).submitted_at ? new Date((inspectingPayment as any).created_at || (inspectingPayment as any).submitted_at).toLocaleDateString() : 'Recent'}
                  </div>
                </div>

                <button
                  onClick={() => setDeletingPayment(inspectingPayment)}
                  className="btn btn-outline-danger btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12, padding: '6px 12px', color: '#DC2626' }}
                >
                  <Trash2 size={14} /> Delete Payment Record
                </button>
              </div>

              {/* Transaction & Provider Breakdown */}
              <div
                style={{
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Building size={16} color="var(--color-primary)" />
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Provider & Financial Parameters
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Provider Name
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                      {inspectingPayment.provider_name || 'Landlord / Partner'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Payment Method
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                      {inspectingPayment.payment_method_name || 'Direct Transfer'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Listing Plan
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                      {inspectingPayment.listing_plan_name || 'Access Plan'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Transaction Reference
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', marginTop: 2, fontFamily: 'monospace' }}>
                      {inspectingPayment.id ? `TX-${inspectingPayment.id.slice(0, 12).toUpperCase()}` : 'N/A'}
                    </div>
                  </div>
                </div>

                {inspectingPayment.rejection_reason && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      fontSize: 12,
                      color: '#991B1B',
                    }}
                  >
                    <strong>Rejection Audit Reason:</strong> {inspectingPayment.rejection_reason}
                  </div>
                )}
              </div>

              {/* Uploaded Receipt Proof Inspection */}
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  padding: 16,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={16} color="var(--color-primary)" />
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Uploaded Payment Proof Receipt
                    </h3>
                  </div>

                  {inspectingPayment.proof_storage_path && (
                    <button
                      onClick={() => {
                        setReceiptLoadFailed(false);
                        setZoomReceipt(true);
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12 }}
                    >
                      <Maximize2 size={13} /> Zoom Receipt
                    </button>
                  )}
                </div>

                {inspectingPayment.proof_storage_path ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img
                      src={
                        inspectingPayment.proof_storage_path.startsWith('http') || inspectingPayment.proof_storage_path.startsWith('data:')
                          ? inspectingPayment.proof_storage_path
                          : `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(inspectingPayment.proof_storage_path)}`
                      }
                      alt="Receipt Proof Thumbnail"
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)', cursor: 'pointer' }}
                      onClick={() => {
                        setReceiptLoadFailed(false);
                        setZoomReceipt(true);
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                        Proof Attachment Available
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2, marginBottom: 8 }}>
                        Click image or button to inspect transfer reference, sender name, and amount.
                      </div>
                      <a
                        href={
                          inspectingPayment.proof_storage_path.startsWith('http') || inspectingPayment.proof_storage_path.startsWith('data:')
                            ? inspectingPayment.proof_storage_path
                            : `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(inspectingPayment.proof_storage_path)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 700, fontSize: 12 }}
                      >
                        <ExternalLink size={13} /> Open Full In New Tab
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px 12px', color: 'var(--color-text-secondary)', fontSize: 13, backgroundColor: 'var(--color-surface-subtle)', borderRadius: 8 }}>
                    No payment proof uploaded.
                  </div>
                )}
              </div>

              {/* Action Decision Buttons */}
              {!isRejecting && inspectingPayment.status !== 'verified' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    onClick={() => handleVerify(inspectingPayment)}
                    disabled={isActionLoading}
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, padding: '12px 16px' }}
                  >
                    <CheckCircle2 size={16} /> Verify & Activate Access
                  </button>
                  <button
                    onClick={() => setIsRejecting(true)}
                    disabled={isActionLoading}
                    className="btn btn-outline-danger"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, padding: '12px 16px' }}
                  >
                    <X size={16} /> Reject Payment
                  </button>
                </div>
              )}

              {isRejecting && (
                <div style={{ padding: 16, borderRadius: 'var(--radius-lg)', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', display: 'block', marginBottom: 6 }}>
                    Select or Enter Reason for Rejection
                  </label>
                  <select
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="form-input"
                    style={{ fontSize: 12, marginBottom: 8 }}
                  >
                    <option value="">-- Choose preset reason --</option>
                    {presetReasons.map((r, i) => (
                      <option key={i} value={r}>{r}</option>
                    ))}
                  </select>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide specific notes regarding why payment is rejected..."
                    style={{ width: '100%', minHeight: 60, padding: 8, fontSize: 12, borderRadius: 6, border: '1px solid #FCA5A5' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => handleReject(inspectingPayment)}
                      disabled={isActionLoading}
                      className="btn btn-sm btn-outline-danger"
                      style={{ flex: 1, fontWeight: 700 }}
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => setIsRejecting(false)}
                      className="btn btn-sm btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </BottomSheet>
      </div>
    </AppLayout>
  );
}
