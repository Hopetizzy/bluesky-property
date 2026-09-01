import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Users,
  Building,
  Clock,
  ShieldCheck,
  Mail,
  Phone,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Building2,
  Calendar,
  X,
  MapPin,
  TrendingUp,
  XCircle,
  FileText,
  AlertTriangle,
  User,
  UserCheck,
  Briefcase,
  FileCheck2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { providersDb, ProviderAdminView } from '@/lib/db/providers';

export default function AdminProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderAdminView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccessMsg, setRefreshSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Primary Account Role Filter ('all' | 'provider' | 'tenant')
  const [roleFilter, setRoleFilter] = useState<'all' | 'provider' | 'tenant'>('all');
  
  // Secondary Status Filter
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all');
  
  const [inspectingProvider, setInspectingProvider] = useState<ProviderAdminView | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadProviders = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const list = await providersDb.getProvidersForAdmin();
      setProviders(list);
      if (isManual) {
        setRefreshSuccessMsg(`Directory synced! ${list.length} accounts loaded live.`);
        setTimeout(() => setRefreshSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.error('Error loading providers:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  // Filtered accounts by role, status, and search query
  const filtered = useMemo(() => {
    return providers.filter((p) => {
      // 1. Role Filter
      if (roleFilter !== 'all') {
        if (p.account_role !== roleFilter) return false;
      }

      // 2. Status Tab Filter
      if (activeTab === 'active') {
        if (p.account_role === 'provider' && p.daysLeft === 0) return false;
        if (p.account_role === 'tenant' && (p.activeApplicationsCount || 0) === 0 && p.status !== 'verified') return false;
      }
      if (activeTab === 'pending') {
        if (p.account_role === 'provider' && p.daysLeft > 0 && p.status === 'verified') return false;
        if (p.account_role === 'tenant' && p.status === 'verified') return false;
      }

      // 3. Search Query Match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (p.name || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const license = (p.license || '').toLowerCase();
      const country = (p.country || '').toLowerCase();
      const address = (p.office_address || '').toLowerCase();
      const type = (p.type || '').toLowerCase();
      const appRef = (p.latestApplicationRef || '').toLowerCase();

      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        license.includes(q) ||
        country.includes(q) ||
        address.includes(q) ||
        type.includes(q) ||
        appRef.includes(q)
      );
    });
  }, [providers, roleFilter, activeTab, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = providers.length;
    const providersList = providers.filter((p) => p.account_role === 'provider');
    const tenantsList = providers.filter((p) => p.account_role === 'tenant');

    const providersCount = providersList.length;
    const tenantsCount = tenantsList.length;

    const activeSubscriptions = providersList.filter((p) => p.daysLeft > 0).length;
    const pendingVerification = providersList.filter((p) => p.status === 'pending').length;
    const totalProperties = providersList.reduce((sum, p) => sum + (p.activePropertiesCount || 0), 0);

    const withApplicationsCount = tenantsList.filter((t) => (t.activeApplicationsCount || 0) > 0).length;
    const totalApplications = tenantsList.reduce((sum, t) => sum + (t.activeApplicationsCount || 0), 0);

    return {
      total,
      providersCount,
      tenantsCount,
      activeSubscriptions,
      pendingVerification,
      totalProperties,
      withApplicationsCount,
      totalApplications,
    };
  }, [providers]);

  const handleToggleVerification = async (p: ProviderAdminView) => {
    const newStatus = p.status === 'verified' ? 'pending' : 'verified';
    setIsActionLoading(true);
    try {
      await providersDb.updateProviderVerification(p.id, newStatus);
      setProviders((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, status: newStatus } : item))
      );

      if (inspectingProvider && inspectingProvider.id === p.id) {
        setInspectingProvider({ ...inspectingProvider, status: newStatus });
      }

      setActionSuccessMsg(
        newStatus === 'verified'
          ? `Verified status granted to ${p.name}!`
          : `Verification badge revoked for ${p.name}.`
      );
      setTimeout(() => setActionSuccessMsg(null), 2000);
    } catch (err) {
      console.error('Error toggling verification:', err);
      alert('Failed to update account status.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatAccountType = (type?: string, role?: string) => {
    if (role === 'tenant') return 'Prospective Tenant';
    switch (type) {
      case 'brokerage':
        return 'Licensed Brokerage';
      case 'agent':
        return 'Real Estate Agent';
      case 'property_manager':
        return 'Property Manager';
      case 'owner':
        return 'Direct Owner';
      default:
        return 'Property Provider';
    }
  };

  return (
    <AppLayout title="Directory & Accounts Console | Blue Sky Operations" headerTitle="Directory & Users">
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
                  Directory & Account Management
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
                  Providers & Tenants Hub
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2, margin: 0 }}>
                Audit provider partner credentials, listing subscriptions, and registered tenant candidate profiles
              </p>
            </div>
          </div>

          <button
            onClick={() => loadProviders(true)}
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
            {isRefreshing ? 'Syncing...' : 'Refresh Directory'}
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
          {/* Metric 1: Total Directory Accounts */}
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
              <span>Total Accounts</span>
              <Users size={16} color="var(--color-primary)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em' }}>
              {metrics.total}
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {metrics.providersCount} Providers • {metrics.tenantsCount} Tenants
            </span>
          </div>

          {/* Metric 2: Providers with Active Subscriptions */}
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
              <span>Active Providers</span>
              <Building2 size={16} color="#16A34A" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', letterSpacing: '-0.02em' }}>
              {metrics.activeSubscriptions}
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {metrics.totalProperties} Listed Properties
            </span>
          </div>

          {/* Metric 3: Registered Tenants & Applicants */}
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
              <span>Tenant Candidates</span>
              <UserCheck size={16} color="var(--color-accent-blue)" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em' }}>
              {metrics.tenantsCount}
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {metrics.withApplicationsCount} Active Applicants ({metrics.totalApplications} Submissions)
            </span>
          </div>

          {/* Metric 4: Compliance Review */}
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
              <span>Pending Review</span>
              <AlertCircle size={16} color={metrics.pendingVerification > 0 ? '#D97706' : 'var(--color-text-muted)'} />
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: metrics.pendingVerification > 0 ? '#D97706' : 'var(--color-navy-dark)',
                letterSpacing: '-0.02em',
              }}
            >
              {metrics.pendingVerification}
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Providers awaiting license verification
            </span>
          </div>
        </div>

        {/* PRIMARY ROLE SEGMENTED CONTROLLER */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F1F5F9',
            padding: 4,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            marginBottom: 16,
            gap: 4,
          }}
        >
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: roleFilter === 'all' ? 'white' : 'transparent',
              color: roleFilter === 'all' ? 'var(--color-navy-dark)' : 'var(--color-text-secondary)',
              fontWeight: roleFilter === 'all' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: roleFilter === 'all' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={16} color={roleFilter === 'all' ? 'var(--color-primary)' : 'currentColor'} />
            <span>All Directory Accounts</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 12,
                backgroundColor: roleFilter === 'all' ? '#EFF6FF' : 'rgba(0,0,0,0.06)',
                color: roleFilter === 'all' ? '#1E40AF' : 'inherit',
              }}
            >
              {metrics.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('provider')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: roleFilter === 'provider' ? 'white' : 'transparent',
              color: roleFilter === 'provider' ? 'var(--color-navy-dark)' : 'var(--color-text-secondary)',
              fontWeight: roleFilter === 'provider' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: roleFilter === 'provider' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={16} color={roleFilter === 'provider' ? '#16A34A' : 'currentColor'} />
            <span>Providers & Landlords</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 12,
                backgroundColor: roleFilter === 'provider' ? '#DCFCE7' : 'rgba(0,0,0,0.06)',
                color: roleFilter === 'provider' ? '#166534' : 'inherit',
              }}
            >
              {metrics.providersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('tenant')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: roleFilter === 'tenant' ? 'white' : 'transparent',
              color: roleFilter === 'tenant' ? 'var(--color-navy-dark)' : 'var(--color-text-secondary)',
              fontWeight: roleFilter === 'tenant' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: roleFilter === 'tenant' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <User size={16} color={roleFilter === 'tenant' ? 'var(--color-accent-blue)' : 'currentColor'} />
            <span>Tenants & Applicants</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 12,
                backgroundColor: roleFilter === 'tenant' ? '#EFF6FF' : 'rgba(0,0,0,0.06)',
                color: roleFilter === 'tenant' ? '#1E40AF' : 'inherit',
              }}
            >
              {metrics.tenantsCount}
            </span>
          </button>
        </div>

        {/* Search and Secondary Status Filters Strip */}
        <div
          className="flex-between"
          style={{
            marginBottom: 16,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Search Box */}
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
              placeholder={
                roleFilter === 'provider'
                  ? 'Search providers by name, email, license, country...'
                  : roleFilter === 'tenant'
                  ? 'Search tenants by name, email, phone, application ref...'
                  : 'Search providers and tenants by name, email, license...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Secondary Status Filter Tabs */}
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
              { id: 'all', label: 'All Statuses' },
              { id: 'active', label: roleFilter === 'provider' ? 'Active Access' : 'Active / Verified' },
              { id: 'pending', label: 'Pending Verification' },
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
                </button>
              );
            })}
          </div>
        </div>

        {/* Unified Accounts List */}
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px', margin: 0 }}>
            <Users size={44} color="var(--color-text-muted)" style={{ margin: '0 auto 14px auto' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
              No Accounts Found
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 16 }}>
              {searchQuery
                ? `No directory accounts match "${searchQuery}".`
                : `There are no accounts matching the selected filter.`}
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
              const isProvider = p.account_role === 'provider';
              const isVerified = p.status === 'verified';
              const hasActivePlan = p.daysLeft > 0;

              return (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    margin: 0,
                    padding: 16,
                    backgroundColor: 'var(--color-white)',
                    border: isProvider
                      ? '1px solid var(--color-border)'
                      : '1px solid #BFDBFE',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Top Header Strip */}
                  <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isProvider ? '#EFF6FF' : '#F0FDF4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isProvider ? 'var(--color-primary)' : '#16A34A',
                          }}
                        >
                          {isProvider ? <Building2 size={16} /> : <User size={16} />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                              {p.name}
                            </span>
                            {isVerified && (
                              <span title="Verified License / Identity" style={{ display: 'inline-flex' }}>
                                <ShieldCheck size={16} color="#16A34A" />
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                padding: '2px 6px',
                                borderRadius: 4,
                                backgroundColor: isProvider ? '#F1F5F9' : '#EFF6FF',
                                color: isProvider ? 'var(--color-navy-dark)' : '#1E40AF',
                                border: isProvider ? '1px solid #E2E8F0' : '1px solid #DBEAFE',
                              }}
                            >
                              {isProvider ? 'PROVIDER' : 'TENANT CANDIDATE'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            {formatAccountType(p.type, p.account_role)} • {p.country || 'USA'}
                            {p.office_address && ` • ${p.office_address}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isProvider ? (
                        <Badge variant={hasActivePlan ? 'active' : 'expired'}>
                          {hasActivePlan ? `${p.daysLeft} Days Access` : 'Access Expired'}
                        </Badge>
                      ) : (
                        <Badge variant={(p.activeApplicationsCount || 0) > 0 ? 'approved' : 'default'}>
                          {(p.activeApplicationsCount || 0) > 0
                            ? `${p.activeApplicationsCount} Application${p.activeApplicationsCount !== 1 ? 's' : ''}`
                            : 'Registered'}
                        </Badge>
                      )}
                      <Badge variant={isVerified ? 'verified' : 'pending'}>
                        {isVerified ? 'VERIFIED' : 'PENDING'}
                      </Badge>
                    </div>
                  </div>

                  {/* Core Metrics & Contact Strip */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 16,
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-navy-dark)' }}>
                      <Mail size={13} color="var(--color-text-muted)" />
                      <a href={`mailto:${p.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                        {p.email}
                      </a>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-navy-dark)' }}>
                      <Phone size={13} color="var(--color-text-muted)" />
                      <span>{p.phone || 'No phone'}</span>
                    </div>

                    {isProvider ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Shield size={13} color="var(--color-text-muted)" />
                          <span>License: <strong>{p.license}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', fontWeight: 700, color: 'var(--color-primary)' }}>
                          <Building size={13} />
                          <span>{p.activePropertiesCount} Active Propert{p.activePropertiesCount === 1 ? 'y' : 'ies'}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        {p.latestApplicationRef && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FileText size={13} color="var(--color-primary)" />
                            <span>Latest Application: <strong style={{ color: 'var(--color-primary)' }}>{p.latestApplicationRef}</strong></span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', fontWeight: 700, color: '#16A34A' }}>
                          <FileCheck2 size={13} />
                          <span>{p.planName}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions Strip */}
                  <div className="flex-between" style={{ borderTop: '1px solid var(--color-surface-subtle)', paddingTop: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {isProvider ? (
                        <span>Current Tier: <strong style={{ color: 'var(--color-navy-dark)' }}>{p.planName}</strong></span>
                      ) : (
                        <span>Account Role: <strong style={{ color: 'var(--color-navy-dark)' }}>Tenant / Applicant</strong></span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {!isProvider && (p.activeApplicationsCount || 0) > 0 && (
                        <Link
                          href={`/admin/applications?q=${encodeURIComponent(p.email)}`}
                          className="btn btn-outline-primary btn-sm"
                          style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <FileText size={12} /> View Applications
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setInspectingProvider(p);
                          setActionSuccessMsg(null);
                        }}
                        className="btn btn-outline-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Eye size={13} /> Inspect Profile
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comprehensive Account Inspection & Compliance Sheet */}
      <BottomSheet
        isOpen={!!inspectingProvider}
        onClose={() => setInspectingProvider(null)}
        title={inspectingProvider?.account_role === 'provider' ? 'Provider Organization Audit' : 'Tenant Candidate Audit'}
      >
        {inspectingProvider && (
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

            {/* Header Profile Strip */}
            <div className="flex-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  {inspectingProvider.name}
                </h2>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {formatAccountType(inspectingProvider.type, inspectingProvider.account_role)} • {inspectingProvider.country}
                </div>
              </div>
              <Badge variant={inspectingProvider.status === 'verified' ? 'verified' : 'pending'}>
                {inspectingProvider.status.toUpperCase()}
              </Badge>
            </div>

            {/* Detailed Parameters */}
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
              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Account Classification:</span>
                <strong style={{ color: 'var(--color-navy-dark)' }}>
                  {inspectingProvider.account_role === 'provider' ? 'Property Provider / Landlord' : 'Tenant / Rental Applicant'}
                </strong>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Contact Email:</span>
                <a href={`mailto:${inspectingProvider.email}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  {inspectingProvider.email}
                </a>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Contact Telephone:</span>
                <a href={`tel:${inspectingProvider.phone}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  {inspectingProvider.phone}
                </a>
              </div>

              {inspectingProvider.account_role === 'provider' ? (
                <>
                  <div className="flex-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Professional License:</span>
                    <strong style={{ color: 'var(--color-navy-dark)' }}>{inspectingProvider.license}</strong>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Active Subscription Tier:</span>
                    <span style={{ fontWeight: 700, color: inspectingProvider.daysLeft > 0 ? '#16A34A' : '#DC2626' }}>
                      {inspectingProvider.planName}
                    </span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Days Remaining:</span>
                    <span style={{ fontWeight: 700, color: inspectingProvider.daysLeft > 0 ? 'var(--color-navy-dark)' : '#DC2626' }}>
                      {inspectingProvider.daysLeft} Days
                    </span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Active Listed Properties:</span>
                    <strong style={{ color: 'var(--color-primary)' }}>
                      {inspectingProvider.activePropertiesCount} Properties
                    </strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Submitted Applications:</span>
                    <strong style={{ color: 'var(--color-primary)' }}>
                      {inspectingProvider.activeApplicationsCount || 0} Rental Applications
                    </strong>
                  </div>
                  {inspectingProvider.latestApplicationRef && (
                    <div className="flex-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Latest Application Ref:</span>
                      <strong style={{ color: 'var(--color-navy-dark)' }}>
                        {inspectingProvider.latestApplicationRef}
                      </strong>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {inspectingProvider.account_role === 'provider' ? (
                <button
                  type="button"
                  onClick={() => handleToggleVerification(inspectingProvider)}
                  disabled={isActionLoading}
                  className={inspectingProvider.status === 'verified' ? 'btn btn-outline-danger' : 'btn btn-primary'}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <ShieldCheck size={16} />
                  {inspectingProvider.status === 'verified' ? 'Revoke Verified Status' : 'Grant Verified License Status'}
                </button>
              ) : (
                <a
                  href={`mailto:${inspectingProvider.email}?subject=Blue%20Sky%20Property%20Management%20Inquiry`}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
                >
                  <Mail size={16} /> Direct Email Tenant
                </a>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </AppLayout>
  );
}
