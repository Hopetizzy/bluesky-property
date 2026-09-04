import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Eye,
  Edit3,
  MapPin,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Loader2,
  DollarSign,
  Info,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { propertiesDb } from '@/lib/db/properties';
import { Property } from '@/lib/types';

export default function PropertyVerificationStatusPage() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;

    async function loadProperty() {
      setIsLoading(true);
      try {
        const found = await propertiesDb.getPropertyById(String(id));
        setProperty(found);
      } catch (err) {
        console.warn('Error fetching property details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProperty();
  }, [id]);

  if (isLoading) {
    return (
      <AppLayout title="Property Audit Status | Blue Sky Provider">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 12,
          }}
        >
          <Loader2 className="animate-spin" size={36} color="var(--color-primary)" />
          <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Retrieving verification status and timeline...
          </span>
        </div>
      </AppLayout>
    );
  }

  if (!property) {
    return (
      <AppLayout title="Property Not Found | Blue Sky">
        <div style={{ padding: '60px 16px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
          <Building2 size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 8 }}>
            Property Listing Not Found
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            The requested property could not be found or you do not have permission to view its audit status.
          </p>
          <Link href="/provider/properties" className="btn btn-primary">
            Back to Property Portfolio
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isApproved = property.status === 'approved';
  const isRejected = property.status === 'rejected';
  const isPending = property.status === 'pending_verification';

  const primaryImage =
    property.images && property.images.length > 0
      ? property.images.find((img) => img.is_primary)?.storage_path || property.images[0].storage_path
      : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';

  const startingRent =
    property.units && property.units.length > 0
      ? Math.min(...property.units.map((u) => u.rent_amount))
      : null;
  const currency = property.units?.[0]?.currency_code || 'USD';

  return (
    <AppLayout title={`Audit: ${property.title} | Blue Sky Provider`} headerTitle="Audit Status">
      <div style={{ padding: '20px 16px 80px 16px', maxWidth: 840, margin: '0 auto' }}>
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => router.push('/provider/properties')}
            className="btn btn-outline btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowLeft size={16} /> Back to Portfolio
          </button>

          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
            ID: {property.id.slice(0, 8)}...
          </span>
        </div>

        {/* Property Hero Summary Card */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <img
              src={primaryImage}
              alt={property.title}
              onError={(e) => {
                (e.target as HTMLElement).setAttribute(
                  'src',
                  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'
                );
              }}
              style={{
                width: 120,
                height: 100,
                borderRadius: 'var(--radius-lg)',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />

            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Badge
                  variant={
                    isApproved
                      ? 'published'
                      : isRejected
                      ? 'rejected'
                      : property.status === 'draft'
                      ? 'info'
                      : 'pending'
                  }
                >
                  {isApproved
                    ? 'LIVE ON MARKETPLACE'
                    : isPending
                    ? 'UNDER COMPLIANCE REVIEW'
                    : isRejected
                    ? 'CHANGES REQUIRED'
                    : property.status.replace('_', ' ').toUpperCase()}
                </Badge>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    backgroundColor: '#F1F5F9',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  {property.property_type.replace('_', ' ')}
                </span>
              </div>

              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-navy-dark)', margin: '4px 0 6px 0' }}>
                {property.title}
              </h1>

              <div
                style={{
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  marginBottom: 8,
                }}
              >
                <MapPin size={13} color="var(--color-primary)" />
                <span>
                  {property.street_address ? `${property.street_address}, ` : ''}{property.city}, {property.state_province} {property.postal_code || ''} ({property.country_name || property.country_code})
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {startingRent && (
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)' }}>
                    From {currency} ${startingRent.toLocaleString()}/mo
                  </span>
                )}
                {property.units && property.units.length > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    • {property.units.length} Unit{property.units.length > 1 ? 's' : ''} Listed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Audit Timeline */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <ShieldCheck size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
              Verification & Compliance Timeline
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
            {/* Connecting Vertical Track */}
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 15,
                bottom: 14,
                width: 2,
                backgroundColor: isApproved ? 'var(--color-success)' : '#E2E8F0',
                zIndex: 1,
              }}
            />

            {/* Stage 1: Submission */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', zIndex: 2 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-success)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle2 size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                    1. Property Submitted
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {property.created_at ? new Date(property.created_at).toLocaleString() : 'Logged'}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  Property metadata, photos, address validation, and rental unit tiers successfully registered in the platform database.
                </div>
              </div>
            </div>

            {/* Stage 2: Compliance Verification Review */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', zIndex: 2 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: isApproved
                    ? 'var(--color-success)'
                    : isRejected
                    ? 'var(--color-danger)'
                    : 'var(--color-primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isApproved
                    ? '0 2px 6px rgba(16, 185, 129, 0.3)'
                    : isRejected
                    ? '0 2px 6px rgba(239, 68, 68, 0.3)'
                    : '0 2px 6px rgba(14, 116, 144, 0.3)',
                }}
              >
                {isApproved ? (
                  <CheckCircle2 size={18} />
                ) : isRejected ? (
                  <AlertCircle size={18} />
                ) : (
                  <Clock size={18} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                    2. Administrative Compliance Audit
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {property.verified_at
                      ? new Date(property.verified_at).toLocaleString()
                      : isPending
                      ? 'In Progress (2-6 hrs typical)'
                      : isRejected
                      ? 'Action Required'
                      : 'Pending'}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {isApproved
                    ? 'Property ownership, location accuracy, and safety compliance verified by compliance administrators.'
                    : isRejected
                    ? 'The review identified compliance or detail issues that require your attention before publishing.'
                    : 'Our verification specialists are conducting ownership checks, photo authenticity review, and address matching.'}
                </div>
              </div>
            </div>

            {/* Stage 3: Public Marketplace Publication */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', zIndex: 2 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: isApproved ? 'var(--color-success)' : '#F1F5F9',
                  color: isApproved ? 'white' : 'var(--color-text-muted)',
                  border: isApproved ? 'none' : '2px solid #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isApproved ? '0 2px 6px rgba(16, 185, 129, 0.3)' : 'none',
                }}
              >
                {isApproved ? <CheckCircle2 size={18} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                    3. Worldwide Public Indexing
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {property.published_at
                      ? new Date(property.published_at).toLocaleString()
                      : isApproved
                      ? 'Active & Live'
                      : 'Pending Step 2'}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {isApproved
                    ? 'Property is fully indexed across USA, Canada, UK, and Australia portals. Renters can submit verified applications.'
                    : 'Once approved, the listing will instantly become visible on the public exploration portal.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Administrative Feedback Note Box (If Rejected) */}
        {isRejected && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              color: '#991B1B',
              padding: 20,
              borderRadius: 'var(--radius-xl)',
              marginBottom: 20,
              border: '2px solid #FCA5A5',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={20} color="#DC2626" />
              Administrative Compliance Feedback
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: 12,
                borderRadius: 'var(--radius-md)',
                border: '1px solid #FECACA',
              }}
            >
              {property.verification_notes || 'Please provide clear exterior photos with building numbers and verify the exact postal code.'}
            </div>
            <div style={{ fontSize: 12, marginTop: 10, color: '#7F1D1D', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={14} color="#DC2626" />
              <span>Once updated, our team will automatically re-evaluate your listing.</span>
            </div>
          </div>
        )}

        {/* Units & Configuration Inventory */}
        {property.units && property.units.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)',
              padding: 20,
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Layers size={18} color="var(--color-primary)" />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                Configured Rental Units ({property.units.length})
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {property.units.map((unit) => (
                <div
                  key={unit.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                      {unit.unit_number_or_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {unit.unit_type.replace('_', ' ')} • {unit.bedrooms} Bed{unit.bedrooms > 1 ? 's' : ''} • {unit.bathrooms} Bath{unit.bathrooms > 1 ? 's' : ''}
                      {unit.square_feet ? ` • ${unit.square_feet} sq ft` : ''}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-primary)' }}>
                      {unit.currency_code} ${unit.rent_amount.toLocaleString()}/{unit.rent_period || 'mo'}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: unit.status === 'available' ? 'var(--color-success)' : 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {unit.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {isApproved && property.slug && (
            <Link
              href={`/properties/${property.slug}`}
              target="_blank"
              className="btn btn-primary"
              style={{
                flex: 1,
                minWidth: 200,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 46,
              }}
            >
              <Eye size={18} /> View Live Marketplace Listing <ExternalLink size={14} />
            </Link>
          )}

          <Link
            href="/provider/properties"
            className="btn btn-outline"
            style={{
              flex: 1,
              minWidth: 180,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 46,
              backgroundColor: 'var(--color-white)',
            }}
          >
            Back to Portfolio
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
