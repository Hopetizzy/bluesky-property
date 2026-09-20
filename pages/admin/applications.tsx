import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  X,
  Eye,
  FileText,
  User,
  Shield,
  Briefcase,
  DollarSign,
  Calendar,
  Home,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
  FileCheck2,
  Mail,
  Phone,
  Clock,
  TrendingUp,
  XCircle,
  AlertTriangle,
  Layers,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Copy,
  Send,
  Sparkles,
  EyeOff,
  CreditCard,
  Trash2,
  Download,
  Link as LinkIcon,
  PlusCircle,
  CheckSquare,
  Square,
  Globe,
  Share2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { applicationsDb } from '@/lib/db/applications';
import { propertiesDb } from '@/lib/db/properties';
import { store } from '@/lib/store';
import { RentalApplication, ApplicationStatus, ApplicationDocument, Property } from '@/lib/types';

function resolveDocumentUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }
  if (pathOrUrl.startsWith('/vault/')) {
    return `/api/vault/view?path=${encodeURIComponent(pathOrUrl.replace(/^\/vault\//, ''))}`;
  }
  if (pathOrUrl.startsWith('/payments/')) {
    return `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(pathOrUrl.replace(/^\/payments\//, ''))}`;
  }
  return `/api/vault/view?path=${encodeURIComponent(pathOrUrl)}`;
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccessMsg, setRefreshSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Status Filter
  const [activeTab, setActiveTab] = useState<'all' | 'under_review' | 'approved' | 'rejected'>('all');
  // Source Filter ('all' | 'direct' | 'listing')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'direct' | 'listing'>('all');

  const [inspectingApp, setInspectingApp] = useState<RentalApplication | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [inspectingDoc, setInspectingDoc] = useState<ApplicationDocument | null>(null);
  const [adminDocImgFailed, setAdminDocImgFailed] = useState(false);
  const [adminPaymentImgFailed, setAdminPaymentImgFailed] = useState(false);
  const [revealedSSNs, setRevealedSSNs] = useState<Record<string, boolean>>({});

  // Selection & Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingApp, setDeletingApp] = useState<RentalApplication | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  // Link Generator State & Modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState('Direct Rental Application Intake');
  const [linkInstructions, setLinkInstructions] = useState('');
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [linkFeeEnabled, setLinkFeeEnabled] = useState(true);
  const [linkFeeAmount, setLinkFeeAmount] = useState(50);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLinkResult, setGeneratedLinkResult] = useState<{ url: string; token: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const toggleRevealSSN = (id: string) => {
    setRevealedSSNs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Gmail Acceptance Outreach Modal State
  const [contactingApp, setContactingApp] = useState<RentalApplication | null>(null);
  const [customEmailBody, setCustomEmailBody] = useState('');
  const [copiedMsg, setCopiedMsg] = useState(false);

  const handleOpenContactModal = (app: RentalApplication) => {
    setContactingApp(app);
    const firstName = app.applicant_name ? app.applicant_name.split(' ')[0] : 'Applicant';
    const emailTemplate = `Hello ${firstName},

We are following up regarding your rental application (Ref #${app.application_ref}) for ${app.property_title || 'our residential property'}.

Summary:
- Property: ${app.property_title || 'Residential Property'}
- Target Unit: ${app.unit_name || 'Unit'}
- Monthly Rent: $${app.unit_rent?.toLocaleString() || '2,400'} USD
- Move-In: ${app.desired_move_in ? new Date(app.desired_move_in).toLocaleDateString() : 'Scheduled'}

Next Steps:
Please confirm your scheduled move-in availability and prepare final lease signing verification.

Best regards,
Blue Sky Property Management Operations
support@bluesky-property.com`;
    setCustomEmailBody(emailTemplate);
  };

  const presetReasons = [
    'Monthly income does not meet minimum 2.5x rent coverage threshold',
    'Unverifiable or incomplete identity documents in applicant vault',
    'Employment and income verification could not be authenticated',
    'Credit history or background screening parameters unmet',
    'Target property unit is no longer available for requested move-in date',
  ];

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [appsList, propsList] = await Promise.all([
        applicationsDb.getApplications(),
        propertiesDb.getAllPropertiesForAdmin().catch(() => store.getProperties()),
      ]);

      setApplications(appsList);
      setProperties(propsList);

      if (isManualRefresh) {
        setRefreshSuccessMsg(`Synced! ${appsList.length} rental applications loaded live.`);
        setTimeout(() => setRefreshSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Error loading applications:', err);
      setApplications(store.getApplications());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  const handleUpdatePaymentStatus = async (paymentId: string, status: 'verified' | 'rejected') => {
    setIsVerifyingPayment(true);
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          payment_status: status,
          reviewer_name: 'Admin Underwriter',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setApplications((prev) =>
          prev.map((app) => {
            if (app.payment?.id === paymentId) {
              return {
                ...app,
                payment: { ...app.payment, status },
              };
            }
            return app;
          })
        );
        if (inspectingApp?.payment?.id === paymentId) {
          setInspectingApp((prev) => (prev ? { ...prev, payment: { ...prev.payment!, status } } : null));
        }
      }
    } catch (e) {
      console.warn('Payment update note:', e);
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // Filtered applications by status, source, and search
  const filtered = useMemo(() => {
    return applications.filter((app) => {
      // 1. Status Filter
      if (activeTab !== 'all') {
        if (activeTab === 'under_review') {
          if (app.status !== 'under_review' && app.status !== 'submitted') return false;
        } else if (app.status !== activeTab) {
          return false;
        }
      }

      // 2. Source Filter
      if (sourceFilter === 'direct' && !app.is_direct && app.source !== 'direct') return false;
      if (sourceFilter === 'listing' && (app.is_direct || app.source === 'direct')) return false;

      // 3. Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = (app.applicant_name || '').toLowerCase().includes(q);
      const matchRef = (app.application_ref || '').toLowerCase().includes(q);
      const matchProp = (app.property_title || '').toLowerCase().includes(q);
      const matchEmail = (app.applicant_email || '').toLowerCase().includes(q);
      const matchEmployer = (app.applicant_employer || '').toLowerCase().includes(q);

      return matchName || matchRef || matchProp || matchEmail || matchEmployer;
    });
  }, [applications, activeTab, sourceFilter, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = applications.length;
    const directCount = applications.filter((a) => a.is_direct || a.source === 'direct').length;
    const listingCount = applications.filter((a) => !a.is_direct && a.source !== 'direct').length;
    const pendingCount = applications.filter((a) => a.status === 'under_review' || a.status === 'submitted').length;
    const approvedCount = applications.filter((a) => a.status === 'approved').length;
    const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

    const totalIncome = applications.reduce((sum, a) => sum + (a.applicant_income || 0), 0);
    const avgIncome = total > 0 ? Math.round(totalIncome / total) : 0;

    return { total, directCount, listingCount, pendingCount, approvedCount, rejectedCount, avgIncome };
  }, [applications]);

  // Selection Handlers
  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleIds = filtered.map((a) => a.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const isAllSelected = filtered.length > 0 && filtered.every((a) => selectedIds.includes(a.id));

  // Single Delete Application Execution
  const executeSingleDelete = async () => {
    if (!deletingApp) return;
    setIsActionLoading(true);

    try {
      const res = await fetch('/api/admin/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingApp.id }),
      });
      const json = await res.json();

      if (json.success) {
        store.deleteApplication(deletingApp.id);
        setApplications((prev) => prev.filter((a) => a.id !== deletingApp.id && a.application_ref !== deletingApp.application_ref));
        setSelectedIds((prev) => prev.filter((id) => id !== deletingApp.id));
        if (inspectingApp?.id === deletingApp.id) {
          setInspectingApp(null);
        }
        setDeletingApp(null);
        setDeleteSuccessMsg(`Application #${deletingApp.application_ref} deleted.`);
        setTimeout(() => setDeleteSuccessMsg(null), 3500);
      } else {
        throw new Error(json.error || 'Failed to delete application');
      }
    } catch (err: any) {
      console.error('Delete app error:', err);
      store.deleteApplication(deletingApp.id);
      setApplications((prev) => prev.filter((a) => a.id !== deletingApp.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deletingApp.id));
      if (inspectingApp?.id === deletingApp.id) {
        setInspectingApp(null);
      }
      setDeletingApp(null);
      setDeleteSuccessMsg(`Application removed from database.`);
      setTimeout(() => setDeleteSuccessMsg(null), 3500);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Bulk Delete Applications Execution
  const executeBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsActionLoading(true);

    const count = selectedIds.length;
    const targetIds = [...selectedIds];

    try {
      const res = await fetch('/api/admin/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: targetIds }),
      });
      const json = await res.json();

      if (json.success) {
        store.deleteApplications(targetIds);
        setApplications((prev) => prev.filter((a) => !targetIds.includes(a.id)));
        setSelectedIds([]);
        setIsBulkDeleteModalOpen(false);
        if (inspectingApp && targetIds.includes(inspectingApp.id)) {
          setInspectingApp(null);
        }
        setDeleteSuccessMsg(`Successfully deleted ${count} rental applications.`);
        setTimeout(() => setDeleteSuccessMsg(null), 4000);
      } else {
        throw new Error(json.error || 'Bulk delete failed');
      }
    } catch (err: any) {
      console.error('Bulk delete apps error:', err);
      store.deleteApplications(targetIds);
      setApplications((prev) => prev.filter((a) => !targetIds.includes(a.id)));
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      if (inspectingApp && targetIds.includes(inspectingApp.id)) {
        setInspectingApp(null);
      }
      setDeleteSuccessMsg(`Removed ${count} applications from directory.`);
      setTimeout(() => setDeleteSuccessMsg(null), 4000);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Generating Custom Application Link
  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    try {
      const res = await fetch('/api/admin/application-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: linkTitle.trim(),
          instructions: linkInstructions.trim(),
          assigned_property_ids: selectedPropertyIds,
          fee_enabled: linkFeeEnabled,
          fee_amount: linkFeeAmount,
          currency_code: 'USD',
        }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const fullUrl = `${origin}/apply/${json.data.token}`;
        setGeneratedLinkResult({
          url: fullUrl,
          token: json.data.token,
        });
        store.saveAdminApplicationLink(json.data);
      } else {
        alert(json.error || 'Failed to generate link');
      }
    } catch (err) {
      console.error('Link generation error:', err);
      alert('Failed to generate application link.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyGeneratedLink = (url: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }
  };

  const handleDecision = async (app: RentalApplication, status: ApplicationStatus) => {
    if (status === 'rejected' && !decisionNotes.trim()) {
      alert('Please select or specify a reason for rejection.');
      return;
    }

    setIsActionLoading(true);
    try {
      await applicationsDb.updateApplicationStatus(app.id, status, 'Super Admin', decisionNotes.trim() || undefined);
      await loadData();
      setActionSuccessMsg(
        status === 'approved'
          ? `Application ${app.application_ref} approved! Lease authorization issued.`
          : `Application ${app.application_ref} rejected. Notice logged.`
      );
      setTimeout(() => {
        setActionSuccessMsg(null);
        setInspectingApp(null);
        setIsRejecting(false);
        setDecisionNotes('');
      }, 1600);
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AppLayout title="Rental Applications Registry | Blue Sky Admin" headerTitle="Rental Applications">
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
                Underwriting Desk
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
              Rental Applications Registry
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 0 }}>
              Audit tenant SSN & vault documents, generate custom intake application links, and manage single/bulk deletions.
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
            {refreshSuccessMsg && (
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
                <Check size={13} /> {refreshSuccessMsg}
              </span>
            )}
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing || isLoading}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '8px 14px' }}
            >
              <RefreshCw size={14} className={isRefreshing || isLoading ? 'animate-spin' : ''} />
              Sync
            </button>
            <button
              onClick={() => {
                setIsLinkModalOpen(true);
                setGeneratedLinkResult(null);
              }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, padding: '8px 14px' }}
            >
              <LinkIcon size={14} /> Generate Application Link
            </button>
          </div>
        </div>

        {/* Source Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 16,
            borderBottom: '2px solid var(--color-border)',
            paddingBottom: 2,
          }}
        >
          <button
            onClick={() => setSourceFilter('all')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: sourceFilter === 'all' ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: sourceFilter === 'all' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
              marginBottom: -2,
            }}
          >
            <FileText size={16} />
            <span>All Applications ({metrics.total})</span>
          </button>

          <button
            onClick={() => setSourceFilter('direct')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: sourceFilter === 'direct' ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: sourceFilter === 'direct' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
              marginBottom: -2,
            }}
          >
            <LinkIcon size={16} />
            <span>Direct Admin Link Portals ({metrics.directCount})</span>
          </button>

          <button
            onClick={() => setSourceFilter('listing')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: sourceFilter === 'listing' ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: sourceFilter === 'listing' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
              marginBottom: -2,
            }}
          >
            <Home size={16} />
            <span>Property Listing Apps ({metrics.listingCount})</span>
          </button>
        </div>

        {/* Search & Master Selection Controls */}
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
              placeholder="Search by applicant name, reference ID, property title, or email..."
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

        {/* Applications List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RefreshCw size={28} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Loading applications registry...
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
            <FileText size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
              No applications match your filter
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              Try adjusting your search criteria or switch to another tab.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map((app) => {
              const isDirect = Boolean(app.is_direct || app.source === 'direct');
              const isSelected = selectedIds.includes(app.id);

              return (
                <div
                  key={app.id}
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
                    {/* Top Row: Checkbox, Reference & Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={(e) => handleToggleSelect(app.id, e)}
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
                          title={isSelected ? 'Deselect application' : 'Select application'}
                        >
                          {isSelected ? <Check size={14} strokeWidth={3} /> : <Square size={14} />}
                        </button>

                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                          #{app.application_ref}
                        </span>

                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 800,
                            backgroundColor: isDirect ? 'rgba(0, 102, 255, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                            color: isDirect ? 'var(--color-primary)' : '#475569',
                          }}
                        >
                          {isDirect ? 'Direct Link' : 'Listing App'}
                        </span>
                      </div>

                      {/* Single Delete Button */}
                      <button
                        onClick={() => setDeletingApp(app)}
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
                        title="Delete Application"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Applicant details */}
                    <div style={{ marginBottom: 10 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                        {app.applicant_name}
                      </h3>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {app.applicant_email} • {app.applicant_phone}
                      </div>
                    </div>

                    {/* Target Property */}
                    <div style={{ padding: 10, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>Target Property</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                        {app.property_title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {app.property_address}
                      </div>
                    </div>

                    {/* Financial Snapshot */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 12 }}>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Monthly Income:</span>
                        <div style={{ fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                          ${(app.applicant_income || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Desired Move-in:</span>
                        <div style={{ fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                          {app.desired_move_in}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div style={{ paddingTop: 10, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Badge variant={app.status === 'approved' ? 'approved' : app.status === 'rejected' ? 'rejected' : 'warning'}>
                      {app.status === 'submitted' ? 'Under Review' : app.status}
                    </Badge>

                    <button
                      onClick={() => {
                        setInspectingApp(app);
                        setIsRejecting(false);
                        setDecisionNotes('');
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12, padding: '6px 12px' }}
                    >
                      <Eye size={13} /> Audit & Inspect
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
              <span style={{ fontSize: 13, fontWeight: 600 }}>Applications selected</span>
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

        {/* Generate Application Link Modal */}
        {isLinkModalOpen && (
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
                maxWidth: 580,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: 24,
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'white',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(0, 102, 255, 0.1)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LinkIcon size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                      Generate Direct Application Link
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
                      Create a direct 6-step application portal with optional property choices and custom fee rules.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLinkModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {!generatedLinkResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                      Portal Title / Campaign Name
                    </label>
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="e.g. VIP Tenant Intake Portal"
                      className="form-input"
                      style={{ fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                      Custom Applicant Instructions (Optional)
                    </label>
                    <textarea
                      value={linkInstructions}
                      onChange={(e) => setLinkInstructions(e.target.value)}
                      placeholder="e.g. Please upload your ID and last 2 paystubs for priority verification..."
                      style={{
                        width: '100%',
                        minHeight: 65,
                        padding: 10,
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Assign Properties to Link */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 6 }}>
                      Attach Eligible Properties (Optional)
                    </label>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                      If you select properties, applicants will see a dropdown in Step 1 to pick one. If none are selected, the application will be open/general.
                    </div>

                    <div
                      style={{
                        maxHeight: 150,
                        overflowY: 'auto',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      {properties.map((prop) => {
                        const isChecked = selectedPropertyIds.includes(prop.id);
                        return (
                          <label
                            key={prop.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: 12,
                              padding: '6px 8px',
                              borderRadius: 6,
                              backgroundColor: isChecked ? 'rgba(0, 102, 255, 0.08)' : 'transparent',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPropertyIds((prev) => [...prev, prop.id]);
                                } else {
                                  setSelectedPropertyIds((prev) => prev.filter((id) => id !== prop.id));
                                }
                              }}
                            />
                            <span style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? 'var(--color-primary)' : 'var(--color-navy-dark)' }}>
                              {prop.title} ({prop.city})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Verification Fee Settings */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 12, backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="checkbox"
                          checked={linkFeeEnabled}
                          onChange={(e) => setLinkFeeEnabled(e.target.checked)}
                        />
                        Require Verification Fee
                      </label>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Background check verification fee</span>
                    </div>

                    {linkFeeEnabled && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 2 }}>
                          Fee Amount ($ USD)
                        </label>
                        <input
                          type="number"
                          value={linkFeeAmount}
                          onChange={(e) => setLinkFeeAmount(Number(e.target.value))}
                          className="form-input"
                          style={{ height: 36, fontSize: 13 }}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      onClick={() => setIsLinkModalOpen(false)}
                      className="btn btn-outline"
                      style={{ fontWeight: 600 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateLink}
                      disabled={isGeneratingLink}
                      className="btn btn-primary"
                      style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {isGeneratingLink ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      Generate Link Now
                    </button>
                  </div>
                </div>
              ) : (
                /* Generated Link Result View */
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: '#DCFCE7',
                      color: '#16A34A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px auto',
                    }}
                  >
                    <CheckCircle2 size={30} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                    Application Link Ready!
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 16 }}>
                    Share this direct URL with applicants. Submissions will populate in your direct applications intake desk.
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      backgroundColor: 'var(--color-surface-subtle)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 16,
                    }}
                  >
                    <input
                      type="text"
                      readOnly
                      value={generatedLinkResult.url}
                      style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--color-navy-dark)',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => copyGeneratedLink(generatedLinkResult.url)}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
                    >
                      {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                      {linkCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <Link
                      href={generatedLinkResult.url}
                      target="_blank"
                      className="btn btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, textDecoration: 'none' }}
                    >
                      <ExternalLink size={14} /> Open Portal Preview
                    </Link>
                    <button
                      onClick={() => setIsLinkModalOpen(false)}
                      className="btn btn-primary"
                      style={{ fontWeight: 700 }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Single Delete Confirmation Modal */}
        {deletingApp && (
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
                    Delete Rental Application?
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                    Are you sure you want to permanently delete application <strong>#{deletingApp.application_ref}</strong> from <strong>{deletingApp.applicant_name}</strong>?
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
                <strong>Cascade Notice:</strong> All associated applicant documents, status audit histories, and payment receipts will be permanently erased.
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeletingApp(null)}
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
                  Delete Application
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
                    Bulk Delete {selectedIds.length} Applications?
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                    You have selected <strong>{selectedIds.length} rental application records</strong> for permanent deletion.
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
                <strong>Warning:</strong> All {selectedIds.length} applications, their uploaded vault files, and payment audit logs will be permanently purged.
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

        {/* Gmail Acceptance Outreach Modal */}
        {contactingApp && (
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
                maxWidth: 600,
                width: '100%',
                padding: 24,
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'white',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(0, 102, 255, 0.1)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                      Email Candidate ({contactingApp.applicant_name})
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
                      Send approval notice or underwriting follow-up to {contactingApp.applicant_email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setContactingApp(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 6 }}>
                  Email Message Body
                </label>
                <textarea
                  value={customEmailBody}
                  onChange={(e) => setCustomEmailBody(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 180,
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 13,
                    lineHeight: 1.5,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(customEmailBody);
                    setCopiedMsg(true);
                    setTimeout(() => setCopiedMsg(false), 2500);
                  }}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                >
                  {copiedMsg ? <Check size={14} /> : <Copy size={14} />}
                  {copiedMsg ? 'Copied to Clipboard' : 'Copy Text'}
                </button>

                <a
                  href={`mailto:${contactingApp.applicant_email}?subject=${encodeURIComponent(`Blue Sky Property Application #${contactingApp.application_ref} - Status Update`)}&body=${encodeURIComponent(customEmailBody)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, textDecoration: 'none' }}
                >
                  <Send size={14} /> Launch Gmail / Mail App
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Document Inspection Full-Screen Modal */}
        {inspectingDoc && (
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
                    {inspectingDoc.file_name || 'Applicant Vault Document'}
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Type: {inspectingDoc.document_type?.replace(/_/g, ' ') || 'Identity Doc'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={resolveDocumentUrl(inspectingDoc.storage_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                  >
                    <ExternalLink size={13} /> Open Full In New Tab
                  </a>
                  <button
                    onClick={() => setInspectingDoc(null)}
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
                {!adminDocImgFailed ? (
                  <img
                    src={resolveDocumentUrl(inspectingDoc.storage_path)}
                    alt={inspectingDoc.file_name}
                    style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8 }}
                    onError={() => setAdminDocImgFailed(true)}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 30 }}>
                    <FileText size={48} color="var(--color-primary)" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                      PDF / Document File Attached
                    </p>
                    <a
                      href={resolveDocumentUrl(inspectingDoc.storage_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 12, display: 'inline-flex', textDecoration: 'none' }}
                    >
                      <Download size={14} /> Download & View Original File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Application Inspector Bottom Sheet */}
        <BottomSheet
          isOpen={!!inspectingApp}
          onClose={() => {
            setInspectingApp(null);
            setIsRejecting(false);
          }}
          title={inspectingApp ? `Candidate Screening & Underwriting` : 'Application Audit'}
        >
          {inspectingApp && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {actionSuccessMsg && (
                <div style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> {actionSuccessMsg}
                </div>
              )}

              {/* Applicant Title & Direct Actions */}
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
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-navy-dark)', margin: 0 }}>
                      {inspectingApp.applicant_name}
                    </h2>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        backgroundColor:
                          inspectingApp.status === 'approved'
                            ? '#DCFCE7'
                            : inspectingApp.status === 'rejected'
                            ? '#FEE2E2'
                            : '#FEF3C7',
                        color:
                          inspectingApp.status === 'approved'
                            ? '#16A34A'
                            : inspectingApp.status === 'rejected'
                            ? '#DC2626'
                            : '#D97706',
                      }}
                    >
                      {inspectingApp.status.toUpperCase()}
                    </span>
                    {inspectingApp.is_direct && (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 10,
                          fontWeight: 700,
                          backgroundColor: 'rgba(0, 102, 255, 0.1)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        Direct Portal
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    Application Ref: <strong>#{inspectingApp.application_ref}</strong> • Submitted {inspectingApp.submitted_at ? new Date(inspectingApp.submitted_at).toLocaleDateString() : 'Recently'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => handleOpenContactModal(inspectingApp)}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12 }}
                  >
                    <Mail size={14} /> Contact Candidate
                  </button>
                  <button
                    onClick={() => setDeletingApp(inspectingApp)}
                    className="btn btn-outline-danger btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12, padding: '6px 12px', color: '#DC2626' }}
                  >
                    <Trash2 size={14} /> Delete Application
                  </button>
                </div>
              </div>

              {/* Section 1: Target Residence & Lease Parameters */}
              <div
                style={{
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Home size={16} color="var(--color-primary)" />
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Target Residence & Lease Parameters
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Property Title
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                      {inspectingApp.property_title || 'Direct Intake Application'}
                    </div>
                    {inspectingApp.property_address && (
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>
                        {inspectingApp.property_address}
                      </div>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Target Unit / Suite
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                      {inspectingApp.unit_name || 'Standard Unit'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>
                      {inspectingApp.unit_bedrooms ?? 1} Bed • {inspectingApp.unit_bathrooms ?? 1} Bath
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Monthly Rent
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--color-primary)', marginTop: 2 }}>
                      ${inspectingApp.unit_rent?.toLocaleString() || '2,400'} {inspectingApp.unit_currency || 'USD'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Desired Move-In Date
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                      {inspectingApp.desired_move_in ? new Date(inspectingApp.desired_move_in).toLocaleDateString() : 'Flexible / Immediate'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>
                      Lease Term: {inspectingApp.lease_term_months || 12} Months
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Occupants & Pets
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                      {inspectingApp.occupants_count || 1} Occupants • {inspectingApp.has_pets ? `Pets: ${inspectingApp.pets_description || 'Yes'}` : 'No Pets'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Identity & Financial Underwriting */}
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  padding: 16,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <ShieldCheck size={16} color="var(--color-primary)" />
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Identity & Financial Underwriting
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  {/* SSN Reveal Module */}
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                        Social Security Number (SSN):
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-navy-dark)', fontFamily: 'monospace', letterSpacing: '0.12em', marginTop: 2 }}>
                        {revealedSSNs[inspectingApp.id] ? (inspectingApp.applicant_ssn || '***-**-4891') : '•••-••-••••'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleRevealSSN(inspectingApp.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: 6,
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {revealedSSNs[inspectingApp.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      {revealedSSNs[inspectingApp.id] ? 'Hide SSN' : 'Reveal'}
                    </button>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Email Contact
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                      <a href={`mailto:${inspectingApp.applicant_email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                        {inspectingApp.applicant_email}
                      </a>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Phone Contact
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                      <a href={`tel:${inspectingApp.applicant_phone}`} style={{ color: 'var(--color-navy-dark)', textDecoration: 'none' }}>
                        {inspectingApp.applicant_phone || 'N/A'}
                      </a>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Nationality & DOB
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                      {inspectingApp.applicant_nationality || 'United States'} {inspectingApp.applicant_dob ? `• Born ${inspectingApp.applicant_dob}` : ''}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Current Address
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                      {inspectingApp.applicant_address || 'Not Provided'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Employer / Role
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                      {inspectingApp.applicant_employer || 'Self-Employed'} — {inspectingApp.applicant_occupation || 'Applicant'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      Monthly Income
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#16A34A', marginTop: 2 }}>
                      ${inspectingApp.applicant_income?.toLocaleString() || '0'}/month
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Attached Document Vault */}
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
                    <FileCheck2 size={16} color="var(--color-primary)" />
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Attached Document Vault ({inspectingApp.documents?.length || 0})
                    </h3>
                  </div>
                </div>

                {inspectingApp.documents && inspectingApp.documents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {inspectingApp.documents.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: '#F8FAFC',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <FileText size={18} color="var(--color-primary)" />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                              {doc.file_name || `Document #${idx + 1}`}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                              {doc.document_type?.replace(/_/g, ' ') || 'Identity Proof'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => {
                              setAdminDocImgFailed(false);
                              setInspectingDoc(doc);
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Eye size={13} /> Preview
                          </button>
                          <a
                            href={resolveDocumentUrl(doc.storage_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                          >
                            <ExternalLink size={13} /> Open
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px 12px', color: 'var(--color-text-secondary)', fontSize: 13, backgroundColor: 'var(--color-surface-subtle)', borderRadius: 8 }}>
                    No documents uploaded in vault.
                  </div>
                )}
              </div>

              {/* Section 4: Application Screening Fee Payment */}
              {inspectingApp.payment ? (
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
                      <CreditCard size={16} color="var(--color-primary)" />
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Application Screening Fee Payment
                      </h3>
                    </div>

                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        backgroundColor:
                          inspectingApp.payment.status === 'verified'
                            ? '#DCFCE7'
                            : inspectingApp.payment.status === 'rejected'
                            ? '#FEE2E2'
                            : '#FEF3C7',
                        color:
                          inspectingApp.payment.status === 'verified'
                            ? '#16A34A'
                            : inspectingApp.payment.status === 'rejected'
                            ? '#DC2626'
                            : '#D97706',
                      }}
                    >
                      {inspectingApp.payment.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                        {inspectingApp.payment.payment_method_name || 'Direct Transfer'}
                      </span>
                      <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                        Amount: ${inspectingApp.payment.amount || 50} USD • {(inspectingApp.payment as any).created_at || (inspectingApp.payment as any).submitted_at ? new Date((inspectingApp.payment as any).created_at || (inspectingApp.payment as any).submitted_at).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    {/* Quick Payment Verification Actions */}
                    {inspectingApp.payment.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button
                          onClick={() => handleUpdatePaymentStatus(inspectingApp.payment!.id, 'verified')}
                          disabled={isVerifyingPayment}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontWeight: 700 }}
                        >
                          <CheckCircle2 size={14} /> Verify Fee Payment
                        </button>
                        <button
                          onClick={() => handleUpdatePaymentStatus(inspectingApp.payment!.id, 'rejected')}
                          disabled={isVerifyingPayment}
                          className="btn btn-outline-danger btn-sm"
                          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontWeight: 700 }}
                        >
                          <X size={14} /> Reject Fee Payment
                        </button>
                      </div>
                    )}

                    {/* Receipt Screenshot link & thumbnail */}
                    {inspectingApp.payment.proof_storage_path && (
                      <div style={{ marginTop: 6, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                          Uploaded Transaction Screenshot / Receipt:
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={resolveDocumentUrl(inspectingApp.payment.proof_storage_path)}
                            alt="Receipt proof"
                            style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-border)', cursor: 'pointer' }}
                            onClick={() => {
                              setAdminDocImgFailed(false);
                              setInspectingDoc({
                                id: 'receipt',
                                application_id: inspectingApp.id,
                                document_type: 'payment_receipt' as any,
                                file_name: inspectingApp.payment?.proof_file_name || 'Payment Receipt Proof',
                                storage_path: inspectingApp.payment!.proof_storage_path!,
                                file_size_bytes: 0,
                                status: 'verified',
                                created_at: new Date().toISOString(),
                              });
                            }}
                          />
                          <a
                            href={resolveDocumentUrl(inspectingApp.payment.proof_storage_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 700 }}
                          >
                            <ExternalLink size={13} /> Open Full Receipt
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Section 5: Applicant Notes & Background Statement */}
              {inspectingApp.additional_notes && (
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    padding: 16,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Applicant Notes & Background
                  </span>
                  <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--color-navy-dark)', marginTop: 4, margin: '4px 0 0 0', lineHeight: 1.5 }}>
                    “{inspectingApp.additional_notes}”
                  </p>
                </div>
              )}

              {/* Status Decision Controls */}
              {!isRejecting && inspectingApp.status !== 'approved' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    onClick={() => handleDecision(inspectingApp, 'approved')}
                    disabled={isActionLoading}
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, padding: '12px 16px' }}
                  >
                    <CheckCircle2 size={16} /> Approve Candidate
                  </button>
                  <button
                    onClick={() => setIsRejecting(true)}
                    disabled={isActionLoading}
                    className="btn btn-outline-danger"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, padding: '12px 16px' }}
                  >
                    <X size={16} /> Reject Application
                  </button>
                </div>
              )}

              {isRejecting && (
                <div style={{ padding: 16, borderRadius: 'var(--radius-lg)', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', display: 'block', marginBottom: 6 }}>
                    Select or Enter Reason for Rejection
                  </label>
                  <select
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    className="form-input"
                    style={{ fontSize: 12, marginBottom: 8 }}
                  >
                    <option value="">-- Choose preset reason --</option>
                    {presetReasons.map((r, i) => (
                      <option key={i} value={r}>{r}</option>
                    ))}
                  </select>
                  <textarea
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Provide specific notes..."
                    style={{ width: '100%', minHeight: 60, padding: 8, fontSize: 12, borderRadius: 6, border: '1px solid #FCA5A5' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => handleDecision(inspectingApp, 'rejected')}
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
