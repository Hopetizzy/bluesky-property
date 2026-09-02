import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
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
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { applicationsDb } from '@/lib/db/applications';
import { store } from '@/lib/store';
import { RentalApplication, ApplicationStatus, ApplicationDocument } from '@/lib/types';

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccessMsg, setRefreshSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'under_review' | 'approved' | 'rejected'>('all');
  const [inspectingApp, setInspectingApp] = useState<RentalApplication | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [inspectingDoc, setInspectingDoc] = useState<ApplicationDocument | null>(null);
  const [revealedSSNs, setRevealedSSNs] = useState<Record<string, boolean>>({});

  const toggleRevealSSN = (id: string) => {
    setRevealedSSNs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Gmail Acceptance Outreach Modal State
  const [contactingApp, setContactingApp] = useState<RentalApplication | null>(null);
  const [customEmailBody, setCustomEmailBody] = useState('');
  const [copiedMsg, setCopiedMsg] = useState(false);

  const presetReasons = [
    'Monthly income does not meet minimum 2.5x rent coverage threshold',
    'Unverifiable or incomplete identity documents in applicant vault',
    'Employment and income verification could not be authenticated',
    'Credit history or background screening parameters unmet',
    'Target property unit is no longer available for requested move-in date',
  ];

  const loadApplications = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const list = await applicationsDb.getApplications();
      setApplications(list);
      if (isManualRefresh) {
        setRefreshSuccessMsg(`Synced! ${list.length} rental applications loaded live from database.`);
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
    loadApplications();
  }, []);

  // Filtered applications by tab and search
  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (activeTab !== 'all') {
        if (activeTab === 'under_review') {
          if (app.status !== 'under_review' && app.status !== 'submitted') return false;
        } else if (app.status !== activeTab) {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = (app.applicant_name || '').toLowerCase().includes(q);
      const matchRef = (app.application_ref || '').toLowerCase().includes(q);
      const matchProp = (app.property_title || '').toLowerCase().includes(q);
      const matchEmail = (app.applicant_email || '').toLowerCase().includes(q);
      const matchEmployer = (app.applicant_employer || '').toLowerCase().includes(q);

      return matchName || matchRef || matchProp || matchEmail || matchEmployer;
    });
  }, [applications, activeTab, searchQuery]);

  // Aggregate Underwriting Metrics
  const metrics = useMemo(() => {
    const total = applications.length;
    const pendingCount = applications.filter((a) => a.status === 'under_review' || a.status === 'submitted').length;
    const approvedCount = applications.filter((a) => a.status === 'approved').length;
    const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

    const totalIncome = applications.reduce((sum, a) => sum + (a.applicant_income || 0), 0);
    const avgIncome = total > 0 ? Math.round(totalIncome / total) : 0;

    return { total, pendingCount, approvedCount, rejectedCount, avgIncome };
  }, [applications]);

  const handleDecision = async (app: RentalApplication, status: ApplicationStatus) => {
    if (status === 'rejected' && !decisionNotes.trim()) {
      alert('Please select or specify a reason for rejection.');
      return;
    }

    setIsActionLoading(true);
    try {
      await applicationsDb.updateApplicationStatus(app.id, status, 'Super Admin');
      await loadApplications();
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

  const generateAcceptanceEmail = (app: RentalApplication) => {
    const subject = `Official Rental Acceptance & Lease Agreement - ${app.property_title} (${app.unit_name || 'Unit'}) [Ref: ${app.application_ref}]`;
    const body = `Dear ${app.applicant_name},

Congratulations! We are delighted to inform you that your rental application (Reference: ${app.application_ref}) for the following residence has been officially APPROVED by Blue Sky Property Management:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 PROPERTY & LEASE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Property: ${app.property_title}
• Unit / Residence: ${app.unit_name || 'Main Residence'}
• Address: ${app.property_address || 'Peachtree St NE, Atlanta, GA'}
• Monthly Rent: $${(app.unit_rent || 2500).toLocaleString()} ${app.unit_currency || 'USD'}/month
• Requested Move-In Date: ${app.desired_move_in || 'Immediate'}
• Lease Term: ${app.lease_term_months || 12} Months
• Occupants: ${app.occupants_count || 1} Person(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 NEXT STEPS TO FINALIZE YOUR LEASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Digital Lease Review & Signature:
   Our leasing office will provide your customized Residential Tenancy Agreement. Please review terms and execute digital signatures.

2. Deposit & Initial Reservation Remittance:
   Please coordinate with us regarding the security deposit and first month's rental fee to finalize your unit allocation.

3. Move-In Schedule & Key Handover:
   We will coordinate with the on-site property concierge to schedule your move-in walk-through inspection and key handover.

Should you have any questions or require special move-in assistance, please reply directly to this email or contact our leasing office.

Welcome to Blue Sky!

Warm regards,
Blue Sky Property Management Team
Leasing & Operations Department
Email: leasing@blueskyproperty.com
`;
    return { subject, body };
  };

  const handleOpenContactModal = (app: RentalApplication) => {
    const { body } = generateAcceptanceEmail(app);
    setCustomEmailBody(body);
    setCopiedMsg(false);
    setContactingApp(app);
  };

  const handleOpenGmail = (app: RentalApplication) => {
    const { subject } = generateAcceptanceEmail(app);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(app.applicant_email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(customEmailBody)}`;
    window.open(gmailUrl, '_blank');
  };

  const handleOpenMailto = (app: RentalApplication) => {
    const { subject } = generateAcceptanceEmail(app);
    window.location.href = `mailto:${encodeURIComponent(app.applicant_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(customEmailBody)}`;
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customEmailBody);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const getAffordabilityRatio = (income?: number, rent?: number) => {
    if (!income) return null;
    const estimatedRent = rent || 2500;
    const ratio = (income / estimatedRent).toFixed(1);
    const numRatio = parseFloat(ratio);
    return {
      ratio,
      isHealthy: numRatio >= 2.5,
      label: numRatio >= 2.5 ? `${ratio}x Rent (Healthy Coverage)` : `${ratio}x Rent (Below 2.5x Standard)`,
    };
  };

  const getDocumentTypeLabel = (type?: string) => {
    switch (type) {
      case 'drivers_license':
        return 'Government Photo ID / Passport';
      case 'proof_of_income':
        return 'Proof of Income / Paystub';
      case 'utility_bill_address':
        return 'Proof of Address / Utility';
      case 'bank_statement':
        return 'Bank Account Statement';
      default:
        return 'Supporting Document';
    }
  };

  return (
    <AppLayout title="Rental Applications Console | Blue Sky Operations" headerTitle="Applications Audit">
      <div style={{ padding: '24px 16px 80px 16px', maxWidth: 960, margin: '0 auto' }}>
        
        {/* Header Command Strip */}
        <div className="flex-between" style={{ marginBottom: 24 }}>
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
              title="Return to Operations Command Center"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em', margin: 0 }}>
                  Rental Applications Underwriting
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
                  Candidate Vault
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2, margin: 0 }}>
                Screen prospective tenant candidates, verify income vaults, and execute lease decisions
              </p>
            </div>
          </div>

          <button
            onClick={() => loadApplications(true)}
            disabled={isLoading || isRefreshing}
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
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Syncing...' : 'Refresh Desk'}
          </button>
        </div>

        {/* Sync Success Feedback Banner */}
        {refreshSuccessMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ECFDF5',
              border: '1px solid #86EFAC',
              color: '#065F46',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={16} color="#16A34A" />
            <span>{refreshSuccessMsg}</span>
          </div>
        )}

        {/* Operational Metrics Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {/* Metric 1: Total Applications */}
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
              <span>Total Received</span>
              <FileText size={16} color="var(--color-primary)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em' }}>
              {metrics.total}
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Avg Income: ${metrics.avgIncome.toLocaleString()}/mo
            </span>
          </div>

          {/* Metric 2: Under Review */}
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
              {metrics.pendingCount > 0 ? 'Awaiting underwriting decision' : 'All applications processed'}
            </span>
          </div>

          {/* Metric 3: Approved */}
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
              <span>Approved Leases</span>
              <CheckCircle2 size={16} color="#16A34A" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em' }}>
              {metrics.approvedCount}
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Qualified prospective tenants
            </span>
          </div>

          {/* Metric 4: Rejected */}
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
              <span>Rejected / Closed</span>
              <XCircle size={16} color="#DC2626" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em' }}>
              {metrics.rejectedCount}
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Underwriting declined
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
              placeholder="Search by candidate name, email, ref #, or property..."
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
              { id: 'all', label: 'All', count: applications.length },
              {
                id: 'under_review',
                label: 'In Review',
                count: applications.filter((a) => a.status === 'under_review' || a.status === 'submitted').length,
              },
              { id: 'approved', label: 'Approved', count: applications.filter((a) => a.status === 'approved').length },
              { id: 'rejected', label: 'Rejected', count: applications.filter((a) => a.status === 'rejected').length },
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

        {/* Applications List */}
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px', margin: 0 }}>
            <FileText size={44} color="var(--color-text-muted)" style={{ margin: '0 auto 14px auto' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
              No Rental Applications Found
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 16 }}>
              {searchQuery
                ? `No candidate applications match "${searchQuery}".`
                : 'There are no applications in this status category.'}
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
            {filtered.map((app) => {
              const isPending = app.status === 'under_review' || app.status === 'submitted';
              const isApproved = app.status === 'approved';
              const isRejected = app.status === 'rejected';
              const aff = getAffordabilityRatio(app.applicant_income, app.unit_rent);
              const docCount = (app.documents || []).length;

              return (
                <div
                  key={app.id}
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
                  {/* Top Candidate & Property Strip */}
                  <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: 10 }}>
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
                          <User size={16} />
                        </div>
                        <div>
                          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                            {app.applicant_name}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              backgroundColor: 'var(--color-surface-subtle)',
                              padding: '2px 6px',
                              borderRadius: 4,
                              color: 'var(--color-navy-dark)',
                              marginLeft: 8,
                            }}
                          >
                            {app.application_ref}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 6, fontSize: 12 }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          Target: <strong style={{ color: 'var(--color-navy-dark)' }}>{app.property_title || 'Residence'}</strong>
                        </span>
                        {app.unit_name && (
                          <>
                            <span style={{ color: 'var(--color-text-muted)' }}>•</span>
                            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{app.unit_name}</span>
                          </>
                        )}
                        {app.unit_rent && (
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            (${app.unit_rent.toLocaleString()}/mo)
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant={
                        isApproved
                          ? 'approved'
                          : isRejected
                          ? 'rejected'
                          : 'under_review'
                      }
                    >
                      {app.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  {/* Financial Underwriting Parameters */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 12,
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Employer: </span>
                      <strong style={{ color: 'var(--color-navy-dark)' }}>{app.applicant_employer || 'Not stated'}</strong>
                      {app.applicant_occupation && ` (${app.applicant_occupation})`}
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Income: </span>
                      <strong style={{ color: 'var(--color-success)' }}>
                        ${app.applicant_income?.toLocaleString()}/mo
                      </strong>
                    </div>
                    {aff && (
                      <div>
                        <span style={{ color: 'var(--color-text-muted)' }}>Affordability: </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: aff.isHealthy ? '#16A34A' : '#D97706',
                          }}
                        >
                          {aff.label}
                        </span>
                      </div>
                    )}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontWeight: 600 }}>
                      <FileCheck2 size={14} />
                      <span>{docCount} Vault Document{docCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Bottom Strip: Dates & Action */}
                  <div className="flex-between" style={{ borderTop: '1px solid var(--color-surface-subtle)', paddingTop: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Submitted {new Date(app.submitted_at || Date.now()).toLocaleDateString()}
                      {app.reviewed_at && (
                        <span style={{ color: isApproved ? '#16A34A' : '#DC2626', marginLeft: 6, fontWeight: 600 }}>
                          • {isApproved ? 'Approved' : 'Reviewed'} on {new Date(app.reviewed_at).toLocaleDateString()} by {app.reviewed_by || 'Admin'}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isApproved && (
                        <button
                          type="button"
                          onClick={() => handleOpenContactModal(app)}
                          className="btn btn-outline-primary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 10px', fontWeight: 700 }}
                          title="Contact Tenant on Gmail with Smart Acceptance Message"
                        >
                          <Mail size={13} /> Contact on Gmail
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingApp(app);
                          setIsRejecting(false);
                          setDecisionNotes('');
                          setActionSuccessMsg(null);
                          setInspectingDoc(null);
                        }}
                        className={isPending ? 'btn btn-primary btn-sm' : 'btn btn-outline-secondary btn-sm'}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Eye size={14} /> {isPending ? 'Audit & Underwrite' : 'Inspect Candidate'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comprehensive Candidate Screening & Underwriting Drawer */}
      <BottomSheet
        isOpen={!!inspectingApp}
        onClose={() => {
          setInspectingApp(null);
          setIsRejecting(false);
          setDecisionNotes('');
          setInspectingDoc(null);
        }}
        title="Candidate Screening & Underwriting"
      >
        {inspectingApp && (
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

            {/* Header Status Card */}
            <div className="flex-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  {inspectingApp.applicant_name}
                </h2>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  Application Ref: <strong>{inspectingApp.application_ref}</strong> • Submitted {new Date(inspectingApp.submitted_at || Date.now()).toLocaleDateString()}
                </div>
              </div>
              <Badge
                variant={
                  inspectingApp.status === 'approved'
                    ? 'approved'
                    : inspectingApp.status === 'rejected'
                    ? 'rejected'
                    : 'under_review'
                }
              >
                {inspectingApp.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Approved Candidate Quick Gmail Outreach Banner */}
            {inspectingApp.status === 'approved' && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: '#DBEAFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1E40AF',
                    }}
                  >
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF' }}>
                      Candidate Officially Approved
                    </div>
                    <div style={{ fontSize: 12, color: '#3B82F6', marginTop: 1 }}>
                      Dispatch customized lease acceptance & next steps directly to {inspectingApp.applicant_email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenContactModal(inspectingApp)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                >
                  <Mail size={14} /> Contact Tenant on Gmail
                </button>
              </div>
            )}

            {/* Apartment Photo Banner */}
            {inspectingApp.property_image && (
              <div
                style={{
                  position: 'relative',
                  height: 180,
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                }}
              >
                <img
                  src={inspectingApp.property_image}
                  alt={inspectingApp.property_title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    right: 8,
                    padding: '8px 12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.88)',
                    backdropFilter: 'blur(6px)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'white',
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Home size={14} color="#38BDF8" />
                    <span style={{ fontWeight: 700 }}>{inspectingApp.property_title}</span>
                  </div>
                  <span style={{ color: '#93C5FD', fontWeight: 600 }}>
                    {inspectingApp.unit_bedrooms ?? 2} Bed • {inspectingApp.unit_bathrooms ?? 2} Bath
                  </span>
                </div>
              </div>
            )}

            {/* Target Property & Lease Parameters */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-subtle)',
                padding: 14,
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Home size={15} color="var(--color-primary)" />
                Target Residence & Lease Parameters
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Property Title:</span>
                <strong style={{ color: 'var(--color-navy-dark)' }}>{inspectingApp.property_title}</strong>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Target Unit / Suite:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                  {inspectingApp.unit_name || 'Primary Residence Layout'}
                </span>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Monthly Rent:</span>
                <strong style={{ color: 'var(--color-navy-dark)' }}>
                  ${(inspectingApp.unit_rent || 2500).toLocaleString()} {inspectingApp.unit_currency || 'USD'}
                </strong>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Desired Move-In Date:</span>
                <span>{inspectingApp.lease_term_months || 12} Months</span>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Occupants & Pets:</span>
                <span>{inspectingApp.occupants_count || 1} Occupants • {inspectingApp.has_pets ? 'Pets Declared' : 'No Pets'}</span>
              </div>
            </div>

            {/* Identity & Employment Truth */}
            <div
              style={{
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                padding: 14,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Briefcase size={15} color="var(--color-primary)" />
                Identity & Financial Underwriting
              </div>

              {/* Secure Social Security Number Verification Field */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} color="#16A34A" />
                  <span style={{ color: 'var(--color-navy-dark)', fontWeight: 700 }}>
                    Social Security Number (SSN):
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 14,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      color: revealedSSNs[inspectingApp.id] ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      backgroundColor: 'white',
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: '1px solid #CBD5E1',
                    }}
                  >
                    {revealedSSNs[inspectingApp.id] ? (inspectingApp.applicant_ssn || '•••-••-4891') : '•••-••-••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleRevealSSN(inspectingApp.id)}
                    className="btn btn-outline-secondary btn-sm"
                    style={{ padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                    title={revealedSSNs[inspectingApp.id] ? 'Mask SSN' : 'Reveal SSN for Credit & Background Check'}
                  >
                    {revealedSSNs[inspectingApp.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                    {revealedSSNs[inspectingApp.id] ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>

              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Email Contact:</span>
                <a href={`mailto:${inspectingApp.applicant_email}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  {inspectingApp.applicant_email}
                </a>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Phone Contact:</span>
                <a href={`tel:${inspectingApp.applicant_phone}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  {inspectingApp.applicant_phone}
                </a>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Current Address:</span>
                <span style={{ textAlign: 'right', maxWidth: 280 }}>{inspectingApp.applicant_address || 'Not stated'}</span>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Employer / Role:</span>
                <strong style={{ color: 'var(--color-navy-dark)' }}>
                  {inspectingApp.applicant_employer || 'Not specified'} — {inspectingApp.applicant_occupation || 'Professional'}
                </strong>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Monthly Income:</span>
                <strong style={{ fontSize: 15, color: 'var(--color-success)' }}>
                  ${inspectingApp.applicant_income?.toLocaleString()}/month
                </strong>
              </div>
            </div>

            {/* Attached Document Vault */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} color="var(--color-primary)" />
                Attached Document Vault ({(inspectingApp.documents || []).length})
              </div>

              {(inspectingApp.documents || []).length === 0 ? (
                <div
                  style={{
                    padding: 12,
                    backgroundColor: 'var(--color-surface-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    textAlign: 'center',
                  }}
                >
                  No documents uploaded in vault.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(inspectingApp.documents || []).map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-surface-subtle)',
                        border: '1px solid var(--color-border)',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileCheck2 size={16} color="var(--color-primary)" />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                            {getDocumentTypeLabel(doc.document_type)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                            {doc.file_name}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: doc.status === 'verified' ? '#16A34A' : '#D97706',
                          }}
                        >
                          {doc.status === 'verified' ? 'Verified Vault' : 'Pending Check'}
                        </span>
                        {doc.storage_path && (
                          <button
                            type="button"
                            onClick={() => setInspectingDoc(inspectingDoc?.id === doc.id ? null : doc)}
                            className="btn btn-outline-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                          >
                            {inspectingDoc?.id === doc.id ? 'Close' : 'View'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Document Image Zoom Box */}
              {inspectingDoc && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#0F172A',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: 6, color: 'white', fontSize: 12 }}>
                    <span>Preview: {getDocumentTypeLabel(inspectingDoc.document_type)}</span>
                    <a
                      href={inspectingDoc.storage_path}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#93C5FD', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                    >
                      <ExternalLink size={12} /> Open Full Document
                    </a>
                  </div>
                  <div style={{ height: 240, overflow: 'hidden', borderRadius: 6 }}>
                    <img
                      src={inspectingDoc.storage_path}
                      alt="Vault Document"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Applicant Statement */}
            {inspectingApp.additional_notes && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 4 }}>
                  Applicant Notes & Background
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  &ldquo;{inspectingApp.additional_notes}&rdquo;
                </p>
              </div>
            )}

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
                  <AlertTriangle size={16} /> Specify Application Rejection Reason
                </div>

                {/* Preset Quick Selectors */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#7F1D1D' }}>
                    Select Standard Underwriting Reason:
                  </span>
                  {presetReasons.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDecisionNotes(preset)}
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: decisionNotes === preset ? '1px solid #DC2626' : '1px solid #FCA5A5',
                        backgroundColor: decisionNotes === preset ? '#FEE2E2' : 'white',
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
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Or enter custom feedback explaining why candidate application was rejected..."
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

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(inspectingApp, 'rejected')}
                    disabled={isActionLoading}
                    className="btn btn-danger btn-sm"
                  >
                    {isActionLoading ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}

            {/* Decision Actions */}
            {!isRejecting && (
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {inspectingApp.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleDecision(inspectingApp, 'approved')}
                    disabled={isActionLoading}
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <CheckCircle2 size={16} /> {isActionLoading ? 'Authorizing Lease...' : 'Approve Candidate'}
                  </button>
                )}

                {inspectingApp.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    className="btn btn-outline-danger"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <X size={16} /> Reject Application
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Smart Gmail Acceptance Outreach Modal */}
      <BottomSheet
        isOpen={!!contactingApp}
        onClose={() => setContactingApp(null)}
        title="Tenant Acceptance Outreach • Gmail Dispatcher"
      >
        {contactingApp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--color-border)',
                fontSize: 12,
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>To Candidate: </span>
                <strong style={{ color: 'var(--color-navy-dark)' }}>{contactingApp.applicant_name}</strong> &lt;{contactingApp.applicant_email}&gt;
              </div>
              <Badge variant="approved">APPROVED TENANT</Badge>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                Subject Line
              </label>
              <input
                type="text"
                readOnly
                value={generateAcceptanceEmail(contactingApp).subject}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: '#F8FAFC',
                  color: 'var(--color-navy-dark)',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <div className="flex-between" style={{ marginBottom: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                  Smart Pre-Crafted Acceptance Letter
                </label>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  You can edit message contents before launching Gmail
                </span>
              </div>
              <textarea
                value={customEmailBody}
                onChange={(e) => setCustomEmailBody(e.target.value)}
                rows={12}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  lineHeight: 1.5,
                  outline: 'none',
                  backgroundColor: 'white',
                  color: 'var(--color-navy-dark)',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="btn btn-outline-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
              >
                {copiedMsg ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                {copiedMsg ? 'Message Copied!' : 'Copy Letter to Clipboard'}
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleOpenMailto(contactingApp)}
                  className="btn btn-outline-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                >
                  <Send size={14} /> Default Mail Client
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenGmail(contactingApp)}
                  className="btn btn-primary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 700,
                    backgroundColor: '#EA4335',
                    borderColor: '#EA4335',
                    color: 'white',
                  }}
                >
                  <Mail size={14} /> Launch in Gmail
                </button>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </AppLayout>
  );
}
