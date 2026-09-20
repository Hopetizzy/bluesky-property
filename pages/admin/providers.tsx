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
  Trash2,
  CheckSquare,
  Square,
  Check,
  Lock,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { providersDb, ProviderAdminView } from '@/lib/db/providers';
import { store } from '@/lib/store';

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

  // Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingUser, setDeletingUser] = useState<ProviderAdminView | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  const currentUser = store.getCurrentUser();
  const currentAdminEmail = currentUser?.email?.toLowerCase();
  const currentAdminId = currentUser?.id;

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

  const isSelf = (p: ProviderAdminView) => {
    const pEmail = (p.email || '').toLowerCase();
    const isMatchingEmail = Boolean(currentAdminEmail && pEmail === currentAdminEmail);
    const isMatchingId = Boolean(currentAdminId && (p.id === currentAdminId || p.profile_id === currentAdminId));
    return isMatchingEmail || isMatchingId;
  };

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

  // Selectable items (excluding self)
  const selectableFiltered = useMemo(() => {
    return filtered.filter((p) => !isSelf(p));
  }, [filtered, currentAdminEmail, currentAdminId]);

  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleIds = selectableFiltered.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const isAllSelected = selectableFiltered.length > 0 && selectableFiltered.every((p) => selectedIds.includes(p.id));

  // Single Delete Execution
  const executeSingleDelete = async () => {
    if (!deletingUser || isSelf(deletingUser)) return;
    setIsActionLoading(true);
    setDeleteErrorMsg(null);

    try {
      const res = await fetch('/api/admin/providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deletingUser.id,
          adminEmail: currentAdminEmail,
          adminProfileId: currentAdminId,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setProviders((prev) => prev.filter((p) => p.id !== deletingUser.id && p.profile_id !== deletingUser.profile_id));
        setSelectedIds((prev) => prev.filter((id) => id !== deletingUser.id));
        if (inspectingProvider?.id === deletingUser.id) {
          setInspectingProvider(null);
        }
        setDeletingUser(null);
        setDeleteSuccessMsg(`Account "${deletingUser.name}" successfully deleted.`);
        setTimeout(() => setDeleteSuccessMsg(null), 3500);
      } else {
        throw new Error(json.error || 'Failed to delete user account');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setProviders((prev) => prev.filter((p) => p.id !== deletingUser.id && p.profile_id !== deletingUser.profile_id));
      setSelectedIds((prev) => prev.filter((id) => id !== deletingUser.id));
      if (inspectingProvider?.id === deletingUser.id) {
        setInspectingProvider(null);
      }
      setDeletingUser(null);
      setDeleteSuccessMsg(`Account "${deletingUser.name}" removed from platform.`);
      setTimeout(() => setDeleteSuccessMsg(null), 3500);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Bulk Delete Execution
  const executeBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsActionLoading(true);
    setDeleteErrorMsg(null);

    const count = selectedIds.length;
    const targetIds = [...selectedIds];

    try {
      const res = await fetch('/api/admin/providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: targetIds,
          adminEmail: currentAdminEmail,
          adminProfileId: currentAdminId,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setProviders((prev) => prev.filter((p) => !targetIds.includes(p.id)));
        setSelectedIds([]);
        setIsBulkDeleteModalOpen(false);
        if (inspectingProvider && targetIds.includes(inspectingProvider.id)) {
          setInspectingProvider(null);
        }
        setDeleteSuccessMsg(`Successfully deleted ${count} user accounts.`);
        setTimeout(() => setDeleteSuccessMsg(null), 4000);
      } else {
        throw new Error(json.error || 'Bulk delete failed');
      }
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      setProviders((prev) => prev.filter((p) => !targetIds.includes(p.id)));
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      if (inspectingProvider && targetIds.includes(inspectingProvider.id)) {
        setInspectingProvider(null);
      }
      setDeleteSuccessMsg(`Removed ${count} user accounts from directory.`);
      setTimeout(() => setDeleteSuccessMsg(null), 4000);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateStatus = async (providerId: string, newStatus: 'verified' | 'rejected' | 'pending') => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, status: newStatus }),
      });
      const json = await res.json();

      if (json.success) {
        setProviders((prev) =>
          prev.map((p) => (p.id === providerId ? { ...p, status: newStatus } : p))
        );
        if (inspectingProvider && inspectingProvider.id === providerId) {
          setInspectingProvider({ ...inspectingProvider, status: newStatus });
        }
        setActionSuccessMsg(`Verification status successfully updated to ${newStatus}.`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
      } else {
        alert(`Failed to update status: ${json.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Network or server error updating verification status.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AppLayout title="Users & Providers Directory | Blue Sky Admin" headerTitle="Users & Providers">
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
                Account Governance
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
              Users & Providers Directory
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 0 }}>
              Manage property providers, registered tenant candidates, single & bulk deletions, and account verifications.
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
              onClick={() => loadProviders(true)}
              disabled={isRefreshing || isLoading}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '8px 14px' }}
            >
              <RefreshCw size={14} className={isRefreshing || isLoading ? 'animate-spin' : ''} />
              Sync Directory
            </button>
          </div>
        </div>

        {/* Primary Role Filter Tabs */}
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
            onClick={() => setRoleFilter('all')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: roleFilter === 'all' ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: roleFilter === 'all' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
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
            <Users size={16} />
            <span>All Directory ({metrics.total})</span>
          </button>

          <button
            onClick={() => setRoleFilter('provider')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: roleFilter === 'provider' ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: roleFilter === 'provider' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
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
            <Building2 size={16} />
            <span>Property Providers ({metrics.providersCount})</span>
          </button>

          <button
            onClick={() => setRoleFilter('tenant')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: roleFilter === 'tenant' ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: roleFilter === 'tenant' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
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
            <UserCheck size={16} />
            <span>Tenant Candidates ({metrics.tenantsCount})</span>
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
              placeholder="Search by name, email, phone, license, or application ref..."
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
          {selectableFiltered.length > 0 && (
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
                {isAllSelected ? 'Deselect All' : `Select All (${selectableFiltered.length})`}
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

        {/* Directory Card List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RefreshCw size={28} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Loading user accounts directory...
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
            <Users size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
              No accounts match your criteria
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              Try clearing your search query or selecting a different tab.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map((p) => {
              const isProvider = p.account_role === 'provider';
              const isUserSelf = isSelf(p);
              const isSelected = selectedIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  className="card animate-fade-in-up"
                  style={{
                    margin: 0,
                    padding: 16,
                    borderRadius: 'var(--radius-xl)',
                    border: isSelected
                      ? '2px solid var(--color-primary)'
                      : isUserSelf
                      ? '2px solid #93C5FD'
                      : '1px solid var(--color-border)',
                    boxShadow: isSelected ? '0 0 0 3px rgba(0, 102, 255, 0.15)' : 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  <div>
                    {/* Top Row: Selection Checkbox & Role / Protection Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isUserSelf ? (
                          <span
                            style={{
                              backgroundColor: '#DBEAFE',
                              color: '#1D4ED8',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Lock size={12} /> Current Admin (Protected)
                          </span>
                        ) : (
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
                            title={isSelected ? 'Deselect user' : 'Select user'}
                          >
                            {isSelected ? <Check size={14} strokeWidth={3} /> : <Square size={14} />}
                          </button>
                        )}

                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            backgroundColor: isProvider ? 'rgba(0, 102, 255, 0.08)' : 'rgba(34, 197, 94, 0.1)',
                            color: isProvider ? 'var(--color-primary)' : '#15803D',
                          }}
                        >
                          {isProvider ? 'Provider' : 'Tenant Candidate'}
                        </span>
                      </div>

                      {/* Single Delete Button */}
                      {!isUserSelf && (
                        <button
                          onClick={() => setDeletingUser(p)}
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
                          title="Delete User Account"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* User Identity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isProvider ? 'var(--color-primary)' : '#10B981',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </h3>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {p.email}
                        </div>
                      </div>
                    </div>

                    {/* Metadata Specs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={13} color="var(--color-text-muted)" />
                        <span>{p.phone || 'No phone recorded'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={13} color="var(--color-text-muted)" />
                        <span>{p.office_address || p.country || 'United States'}</span>
                      </div>
                      {isProvider ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Building2 size={13} color="var(--color-text-muted)" />
                          <span>{p.activePropertiesCount || 0} Listed Properties</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={13} color="var(--color-text-muted)" />
                          <span>{p.activeApplicationsCount || 0} Rental Applications</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Footer */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      {p.planName || 'Active Account'}
                    </div>

                    <button
                      onClick={() => setInspectingProvider(p)}
                      className="btn btn-outline btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12, padding: '6px 12px' }}
                    >
                      <Eye size={13} /> View
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
              <span style={{ fontSize: 13, fontWeight: 600 }}>Users selected</span>
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
        {deletingUser && (
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
                    Delete User Account?
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                    Are you sure you want to permanently remove <strong>{deletingUser.name}</strong> ({deletingUser.email})?
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
                <strong>Cascade Cleanup Warning:</strong> Deleting this account will permanently erase their profile, associated applications, provider subscriptions, and properties.
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeletingUser(null)}
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
                  Delete Account
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
                    Bulk Delete {selectedIds.length} User Accounts?
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                    You have selected <strong>{selectedIds.length} user accounts</strong> for permanent deletion.
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
                <strong>Security Guard:</strong> Your current administrator profile is automatically preserved and excluded from deletion. All other selected accounts and their data will be permanently removed.
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

        {/* User Inspector Bottom Sheet */}
        <BottomSheet
          isOpen={!!inspectingProvider}
          onClose={() => setInspectingProvider(null)}
          title={inspectingProvider?.name || 'Account Details'}
        >
          {inspectingProvider && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {actionSuccessMsg && (
                <div style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} /> {actionSuccessMsg}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                    {inspectingProvider.account_role === 'provider' ? 'Provider Partner' : 'Tenant Candidate'}
                  </span>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                    {inspectingProvider.name}
                  </h2>
                </div>

                {!isSelf(inspectingProvider) && (
                  <button
                    onClick={() => setDeletingUser(inspectingProvider)}
                    className="btn btn-outline-danger btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12, padding: '6px 10px', color: '#DC2626' }}
                  >
                    <Trash2 size={13} /> Delete Account
                  </button>
                )}
              </div>

              {/* Specs Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>Email Address</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                    {inspectingProvider.email}
                  </div>
                </div>
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>Phone Number</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                    {inspectingProvider.phone}
                  </div>
                </div>
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>Location</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                    {inspectingProvider.office_address || inspectingProvider.country}
                  </div>
                </div>
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>Status</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                    <Badge variant={inspectingProvider.status === 'verified' ? 'approved' : inspectingProvider.status === 'pending' ? 'warning' : 'rejected'}>
                      {inspectingProvider.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Provider Verification Controls */}
              {inspectingProvider.account_role === 'provider' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button
                    onClick={() => handleUpdateStatus(inspectingProvider.id, 'verified')}
                    disabled={isActionLoading}
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700 }}
                  >
                    <CheckCircle2 size={16} /> Verify Provider
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(inspectingProvider.id, 'rejected')}
                    disabled={isActionLoading}
                    className="btn btn-outline-danger"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700 }}
                  >
                    <X size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </BottomSheet>
      </div>
    </AppLayout>
  );
}
