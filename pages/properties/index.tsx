import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Heart,
  MapPin,
  Bed,
  Bath,
  Building,
  Check,
  ArrowRight,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PropertyCard } from '@/components/property/PropertyCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { propertiesDb } from '@/lib/db';
import { Property } from '@/lib/types';

export default function PropertiesExplorePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Filter states
  const [selectedType, setSelectedType] = useState('all');
  const [selectedBeds, setSelectedBeds] = useState('all');
  const [maxRent, setMaxRent] = useState(6000);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high'>('featured');

  const allAmenities = [
    'Parking',
    'Security Concierge',
    'Swimming Pool',
    'Fitness Center',
    'In-unit Laundry',
    'Central A/C',
    'Pet Friendly',
    'Balcony',
    'Private Garden',
    'High-speed Internet',
  ];

  useEffect(() => {
    async function loadProperties() {
      const list = await propertiesDb.getPublicProperties();
      setProperties(list);

      const locationParam = router.query.location as string;
      const typeParam = router.query.type as string;

      if (locationParam) setSearchQuery(locationParam);
      if (typeParam) setSelectedType(typeParam);
    }
    loadProperties();
  }, [router.query]);

  // Execute filtering
  useEffect(() => {
    let result = [...properties];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.state_province.toLowerCase().includes(q) ||
          p.country_name.toLowerCase().includes(q) ||
          (p.neighborhood && p.neighborhood.toLowerCase().includes(q))
      );
    }

    if (selectedType !== 'all') {
      result = result.filter((p) => p.property_type === selectedType);
    }

    if (selectedBeds !== 'all') {
      const targetBeds = parseInt(selectedBeds, 10);
      result = result.filter((p) => p.units.some((u) => u.bedrooms === targetBeds));
    }

    result = result.filter((p) => {
      const minRent = p.units.length > 0 ? Math.min(...p.units.map((u) => u.rent_amount)) : 0;
      return minRent <= maxRent;
    });

    if (selectedAmenities.length > 0) {
      result = result.filter((p) =>
        selectedAmenities.every((amenity) => p.amenities.includes(amenity))
      );
    }

    if (sortBy === 'price_low') {
      result.sort((a, b) => {
        const rentA = Math.min(...a.units.map((u) => u.rent_amount));
        const rentB = Math.min(...b.units.map((u) => u.rent_amount));
        return rentA - rentB;
      });
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => {
        const rentA = Math.min(...a.units.map((u) => u.rent_amount));
        const rentB = Math.min(...b.units.map((u) => u.rent_amount));
        return rentB - rentA;
      });
    }

    setFilteredProperties(result);
  }, [properties, searchQuery, selectedType, selectedBeds, maxRent, selectedAmenities, sortBy]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleResetFilters = () => {
    setSelectedType('all');
    setSelectedBeds('all');
    setMaxRent(6000);
    setSelectedPeriod('all');
    setSelectedAmenities([]);
    setSearchQuery('');
  };

  return (
    <AppLayout
      title="Explore Verified Properties Worldwide | Blue Sky"
      isPublic={true}
    >
      {/* =========================================================================
          TOP SEARCH & FILTER HEADER
          ========================================================================= */}
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          borderBottom: '1px solid var(--color-border)',
          padding: '24px 0',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="page-container">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Title & Stats */}
            <div className="flex-between">
              <div>
                <h1 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                  Explore Rental Properties
                </h1>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  100% verified homes with multi-unit floorplans across USA, Canada, UK, and Australia
                </p>
              </div>

              {(selectedAmenities.length > 0 || selectedType !== 'all' || selectedBeds !== 'all' || searchQuery) && (
                <button
                  onClick={handleResetFilters}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={14} /> Clear Filters
                </button>
              )}
            </div>

            {/* Main Interactive Controls Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                alignItems: 'center',
              }}
            >
              {/* Search by City/Address */}
              <div style={{ position: 'relative', minWidth: 240 }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-primary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by city, state, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 42, height: 46, backgroundColor: 'var(--color-surface-subtle)' }}
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
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Property Type Dropdown */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="form-select"
                style={{ height: 46, backgroundColor: 'var(--color-surface-subtle)' }}
              >
                <option value="all">All Property Types</option>
                <option value="apartment">Apartments</option>
                <option value="studio">Studios</option>
                <option value="townhouse">Townhouses</option>
                <option value="condo">Condos</option>
                <option value="penthouse">Penthouses</option>
                <option value="duplex">Duplexes</option>
              </select>

              {/* Bedrooms Dropdown */}
              <select
                value={selectedBeds}
                onChange={(e) => setSelectedBeds(e.target.value)}
                className="form-select"
                style={{ height: 46, backgroundColor: 'var(--color-surface-subtle)' }}
              >
                <option value="all">Any Bedrooms</option>
                <option value="0">Studio (0 Bed)</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3+ Bedrooms</option>
              </select>

              {/* Filter Sheet & Sort Triggers */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    height: 46,
                    backgroundColor: selectedAmenities.length > 0 ? 'var(--color-primary-tint)' : 'var(--color-surface-subtle)',
                    color: selectedAmenities.length > 0 ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                    borderColor: selectedAmenities.length > 0 ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >
                  <SlidersHorizontal size={16} /> More Filters {selectedAmenities.length > 0 ? `(${selectedAmenities.length})` : ''}
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="form-select"
                  style={{ width: 'auto', height: 46, backgroundColor: 'var(--color-surface-subtle)' }}
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PROPERTIES GALLERY (Desktop Multi-Column Grid + Mobile Responsive)
          ========================================================================= */}
      <div className="page-container" style={{ padding: '36px 16px 80px 16px' }}>
        <div className="flex-between" style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
            Showing {filteredProperties.length} verified {filteredProperties.length === 1 ? 'property' : 'properties'}
          </span>
        </div>

        {filteredProperties.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              maxWidth: 500,
              margin: '40px auto',
            }}
          >
            <Building size={48} color="var(--color-primary)" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No Properties Found</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              We couldn't find any verified listings matching your specific search criteria.
            </p>
            <button onClick={handleResetFilters} className="btn btn-primary btn-sm">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid-responsive-properties">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} layout="vertical" />
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          MORE FILTERS BOTTOM SHEET MODAL
          ========================================================================= */}
      <BottomSheet
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="More Filters"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Max Monthly Rent Slider */}
          <div>
            <div className="flex-between" style={{ marginBottom: 6 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Max Monthly Rent</label>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-primary)' }}>
                ${maxRent.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="6000"
              step="100"
              value={maxRent}
              onChange={(e) => setMaxRent(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--color-primary)' }}
            />
            <div className="flex-between" style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              <span>$500</span>
              <span>$6,000+</span>
            </div>
          </div>

          {/* Amenities Multi-Select */}
          <div>
            <label className="form-label">Amenities & Features</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allAmenities.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary-tint)' : 'var(--color-white)',
                      color: isSelected ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected && <Check size={13} />}
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sheet Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(false)}
              className="btn btn-primary"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </BottomSheet>
    </AppLayout>
  );
}
