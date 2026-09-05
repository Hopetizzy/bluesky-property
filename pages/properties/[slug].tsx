import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  Heart,
  MapPin,
  Bed,
  Bath,
  Building,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Layers,
  Calendar,
  ArrowRight,
  Check,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { propertiesDb } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { Property, PropertyUnit } from '@/lib/types';

export default function PropertyDetailsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<PropertyUnit | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function loadProp() {
      const found = await propertiesDb.getPropertyBySlug(slug as string);
      if (found) {
        setProperty(found);
        if (found.units.length > 0) {
          setSelectedUnit(found.units[0]);
        }
      }
    }
    loadProp();
  }, [slug]);

  const handleApplyClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!property) return;
    setIsCheckingAuth(true);

    const applyUrl = `/properties/${property.slug}/apply${selectedUnit ? `?unitId=${selectedUnit.id}` : ''}`;

    try {
      let isAuthenticated = false;
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          isAuthenticated = true;
        }
      }

      if (!isAuthenticated) {
        const currentUser = store.getCurrentUser();
        if (currentUser && currentUser.id) {
          isAuthenticated = true;
        }
      }

      if (isAuthenticated) {
        router.push(applyUrl);
      } else {
        router.push(`/auth/login?redirect=${encodeURIComponent(applyUrl)}`);
      }
    } catch (err) {
      router.push(`/auth/login?redirect=${encodeURIComponent(applyUrl)}`);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  if (!property) {
    return (
      <AppLayout title="Loading Property... | Blue Sky" isPublic={true}>
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <p>Loading verified property details...</p>
        </div>
      </AppLayout>
    );
  }

  const currencySymbol =
    property.units[0]?.currency_code === 'USD'
      ? '$'
      : property.units[0]?.currency_code === 'CAD'
      ? 'CA$'
      : property.units[0]?.currency_code === 'GBP'
      ? '£'
      : '$';

  const totalBeds = property.units.reduce((acc, u) => Math.max(acc, u.bedrooms), 0);
  const totalBaths = property.units.reduce((acc, u) => Math.max(acc, u.bathrooms), 0);
  const totalUnits = property.units.reduce((acc, u) => acc + u.available_quantity, 0);

  return (
    <AppLayout
      title={`${property.title} | Blue Sky Property`}
      isPublic={true}
    >
      <div className="page-container" style={{ padding: '28px 16px 80px 16px' }}>
        {/* Breadcrumb Navigation & Top Actions */}
        <div className="flex-between" style={{ marginBottom: 20 }}>
          <button
            onClick={() => router.push('/properties')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--color-navy-dark)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} /> Back to Search
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: property.title, url: window.location.href });
                } else {
                  alert('Link copied to clipboard!');
                }
              }}
              className="btn btn-secondary btn-sm"
              style={{ width: 38, padding: 0 }}
              aria-label="Share"
            >
              <Share2 size={16} />
            </button>

            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className="btn btn-secondary btn-sm"
              style={{ width: 38, padding: 0, color: isFavorited ? '#EF4444' : 'inherit' }}
              aria-label="Save Favorite"
            >
              <Heart size={16} fill={isFavorited ? '#EF4444' : 'none'} />
            </button>
          </div>
        </div>

        {/* Gallery Section */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              position: 'relative',
              height: 'clamp(280px, 45vw, 500px)',
              width: '100%',
              borderRadius: 'var(--radius-2xl)',
              overflow: 'hidden',
              backgroundColor: '#0F172A',
              marginBottom: 12,
            }}
          >
            <img
              src={property.images[activeImageIndex]?.storage_path || property.images[0]?.storage_path}
              alt={property.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
              <span
                style={{
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '6px 12px',
                  borderRadius: 6,
                  letterSpacing: '0.04em',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                ✓ VERIFIED BY BLUE SKY
              </span>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: 9999,
                backdropFilter: 'blur(6px)',
              }}
            >
              {activeImageIndex + 1} / {property.images.length || 1}
            </div>
          </div>

          {/* Thumbnails */}
          {property.images.length > 1 && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
              {property.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: 80,
                    height: 60,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: activeImageIndex === idx ? '3px solid var(--color-primary)' : '2px solid transparent',
                    padding: 0,
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                >
                  <img src={img.storage_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2-Column Responsive Layout (Mobile Fluid + Desktop Side-by-Side) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 36,
            alignItems: 'flex-start',
          }}
        >
          {/* Main Info Col */}
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 8, lineHeight: 1.2 }}>
              {property.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
              <MapPin size={16} color="var(--color-primary)" />
              {property.street_address}, {property.city}, {property.state_province} {property.postal_code}, {property.country_name}
            </div>

            {/* Quick Specs Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 10px',
                textAlign: 'center',
                marginBottom: 28,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div>
                <Bed size={22} color="var(--color-primary)" style={{ margin: '0 auto 6px auto' }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedUnit ? selectedUnit.bedrooms : totalBeds}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Bedrooms</div>
              </div>
              <div>
                <Bath size={22} color="var(--color-primary)" style={{ margin: '0 auto 6px auto' }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedUnit ? selectedUnit.bathrooms : totalBaths}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Bathrooms</div>
              </div>
              <div>
                <Building size={22} color="var(--color-primary)" style={{ margin: '0 auto 6px auto' }} />
                <div style={{ fontSize: 14, fontWeight: 700, textTransform: 'capitalize' }}>{property.property_type}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Type</div>
              </div>
              <div>
                <Layers size={22} color="var(--color-primary)" style={{ margin: '0 auto 6px auto' }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>{totalUnits} Units</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Available</div>
              </div>
            </div>

            {/* Available Unit Configurations */}
            {property.units.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Available Units & Pricing</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {property.units.map((unit) => {
                    const isSelected = selectedUnit?.id === unit.id;
                    return (
                      <div
                        key={unit.id}
                        onClick={() => setSelectedUnit(unit)}
                        style={{
                          padding: 16,
                          borderRadius: 'var(--radius-lg)',
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-primary-tint)' : 'var(--color-white)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(0, 102, 255, 0.15)' : 'var(--shadow-card)',
                        }}
                      >
                        <div className="flex-between">
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                              {unit.unit_number_or_name}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                              {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} Bed`} • {unit.bathrooms} Bath
                              {unit.square_feet ? ` • ${unit.square_feet} sq ft` : ''}
                            </div>
                          </div>
                          <div className="price-text">
                            {currencySymbol}{unit.rent_amount.toLocaleString()}
                            <span className="price-period" style={{ fontSize: 12 }}> / mo</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>About This Residence</h3>
              <p style={{ fontSize: 14, color: 'var(--color-navy-muted)', lineHeight: 1.7 }}>
                {property.description}
              </p>
            </div>

            {/* Amenities Grid */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Property Amenities</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-navy-dark)',
                      backgroundColor: 'var(--color-white)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <CheckCircle2 size={16} color="var(--color-success)" />
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Side Card for Booking & Application CTA */}
          <div
            style={{
              position: 'sticky',
              top: 100,
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-2xl)',
              padding: '28px 24px',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Selected Rental Unit
            </span>

            <div className="price-text" style={{ fontSize: 32, margin: '8px 0 16px 0' }}>
              {currencySymbol}
              {(selectedUnit ? selectedUnit.rent_amount : property.units[0]?.rent_amount || 0).toLocaleString()}
              <span className="price-period" style={{ fontSize: 15 }}> / {selectedUnit?.rent_period || 'month'}</span>
            </div>

            {selectedUnit?.security_deposit && (
              <div className="flex-between" style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
                <span>Security Deposit:</span>
                <strong>{currencySymbol}{selectedUnit.security_deposit.toLocaleString()}</strong>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <button
                type="button"
                onClick={handleApplyClick}
                disabled={isCheckingAuth}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {isCheckingAuth ? 'Checking account...' : 'Apply Now (6-Step Fast Process)'} <ArrowRight size={18} />
              </button>

              <Link
                href={`/applicant/messages?propertyId=${property.id}`}
                className="btn btn-secondary btn-lg"
              >
                <MessageSquare size={18} /> Message Blue Sky Team
              </Link>
            </div>

            {/* Trust Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--color-navy-muted)', borderTop: '1px solid var(--color-surface-subtle)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} color="var(--color-success)" />
                <strong>100% Verified Listing</strong> — Address & owner verified.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} color="var(--color-primary)" />
                <strong>24-48h Application Review</strong> — Quick tenant approvals.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
