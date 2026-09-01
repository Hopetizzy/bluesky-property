import React, { useState, useEffect } from 'react';
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
  const filtered = properties.filter((p) => {
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

  // Calculate Tab Badges
  const allCount = properties.length;
  const pendingCount = properties.filter((p) => isPendingStatus(p.status)).length;
  const approvedCount = properties.filter((p) => isApprovedStatus(p.status)).length;
  const rejectedCount = properties.filter((p) => isRejectedStatus(p.status)).length;

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
      <div style={{ padding: '24px 16px 80px 16px', maxWidth: 1120, margin: '0 auto' }}>
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
              Audit provider listings, inspect unit pricing, manage first-party inventory & verify compliance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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

        {/* Search Bar & Filter Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
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
              color: activeTab === 'all' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
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
              minWidth: 120,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'pending' ? 'var(--color-white)' : 'transparent',
              color: activeTab === 'pending' ? '#DC2626' : 'var(--color-text-secondary)',
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
                backgroundColor: pendingCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                color: pendingCount > 0 ? '#DC2626' : 'inherit',
                fontWeight: 800,
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
            <span>Approved</span>
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
              Loading real platform inventory...
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

              return (
                <div
                  key={prop.id}
                  className="card animate-fade-in-up"
                  style={{
                    margin: 0,
                    padding: 0,
                    overflow: 'hidden',
                    borderRadius: 'var(--radius-xl)',
                    border: isPending ? '2px solid #FCA5A5' : '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-card)',
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

                    {/* Status Badge */}
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <Badge variant={isPending ? 'warning' : prop.status === 'approved' ? 'approved' : 'rejected'}>
                        {isPending ? 'Pending Verification' : prop.status === 'approved' ? 'Live Verified' : 'Rejected'}
                      </Badge>
                    </div>

                    {/* Featured Toggle Button */}
                    <button
                      onClick={(e) => handleToggleFeatured(prop, e)}
                      title={prop.featured ? 'Featured on Homepage' : 'Not Featured'}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: prop.featured ? '#F59E0B' : 'rgba(15, 23, 42, 0.6)',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <Star size={16} fill={prop.featured ? 'white' : 'none'} />
                    </button>

                    {/* First-Party Direct Tag */}
                    {prop.is_admin_direct && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 12,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: '#0F172A',
                          color: '#38BDF8',
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Blue Sky First-Party
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                        {prop.property_type.replace('_', ' ')} • {prop.city}, {prop.country_code}
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0, lineHeight: 1.3 }}>
                        {prop.title}
                      </h3>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} color="var(--color-text-muted)" />
                        <span>{prop.street_address || `${prop.city}, ${prop.state_province}`}</span>
                      </div>

                      {/* Provider info */}
                      <div
                        style={{
                          marginTop: 10,
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--color-surface-subtle)',
                          fontSize: 11,
                          color: 'var(--color-navy-dark)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>Provider:</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                          {prop.provider_name || 'Blue Sky Direct'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Specs & Action CTA */}
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>From</span>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                          ${minRent.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)' }}>/{currency}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Link
                          href={`/admin/properties/${prop.id}/edit`}
                          className="btn btn-sm btn-outline-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600, fontSize: 12 }}
                          title="Edit Property Listing"
                        >
                          <Edit2 size={13} /> Edit
                        </Link>
                        <button
                          onClick={() => {
                            setInspectingProperty(prop);
                            setActiveImageIdx(0);
                            setIsRejecting(false);
                            setRejectionReason('');
                          }}
                          className="btn btn-sm btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                        >
                          <Eye size={14} /> Inspect
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Property Inspection Bottom Sheet / Modal */}
        <BottomSheet
          isOpen={!!inspectingProperty}
          onClose={() => {
            setInspectingProperty(null);
            setIsRejecting(false);
          }}
          title={inspectingProperty?.title || 'Inspect Property Listing'}
        >
          {inspectingProperty && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20 }}>
              {/* Photo Gallery Viewer */}
              {inspectingProperty.images && inspectingProperty.images.length > 0 ? (
                <div>
                  <div style={{ position: 'relative', height: 240, width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', backgroundColor: '#000' }}>
                    <img
                      src={inspectingProperty.images[activeImageIdx]?.storage_path}
                      alt="Property"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    {inspectingProperty.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImageIdx((prev) => (prev === 0 ? inspectingProperty.images.length - 1 : prev - 1))}
                          style={{
                            position: 'absolute',
                            left: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                            border: 'none',
                            color: 'white',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          onClick={() => setActiveImageIdx((prev) => (prev === inspectingProperty.images.length - 1 ? 0 : prev + 1))}
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                            border: 'none',
                            color: 'white',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {inspectingProperty.images.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, overflowX: 'auto', paddingBottom: 4 }}>
                      {inspectingProperty.images.map((img, idx) => (
                        <button
                          key={img.id || idx}
                          onClick={() => setActiveImageIdx(idx)}
                          style={{
                            width: 54,
                            height: 40,
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            border: activeImageIdx === idx ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            padding: 0,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <img src={img.storage_path} alt="Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Status Header */}
              <div className="flex-between">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                    {inspectingProperty.property_type.replace('_', ' ')} • {inspectingProperty.city}, {inspectingProperty.country_name}
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                    {inspectingProperty.title}
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Link
                    href={`/admin/properties/${inspectingProperty.id}/edit`}
                    className="btn btn-sm btn-outline-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600, fontSize: 12, padding: '4px 10px' }}
                  >
                    <Edit2 size={13} /> Edit Property
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
                    {inspectingProperty.street_address}, {inspectingProperty.postal_code}
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
