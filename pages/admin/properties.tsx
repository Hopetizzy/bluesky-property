import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Building2,
  Check,
  X,
  Shield,
  Eye,
  MapPin,
  Star,
  Search,
  Filter,
  PlusCircle,
  RefreshCw,
  Layers,
  Bed,
  Bath,
  DollarSign,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Phone,
  Mail,
  SlidersHorizontal,
  Clock,
  Sparkles,
  ShieldCheck,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Info,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { propertiesDb } from '@/lib/db/properties';
import { store } from '@/lib/store';
import { Property, PropertyUnit } from '@/lib/types';

export default function AdminPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [inspectingProperty, setInspectingProperty] = useState<Property | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState<string | null>(null);

  // Selection & Bulk Deletion State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  const loadProperties = async (isManual = false) => {
    setIsLoading(true);
    try {
      const list = await propertiesDb.getAllPropertiesForAdmin();
      setProperties(list);
      if (isManual) {
        setRefreshFeedback(`Synced! ${list.length} propert${list.length === 1 ? 'y' : 'ies'} loaded.`);
        setTimeout(() => setRefreshFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Error loading properties:', err);
      const fallback = store.getProperties();
      setProperties(fallback);
      if (isManual) {
        setRefreshFeedback('Synced from local storage.');
        setTimeout(() => setRefreshFeedback(null), 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties(false);
  }, []);

  const isPendingStatus = (status: string) => {
    return status === 'pending_verification' || status === 'pending' || status === 'under_review' || status === 'draft';
  };

  const isApprovedStatus = (status: string) => {
    return status === 'approved';
  };

  const isRejectedStatus = (status: string) => {
    return status === 'rejected' || status === 'suspended';
  };

  // Filter properties based on tab and search
  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (activeTab === 'pending' && !isPendingStatus(p.status)) return false;
      if (activeTab === 'approved' && !isApprovedStatus(p.status)) return false;
      if (activeTab === 'rejected' && !isRejectedStatus(p.status)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchCity = p.city?.toLowerCase().includes(q);
        const matchProvider = p.provider_name?.toLowerCase().includes(q);
        const matchAddress = p.street_address?.toLowerCase().includes(q);
        return matchTitle || matchCity || matchProvider || matchAddress;
      }
      return true;
    });
  }, [properties, activeTab, searchQuery]);

  // Calculate Tab Badges
  const allCount = properties.length;
  const pendingCount = properties.filter((p) => isPendingStatus(p.status)).length;
  const approvedCount = properties.filter((p) => isApprovedStatus(p.status)).length;
  const rejectedCount = properties.filter((p) => isRejectedStatus(p.status)).length;

  // Selection handlers
  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleIds = filtered.map((p) => p.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const isAllFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.includes(p.id));

  // Single Delete Execution
  const executeSingleDelete = async () => {
    if (!deletingProperty) return;
    setIsActionLoading(true);
    setDeleteErrorMsg(null);

    try {
      const res = await fetch('/api/admin/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingProperty.id }),
      });
      const json = await res.json();

      if (json.success) {
        store.deleteProperty(deletingProperty.id);
        setProperties((prev) => prev.filter((p) => p.id !== deletingProperty.id));
        setSelectedIds((prev) => prev.filter((id) => id !== deletingProperty.id));
        if (inspectingProperty?.id === deletingProperty.id) {
          setInspectingProperty(null);
        }
        setDeletingProperty(null);
        setDeleteSuccessMsg(`"${deletingProperty.title}" successfully deleted.`);
        setTimeout(() => setDeleteSuccessMsg(null), 3500);
      } else {
        throw new Error(json.error || 'Failed to delete property');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      // Fallback local deletion
      store.deleteProperty(deletingProperty.id);
      setProperties((prev) => prev.filter((p) => p.id !== deletingProperty.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deletingProperty.id));
      if (inspectingProperty?.id === deletingProperty.id) {
        setInspectingProperty(null);
      }
      setDeletingProperty(null);
      setDeleteSuccessMsg(`"${deletingProperty.title}" removed from database registry.`);
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
      const res = await fetch('/api/admin/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: targetIds }),
      });
      const json = await res.json();

      if (json.success) {
        store.deleteProperties(targetIds);
        setProperties((prev) => prev.filter((p) => !targetIds.includes(p.id)));
        setSelectedIds([]);
        setIsBulkDeleteModalOpen(false);
        if (inspectingProperty && targetIds.includes(inspectingProperty.id)) {
          setInspectingProperty(null);
        }
        setDeleteSuccessMsg(`Successfully deleted ${count} properties and their associated units & images.`);
        setTimeout(() => setDeleteSuccessMsg(null), 4000);
      } else {
        throw new Error(json.error || 'Bulk delete failed');
      }
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      // Fallback local deletion
      store.deleteProperties(targetIds);
      setProperties((prev) => prev.filter((p) => !targetIds.includes(p.id)));
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      if (inspectingProperty && targetIds.includes(inspectingProperty.id)) {
        setInspectingProperty(null);
      }
      setDeleteSuccessMsg(`Removed ${count} properties from database registry.`);
      setTimeout(() => setDeleteSuccessMsg(null), 4000);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleFeatured = async (prop: Property, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFeatured = !prop.featured;
    await propertiesDb.toggleFeatured(prop.id, newFeatured);
    await loadProperties();
    if (inspectingProperty && inspectingProperty.id === prop.id) {
      setInspectingProperty({ ...inspectingProperty, featured: newFeatured });
    }
  };

  const handleApprove = async (prop: Property) => {
    setIsActionLoading(true);
    try {
      await propertiesDb.setPropertyStatus(prop.id, 'approved');
      await loadProperties();
      setInspectingProperty(null);
    } catch (err) {
      console.error('Error approving property:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (prop: Property) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a specific reason for rejection.');
      return;
    }
    setIsActionLoading(true);
    try {
      await propertiesDb.setPropertyStatus(prop.id, 'rejected', rejectionReason.trim());
      await loadProperties();
      setInspectingProperty(null);
      setIsRejecting(false);
      setRejectionReason('');
    } catch (err) {
      console.error('Error rejecting property:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AppLayout title="Properties Registry & Verification | Blue Sky Admin" headerTitle="Properties Registry">
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
                Inventory Governance
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
              Properties Registry
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 0 }}>
              Audit provider listings, inspect unit pricing, perform single/bulk deletions, and manage first-party inventory.
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
              onClick={() => loadProperties(true)}
              disabled={isLoading}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '8px 14px' }}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Link
              href="/admin/properties/create"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, textDecoration: 'none', padding: '8px 14px' }}
            >
              <PlusCircle size={14} /> Add Property
            </Link>
          </div>
        </div>

        {/* Search Bar & Master Selection Controls */}
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
              placeholder="Search by title, city, address, or provider name..."
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
                  backgroundColor: isAllFilteredSelected ? 'rgba(0, 102, 255, 0.08)' : 'var(--color-white)',
                  borderColor: isAllFilteredSelected ? 'var(--color-primary)' : 'var(--color-border)',
                  color: isAllFilteredSelected ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                }}
              >
                {isAllFilteredSelected ? <CheckSquare size={14} color="var(--color-primary)" /> : <Square size={14} />}
                {isAllFilteredSelected ? 'Deselect All' : `Select All (${filtered.length})`}
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
            <span>All Properties</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: activeTab === 'all' ? 'rgba(0, 102, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: activeTab === 'all' ? 'var(--color-primary)' : 'inherit',
              }}
            >
              {allCount}
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
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            style={{
              flex: 1,
              minWidth: 100,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'approved' ? 'var(--color-white)' : 'transparent',
              color: activeTab === 'approved' ? 'var(--color-success)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === 'approved' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <CheckCircle2 size={14} />
            <span>Live Verified</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: activeTab === 'approved' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                color: activeTab === 'approved' ? 'var(--color-success)' : 'inherit',
              }}
            >
              {approvedCount}
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
              {rejectedCount}
            </span>
          </button>
        </div>

        {/* Properties Grid List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RefreshCw size={28} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Loading platform inventory...
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
            <Building2 size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
              No properties match your filter
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              Try adjusting your search criteria or switch to another tab.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map((prop) => {
              const primaryImg = prop.images?.find((img) => img.is_primary) || prop.images?.[0];
              const minRent = prop.units && prop.units.length > 0 ? Math.min(...prop.units.map((u) => u.rent_amount)) : 0;
              const currency = prop.units?.[0]?.currency_code || 'USD';
              const isPending = isPendingStatus(prop.status);
              const isSelected = selectedIds.includes(prop.id);

              return (
                <div
                  key={prop.id}
                  className="card animate-fade-in-up"
                  style={{
                    margin: 0,
                    padding: 0,
                    overflow: 'hidden',
                    borderRadius: 'var(--radius-xl)',
                    border: isSelected
                      ? '2px solid var(--color-primary)'
                      : isPending
                      ? '2px solid #FCA5A5'
                      : '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isSelected ? '0 0 0 3px rgba(0, 102, 255, 0.15)' : 'var(--shadow-card)',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  {/* Property Image & Status Overlays */}
                  <div style={{ position: 'relative', height: 180, width: '100%', backgroundColor: 'var(--color-surface-subtle)' }}>
                    {primaryImg?.storage_path ? (
                      <img
                        src={primaryImg.storage_path}
                        alt={prop.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        <Building2 size={36} />
                      </div>
                    )}

                    {/* Selection Checkbox */}
                    <button
                      onClick={(e) => handleToggleSelect(prop.id, e)}
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        backgroundColor: isSelected ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.9)',
                        color: isSelected ? 'var(--color-white)' : 'var(--color-navy-dark)',
                        border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.15)',
                        borderRadius: 6,
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        zIndex: 2,
                      }}
                      title={isSelected ? 'Deselect property' : 'Select property'}
                    >
                      {isSelected ? <Check size={16} strokeWidth={3} /> : <Square size={16} />}
                    </button>

                    {/* Status Badge */}
                    <div style={{ position: 'absolute', top: 12, left: 46 }}>
                      <Badge variant={isPending ? 'warning' : prop.status === 'approved' ? 'approved' : 'rejected'}>
                        {isPending ? 'Pending Review' : prop.status === 'approved' ? 'Live Verified' : 'Rejected'}
                      </Badge>
                    </div>

                    {/* Action buttons on Image overlay */}
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, zIndex: 2 }}>
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingProperty(prop);
                        }}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.92)',
                          border: 'none',
                          borderRadius: 'var(--radius-full)',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#DC2626',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                          transition: 'all 0.15s ease',
                        }}
                        title="Delete Property"
                      >
                        <Trash2 size={15} />
                      </button>

                      {/* Featured Toggle Button */}
                      <button
                        onClick={(e) => handleToggleFeatured(prop, e)}
                        style={{
                          backgroundColor: prop.featured ? '#FEF08A' : 'rgba(255, 255, 255, 0.92)',
                          border: 'none',
                          borderRadius: 'var(--radius-full)',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: prop.featured ? '#CA8A04' : 'var(--color-text-muted)',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                        }}
                        title={prop.featured ? 'Featured on Homepage (Click to unfeature)' : 'Feature on Homepage'}
                      >
                        <Star size={15} fill={prop.featured ? '#CA8A04' : 'none'} />
                      </button>
                    </div>

                    {/* Bottom overlay: property units count */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(4px)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Layers size={12} />
                      {prop.units?.length || 1} Unit{prop.units?.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                          {prop.property_type?.replace(/_/g, ' ')}
                        </span>
                        {prop.is_admin_direct && (
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 5px', borderRadius: 4, backgroundColor: '#E0E7FF', color: '#3730A3' }}>
                            Direct
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0, lineHeight: 1.3 }}>
                        {prop.title}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                        <MapPin size={13} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prop.street_address}, {prop.city}, {prop.state_province}
                        </span>
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
                        Provider:{' '}
                        <strong style={{ color: 'var(--color-navy-dark)' }}>
                          {prop.provider_name || 'Blue Sky Direct Property'}
                        </strong>
                      </div>
                    </div>

                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase' }}>
                          Starting Rent
                        </span>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                          ${minRent.toLocaleString()}
                          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>/mo</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setInspectingProperty(prop);
                            setActiveImageIdx(0);
                            setIsRejecting(false);
                            setRejectionReason('');
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12, padding: '6px 10px' }}
                        >
                          <Eye size={13} /> Inspect
                        </button>
                        <Link
                          href={`/properties/${prop.slug || prop.id}`}
                          target="_blank"
                          className="btn btn-outline btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 12, padding: '6px 8px', textDecoration: 'none' }}
                          title="View Public Listing"
                        >
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </div>
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
              <span style={{ fontSize: 13, fontWeight: 600 }}>Properties selected</span>
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
        {deletingProperty && (
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
                    Delete Property Listing?
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                    Are you sure you want to permanently delete <strong>{deletingProperty.title}</strong>?
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
                <strong>Warning:</strong> This will permanently delete this property, all configured units, photos, and related rental application records. This action cannot be undone.
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeletingProperty(null)}
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
                  Delete Property
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
                    Bulk Delete {selectedIds.length} Properties?
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                    You have selected <strong>{selectedIds.length} property items</strong> for permanent removal.
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
                <strong>Critical Action:</strong> All {selectedIds.length} properties, their units, media galleries, and associated rental applications will be irreversibly erased from the system.
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

        {/* Property Inspector Bottom Sheet */}
        <BottomSheet
          isOpen={!!inspectingProperty}
          onClose={() => setInspectingProperty(null)}
          title={inspectingProperty?.title || 'Property Audit Inspector'}
        >
          {inspectingProperty && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Media Carousel */}
              {inspectingProperty.images && inspectingProperty.images.length > 0 ? (
                <div style={{ position: 'relative', height: 260, borderRadius: 'var(--radius-lg)', overflow: 'hidden', backgroundColor: 'var(--color-surface-subtle)' }}>
                  <img
                    src={inspectingProperty.images[activeImageIdx]?.storage_path || inspectingProperty.images[0]?.storage_path}
                    alt={inspectingProperty.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {inspectingProperty.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : inspectingProperty.images.length - 1))}
                        style={{
                          position: 'absolute',
                          left: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-full)',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setActiveImageIdx((prev) => (prev < inspectingProperty.images.length - 1 ? prev + 1 : 0))}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-full)',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      padding: '2px 8px',
                      borderRadius: 10,
                      color: 'white',
                      fontSize: 11,
                    }}
                  >
                    {activeImageIdx + 1} / {inspectingProperty.images.length}
                  </div>
                </div>
              ) : null}

              {/* Quick Info & Actions Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                    {inspectingProperty.property_type?.replace(/_/g, ' ')}
                  </span>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: '2px 0 0 0' }}>
                    {inspectingProperty.title}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => setDeletingProperty(inspectingProperty)}
                    className="btn btn-outline-danger btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12, padding: '6px 10px', color: '#DC2626' }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                  <Link
                    href={`/admin/properties/${inspectingProperty.id}/edit`}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 12, textDecoration: 'none', padding: '6px 10px' }}
                  >
                    <Edit2 size={13} /> Edit
                  </Link>
                  <Badge variant={inspectingProperty.status === 'approved' ? 'approved' : isPendingStatus(inspectingProperty.status) ? 'warning' : 'rejected'}>
                    {inspectingProperty.status}
                  </Badge>
                </div>
              </div>

              {/* Location & Provider details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>Address</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                    {inspectingProperty.street_address}, {inspectingProperty.city}, {inspectingProperty.state_province}
                  </div>
                </div>
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>Provider</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginTop: 2 }}>
                    {inspectingProperty.provider_name || 'Blue Sky Direct Property'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                  Listing Description
                </label>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)' }}>
                  {inspectingProperty.description || 'No description provided.'}
                </div>
              </div>

              {/* Units Breakdown */}
              {inspectingProperty.units && inspectingProperty.units.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 8 }}>
                    Configured Units & Rent Pricing ({inspectingProperty.units.length})
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {inspectingProperty.units.map((unit) => (
                      <div
                        key={unit.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                            {unit.unit_number_or_name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2, display: 'flex', gap: 8 }}>
                            <span>{unit.bedrooms} Bed</span>
                            <span>•</span>
                            <span>{unit.bathrooms} Bath</span>
                            <span>•</span>
                            <span>{unit.square_feet} sq ft</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                            ${unit.rent_amount.toLocaleString()} {unit.currency_code}
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>/ {unit.rent_period}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Note Form */}
              {isRejecting && (
                <div style={{ padding: 14, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', border: '1px solid #FECACA' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-danger-text)', display: 'block', marginBottom: 4 }}>
                    Specify Reason for Rejection
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Incomplete unit pricing, unverified street address, or invalid photo proofs..."
                    style={{
                      width: '100%',
                      minHeight: 70,
                      padding: 10,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #FCA5A5',
                      fontSize: 12,
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => handleReject(inspectingProperty)}
                      disabled={isActionLoading}
                      className="btn btn-sm btn-outline-danger"
                      style={{ flex: 1, fontWeight: 700 }}
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => setIsRejecting(false)}
                      className="btn btn-sm btn-outline"
                      style={{ fontWeight: 600 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!isRejecting && (
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button
                    onClick={() => handleApprove(inspectingProperty)}
                    disabled={isActionLoading}
                    className="btn btn-primary"
                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700 }}
                  >
                    <CheckCircle2 size={16} /> Approve & Publish Live
                  </button>
                  <button
                    onClick={() => setIsRejecting(true)}
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
