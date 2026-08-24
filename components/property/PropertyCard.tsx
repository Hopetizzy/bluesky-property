import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Bed, Bath, Building, Layers, ShieldCheck } from 'lucide-react';
import { Property } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface PropertyCardProps {
  property: Property;
  layout?: 'vertical' | 'horizontal';
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  layout = 'vertical',
}) => {
  const [isFavorited, setIsFavorited] = useState(false);

  const primaryImage =
    property.images.find((i) => i.is_primary)?.storage_path ||
    property.images[0]?.storage_path ||
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

  const minRent =
    property.units.length > 0
      ? Math.min(...property.units.map((u) => u.rent_amount))
      : 0;

  const currencySymbol =
    property.units[0]?.currency_code === 'USD'
      ? '$'
      : property.units[0]?.currency_code === 'CAD'
      ? 'CA$'
      : property.units[0]?.currency_code === 'GBP'
      ? '£'
      : property.units[0]?.currency_code === 'EUR'
      ? '€'
      : property.units[0]?.currency_code === 'AUD'
      ? 'A$'
      : '$';

  const totalBeds = property.units.reduce((acc, u) => Math.max(acc, u.bedrooms), 0);
  const totalBaths = property.units.reduce((acc, u) => Math.max(acc, u.bathrooms), 0);

  if (layout === 'horizontal') {
    return (
      <Link
        href={`/properties/${property.slug}`}
        style={{
          display: 'flex',
          gap: 16,
          padding: 14,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: 14,
          transition: 'all 0.2s ease',
        }}
        className="card-clickable"
      >
        <div
          style={{
            position: 'relative',
            width: 140,
            height: 120,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src={primaryImage}
            alt={property.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {property.status === 'approved' && (
            <span
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                backgroundColor: 'var(--color-success)',
                color: 'white',
                fontSize: 9,
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              ✓ VERIFIED
            </span>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-navy-dark)', lineHeight: 1.3 }}>
              {property.title}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-text-secondary)',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <MapPin size={13} color="var(--color-primary)" />
              {property.city}, {property.state_province} ({property.country_name})
            </div>
          </div>

          <div className="flex-between" style={{ marginTop: 8 }}>
            <div className="price-text" style={{ fontSize: 18 }}>
              {currencySymbol}
              {minRent.toLocaleString()} <span className="price-period" style={{ fontSize: 12 }}>/ mo</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', gap: 8, fontWeight: 500 }}>
              <span>{totalBeds === 0 ? 'Studio' : `${totalBeds} Beds`}</span>
              <span>•</span>
              <span>{totalBaths} Baths</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div
      style={{
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="card-clickable"
    >
      <div style={{ position: 'relative', height: 210, width: '100%', overflow: 'hidden' }}>
        <img
          src={primaryImage}
          alt={property.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
          className="property-img-hover"
        />

        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, zIndex: 2 }}>
          {property.status === 'approved' && (
            <Badge variant="verified">✓ VERIFIED</Badge>
          )}
          {property.featured && (
            <Badge variant="info">FEATURED</Badge>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorited(!isFavorited);
          }}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(6px)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isFavorited ? '#EF4444' : 'var(--color-navy-dark)',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 2,
          }}
          aria-label="Save Property"
        >
          <Heart size={18} fill={isFavorited ? '#EF4444' : 'none'} />
        </button>
      </div>

      <Link
        href={`/properties/${property.slug}`}
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 6, lineHeight: 1.3 }}>
            {property.title}
          </div>

          <div
            style={{
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginBottom: 12,
            }}
          >
            <MapPin size={14} color="var(--color-primary)" />
            {property.neighborhood ? `${property.neighborhood}, ` : ''}
            {property.city}, {property.country_name}
          </div>
        </div>

        <div className="flex-between" style={{ borderTop: '1px solid var(--color-surface-subtle)', paddingTop: 12 }}>
          <div>
            <div className="price-text">
              {currencySymbol}
              {minRent.toLocaleString()} <span className="price-period">/ mo</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {property.units.length} unit {property.units.length === 1 ? 'type' : 'types'} available
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Bed size={15} /> {totalBeds === 0 ? 'Studio' : `${totalBeds} Beds`}
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Bath size={15} /> {totalBaths} Baths
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};
