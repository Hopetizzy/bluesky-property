import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Building2, Check, X, Shield, Eye, MapPin, Star, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { propertiesDb } from '@/lib/db';
import { store } from '@/lib/store';
import { Property } from '@/lib/types';

export default function AdminPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending_verification' | 'approved' | 'rejected'>('all');
  const [inspectingProperty, setInspectingProperty] = useState<Property | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    async function load() {
      const list = store.getProperties();
      setProperties(list);
    }
    load();
  }, []);

  const filtered = properties.filter((p) => {
    if (activeTab === 'all') return true;
    return p.status === activeTab;
  });

  const handleToggleFeatured = async (prop: Property, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !prop.featured;
    await propertiesDb.toggleFeatured(prop.id, newStatus);
    setProperties(store.getProperties());
  };

  const handleApprove = async (prop: Property) => {
    await propertiesDb.setPropertyStatus(prop.id, 'approved');
    setProperties(store.getProperties());
    setInspectingProperty(null);
    alert(`Property "${prop.title}" approved and live!`);
  };

  const handleReject = async (prop: Property) => {
    await propertiesDb.setPropertyStatus(prop.id, 'rejected', rejectionReason || 'Property address could not be verified.');
    setProperties(store.getProperties());
    setInspectingProperty(null);
    setIsRejecting(false);
    setRejectionReason('');
    alert(`Property "${prop.title}" marked as rejected.`);
  };

  return (
    <AppLayout title="Properties Verification Suite | Blue Sky Admin" headerTitle="Property Verification">
      <div style={{ padding: '16px 16px 80px 16px' }}>
        {/* Header */}
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
          <h1 style={{ fontSize: 18, fontWeight: 800 }}>Properties Registry</h1>
          <Link href="/admin/properties/create" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
            + Direct Add
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--color-surface-subtle)',
            padding: 4,
            borderRadius: 'var(--radius-md)',
            marginBottom: 16,
          }}
        >
          {(['all', 'pending_verification', 'approved', 'rejected'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: activeTab === t ? 'var(--color-white)' : 'transparent',
                color: activeTab === t ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === t ? 700 : 500,
                fontSize: 11,
                cursor: 'pointer',
                boxShadow: activeTab === t ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {t === 'all' ? 'All' : t === 'pending_verification' ? 'Pending' : t === 'approved' ? 'Live' : 'Rejected'}
            </button>
          ))}
        </div>

        {/* Property Verification Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((prop) => (
            <div
              key={prop.id}
              className="card"
              style={{ margin: 0, padding: 14 }}
            >
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <img
                  src={prop.images[0]?.storage_path || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
                  alt=""
                  style={{ width: 80, height: 80, borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)', lineHeight: 1.3 }}>
                      {prop.title}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {prop.city}, {prop.state_province}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600, marginTop: 4 }}>
                    By: {prop.is_admin_direct ? 'Blue Sky Direct' : prop.provider_name}
                  </div>
                </div>
              </div>

              <div className="flex-between" style={{ borderTop: '1px solid var(--color-surface-subtle)', paddingTop: 10 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Badge variant={prop.status === 'approved' ? 'published' : prop.status === 'rejected' ? 'rejected' : 'pending'}>
                    {prop.status.replace('_', ' ')}
                  </Badge>

                  {/* Admin 1-Click Feature on Landing Page Toggle */}
                  <button
                    onClick={(e) => handleToggleFeatured(prop, e)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: prop.featured ? '1px solid #F59E0B' : '1px solid var(--color-border)',
                      backgroundColor: prop.featured ? '#FEF3C7' : 'var(--color-white)',
                      color: prop.featured ? '#B45309' : 'var(--color-text-secondary)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title={prop.featured ? 'Remove from Landing Page Featured list' : 'Feature this property on the Landing Page'}
                  >
                    <Star size={12} fill={prop.featured ? '#F59E0B' : 'none'} />
                    {prop.featured ? 'Featured' : 'Make Featured'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectingProperty(prop)}
                  className="btn btn-outline-primary btn-sm"
                >
                  <Eye size={14} /> Review & Verify
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Property Review Bottom Sheet */}
      <BottomSheet
        isOpen={!!inspectingProperty}
        onClose={() => {
          setInspectingProperty(null);
          setIsRejecting(false);
        }}
        title="Verify Property Listing"
      >
        {inspectingProperty && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <img
              src={inspectingProperty.images[0]?.storage_path || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
              alt=""
              style={{ width: '100%', height: 160, borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
            />

            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{inspectingProperty.title}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <MapPin size={14} color="var(--color-primary)" />
                {inspectingProperty.street_address}, {inspectingProperty.city}, {inspectingProperty.state_province}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: 12, borderRadius: 'var(--radius-md)', fontSize: 12 }}>
              <div><strong>Provider:</strong> {inspectingProperty.is_admin_direct ? 'First-Party Blue Sky' : inspectingProperty.provider_name}</div>
              <div><strong>Units:</strong> {inspectingProperty.units.length} configured options</div>
              <div><strong>Amenities:</strong> {inspectingProperty.amenities.join(', ')}</div>
            </div>

            {/* Rejection Note Input */}
            {isRejecting ? (
              <div style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 'var(--radius-md)' }}>
                <label className="form-label" style={{ color: 'var(--color-danger)' }}>Reason for Rejection</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="form-textarea"
                  placeholder="e.g. Please provide clearer photos of the building entrance..."
                  rows={3}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  <button onClick={() => setIsRejecting(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button onClick={() => handleReject(inspectingProperty)} className="btn btn-danger btn-sm">
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="btn btn-outline-danger"
                  style={{ height: 44 }}
                >
                  <X size={16} /> Reject Listing
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(inspectingProperty)}
                  className="btn btn-primary"
                  style={{ height: 44, backgroundColor: 'var(--color-success)' }}
                >
                  <Check size={16} /> Approve & Publish
                </button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </AppLayout>
  );
}
