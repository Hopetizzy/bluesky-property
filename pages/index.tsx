import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Search,
  MapPin,
  ShieldCheck,
  Lock,
  Headphones,
  Award,
  ChevronRight,
  ChevronDown,
  Building2,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Calendar,
  Globe2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PropertyCard } from '@/components/property/PropertyCard';
import { propertiesDb } from '@/lib/db';
import { Property } from '@/lib/types';
import { SUPPORTED_REGIONS, getStatesForCountry, SupportedCountry } from '@/lib/constants';

export default function HomePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [propertyType, setPropertyType] = useState<string>('all');
  const [rentPeriod, setRentPeriod] = useState<string>('monthly');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeCountryPopover, setActiveCountryPopover] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const allProps = await propertiesDb.getPublicProperties();
      setProperties(allProps);
    }
    loadData();
  }, []);

  // Handle outside click for country popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveCountryPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedState(''); // reset state when country changes
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push({
      pathname: '/properties',
      query: {
        country: selectedCountry || undefined,
        state: selectedState || undefined,
        location: searchLocation || undefined,
        type: propertyType !== 'all' ? propertyType : undefined,
      },
    });
  };

  const handleQuickSelectState = (countryCode: string, stateName: string) => {
    setActiveCountryPopover(null);
    setSelectedCountry(countryCode);
    setSelectedState(stateName);
    router.push({
      pathname: '/properties',
      query: {
        country: countryCode,
        state: stateName,
      },
    });
  };

  const availableStates = getStatesForCountry(selectedCountry);

  const categories = [
    { id: 'all', label: 'All Properties' },
    { id: 'apartment', label: 'Apartments' },
    { id: 'house', label: 'Houses' },
    { id: 'townhouse', label: 'Townhouses' },
    { id: 'duplex', label: 'Duplexes' },
    { id: 'studio', label: 'Studios' },
  ];

  const filteredProperties =
    activeCategory === 'all'
      ? properties
      : properties.filter((p) => p.property_type === activeCategory);

  return (
    <AppLayout
      title="Blue Sky Property Management | Find Your Next Home"
      isPublic={true}
    >
      {/* =========================================================================
          HERO SECTION: Real-Estate Background with Blue Gradient Fade Overlay
          ========================================================================= */}
      <section
        className="animate-fade-in"
        style={{
          position: 'relative',
          zIndex: 50,
          overflow: 'visible',
          padding: '70px 0 90px 0',
          backgroundImage:
            'linear-gradient(135deg, rgba(0, 102, 255, 0.90) 0%, rgba(15, 23, 42, 0.82) 50%, rgba(15, 23, 42, 0.45) 100%), url(https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1920&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#FFFFFF',
        }}
      >
        <div className="page-container" style={{ position: 'relative', zIndex: 50, overflow: 'visible' }}>
          <div className="animate-fade-in-up" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', marginBottom: 36 }}>
            <h1
              style={{
                fontSize: 'clamp(32px, 5vw, 52px)',
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: 16,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
              }}
            >
              Find your next home <br />
              <span style={{ color: '#BAE6FD' }}>with confidence.</span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(15px, 2vw, 18px)',
                color: '#F1F5F9',
                lineHeight: 1.6,
                maxWidth: 600,
                margin: '0 auto 28px auto',
                fontWeight: 400,
              }}
            >
              Verified properties across United States & Canada. Transparent process. Peace of mind.
            </p>
          </div>

          {/* Clean White Search Card */}
          <div
            className="animate-fade-in-up"
            style={{
              maxWidth: 960,
              margin: '0 auto',
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              color: 'var(--color-navy-dark)',
              position: 'relative',
              zIndex: 60,
              overflow: 'visible',
            }}
          >
            <form onSubmit={handleSearch}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {/* 1. Country Selector */}
                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
                    Country
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="form-select"
                    style={{ height: 48, backgroundColor: 'var(--color-surface-subtle)', fontWeight: 600 }}
                  >
                    <option value="">All Countries (USA & CAN)</option>
                    {SUPPORTED_REGIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. State / Province Selector */}
                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
                    State / Province
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="form-select"
                    style={{ height: 48, backgroundColor: 'var(--color-surface-subtle)', fontWeight: 600 }}
                  >
                    <option value="">
                      {selectedCountry ? 'All States / Provinces' : 'Select a Country first'}
                    </option>
                    {availableStates.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Search City / Keyword */}
                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
                    City or Keyword
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin
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
                      placeholder="e.g. Atlanta, Toronto, Charlotte..."
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: 42, height: 48, backgroundColor: 'var(--color-surface-subtle)' }}
                    />
                  </div>
                </div>

                {/* 4. Property Type */}
                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
                    Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="form-select"
                    style={{ height: 48, backgroundColor: 'var(--color-surface-subtle)' }}
                  >
                    <option value="all">All Types</option>
                    <option value="apartment">Apartments</option>
                    <option value="house">Houses</option>
                    <option value="townhouse">Townhouses</option>
                    <option value="duplex">Duplexes</option>
                    <option value="studio">Studios</option>
                  </select>
                </div>

                {/* 5. Search Button */}
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', height: 48, fontWeight: 700 }}
                  >
                    <Search size={18} /> Search
                  </button>
                </div>
              </div>

              {/* Interactive Quick-Select Country & State Popovers */}
              <div
                ref={popoverRef}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 14,
                  fontSize: 13,
                  position: 'relative',
                  zIndex: 70,
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--color-navy-dark)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Globe2 size={14} color="var(--color-primary)" />
                  Explore by Country & State:
                </span>

                {SUPPORTED_REGIONS.map((country) => {
                  const isOpen = activeCountryPopover === country.code;
                  return (
                    <div key={country.code} style={{ position: 'relative', zIndex: 80 }}>
                      <button
                        type="button"
                        onClick={() => setActiveCountryPopover(isOpen ? null : country.code)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isOpen ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                          color: isOpen ? '#FFFFFF' : 'var(--color-navy-dark)',
                          border: isOpen ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isOpen ? '0 4px 12px rgba(0, 102, 255, 0.25)' : 'none',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{country.flag}</span>
                        <span>{country.name}</span>
                        <span
                          style={{
                            fontSize: 11,
                            backgroundColor: isOpen ? 'rgba(255,255,255,0.25)' : 'var(--color-border)',
                            color: isOpen ? '#FFFFFF' : 'var(--color-text-secondary)',
                            padding: '1px 6px',
                            borderRadius: 10,
                            fontWeight: 800,
                          }}
                        >
                          {country.states.length} States
                        </span>
                        <ChevronDown
                          size={14}
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      </button>

                      {/* Dropdown Menu Popover */}
                      {isOpen && (
                        <div
                          className="animate-fade-in-up"
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            zIndex: 9999,
                            width: 300,
                            backgroundColor: 'var(--color-white)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.35)',
                            border: '1px solid var(--color-border)',
                            padding: '12px',
                            display: 'grid',
                            gap: 4,
                          }}
                        >
                          <div
                            style={{
                              padding: '6px 8px',
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: 'var(--color-primary)',
                              borderBottom: '1px solid var(--color-border)',
                              marginBottom: 4,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span>{country.flag} {country.name} Regions</span>
                            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Click to view</span>
                          </div>

                          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                            {country.states.map((st) => (
                              <button
                                key={st.code}
                                type="button"
                                onClick={() => handleQuickSelectState(country.code, st.name)}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '9px 10px',
                                  borderRadius: 6,
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: 'var(--color-navy-dark)',
                                  transition: 'background-color 0.15s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary-tint)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <MapPin size={13} color="var(--color-primary)" />
                                  <span>{st.name}</span>
                                </div>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: 'var(--color-text-secondary)',
                                    backgroundColor: 'var(--color-surface-subtle)',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                  }}
                                >
                                  {st.code}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURED RENTALS & CATEGORIES (Fetched Directly from Database)
          ========================================================================= */}
      <section style={{ padding: '60px 0', position: 'relative', zIndex: 1 }} className="animate-fade-in">
        <div className="page-container">
          <div className="flex-between" style={{ alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Verified Marketplace
              </span>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: 'var(--color-navy-dark)', marginTop: 4 }}>
                Explore Verified Properties
              </h2>
            </div>

            <Link href="/properties" className="btn btn-outline-primary btn-sm" style={{ display: 'inline-flex' }}>
              View all ({properties.length}) <ArrowRight size={15} />
            </Link>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              paddingBottom: 16,
              marginBottom: 24,
              scrollbarWidth: 'none',
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-full)',
                  border: activeCategory === cat.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: activeCategory === cat.id ? 'var(--color-primary)' : 'var(--color-white)',
                  color: activeCategory === cat.id ? 'white' : 'var(--color-navy-dark)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: activeCategory === cat.id ? '0 4px 10px rgba(0, 102, 255, 0.2)' : 'var(--shadow-sm)',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Responsive Grid */}
          <div className="grid-responsive-properties">
            {filteredProperties.slice(0, 8).map((property) => (
              <PropertyCard key={property.id} property={property} layout="vertical" />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          HOW BLUE SKY WORKS (Comprehensive Detailed Explanation)
          ========================================================================= */}
      <section
        id="how-it-works"
        style={{
          padding: '70px 0',
          backgroundColor: 'var(--color-white)',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-container">
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px auto' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step-by-Step Tenant Guide
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 800, marginTop: 4 }}>
              How Blue Sky Works for Tenants
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
              We've eliminated traditional rental friction, unverified landlord scams, and unnecessary paperwork with a transparent 4-stage digital journey.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 24,
            }}
          >
            {/* Step 1 */}
            <div
              className="card"
              style={{
                padding: 28,
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-primary-tint)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 800,
                  marginBottom: 20,
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--color-navy-dark)' }}>
                Discover Verified Homes
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Every single property listed on Blue Sky is verified for physical authenticity, real landlord ownership, and honest pricing. Explore detailed unit configurations, floor plans, and amenities without guesswork.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className="card"
              style={{
                padding: 28,
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#E0F2FE',
                  color: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 800,
                  marginBottom: 20,
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--color-navy-dark)' }}>
                Frictionless 6-Step Application
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Apply instantly as a guest without creating an account upfront. Fill in your personal details, current residence, employment, and upload required documents. Your tenant account is automatically provisioned and linked upon submission.
              </p>
            </div>

            {/* Step 3 */}
            <div
              className="card"
              style={{
                padding: 28,
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#DCFCE7',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 800,
                  marginBottom: 20,
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--color-navy-dark)' }}>
                Restricted ID Vault Security
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Your sensitive verification files (Government ID, Paystubs, Proof of Address) are protected in our restricted security vault. Only accredited Blue Sky compliance officers review your data within a guaranteed 24 to 48 hour window.
              </p>
            </div>

            {/* Step 4 */}
            <div
              className="card"
              style={{
                padding: 28,
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 800,
                  marginBottom: 20,
                }}
              >
                4
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--color-navy-dark)' }}>
                Live Tracking & Move-In
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Track your 4-stage application timeline in real-time. Once approved, communicate directly with the property manager, review the digital lease agreement, and prepare for move-in with complete peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOR LANDLORDS & PROPERTY MANAGERS
          ========================================================================= */}
      <section
        id="for-landlords"
        style={{
          padding: '70px 0',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-container">
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 48px auto' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              For Landlords, Agents & Property Managers
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, marginTop: 6, color: 'var(--color-navy-dark)' }}>
              How Listing a Property Works
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
              Blue Sky offers a transparent, subscription-based listing platform where verified property providers can publish unlimited properties and receive pre-screened applications directly.
            </p>
          </div>

          {/* 4-Step Listing Workflow */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 20,
              marginBottom: 40,
            }}
          >
            <div className="card" style={{ padding: 24, backgroundColor: 'var(--color-white)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--color-primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={18} color="var(--color-primary)" />
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>1. Provider Registration</h4>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Register your account as an Owner, Licensed Real Estate Agent, Property Manager, or Brokerage.
              </p>
            </div>

            <div className="card" style={{ padding: 24, backgroundColor: 'var(--color-white)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={18} color="#16A34A" />
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>2. Flexible Listing Access</h4>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Select a time-bound access period (30, 90, 180, or 365 Days). During your active period, you can list <strong>unlimited properties</strong> without per-listing listing fees.
              </p>
            </div>

            <div className="card" style={{ padding: 24, backgroundColor: 'var(--color-white)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} color="#0284C7" />
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>3. Add Units & Media</h4>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Use our 6-step property builder to add multi-unit floorplans, rents, amenities, and high-resolution photo galleries.
              </p>
            </div>

            <div className="card" style={{ padding: 24, backgroundColor: 'var(--color-white)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} color="#D97706" />
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>4. Fast Verification</h4>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Our administrative team inspects your property details within 24 hours. Once verified, your listing goes live to renters worldwide.
              </p>
            </div>
          </div>

          {/* Provider Callout Box */}
          <div
            style={{
              backgroundColor: 'var(--color-primary-tint)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px 24px',
              border: '1px solid #BAE6FD',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 8 }}>
              Ready to Publish Your Rental Inventory?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', maxWidth: 580, marginBottom: 20 }}>
              Join verified landlords and property managers worldwide. Includes automated renewal tracking and a 48-hour expiration grace window.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/provider/register" className="btn btn-primary">
                Register as a Provider <ArrowRight size={16} />
              </Link>
              <Link href="/provider/plans" className="btn btn-secondary">
                Explore Listing Access Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          EXPLORE PROPERTIES BY REGION & STATE (USA & CANADA)
          ========================================================================= */}
      <section style={{ padding: '60px 0', backgroundColor: 'var(--color-white)' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 36px auto' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Supported Jurisdictions
            </span>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, marginTop: 4, color: 'var(--color-navy-dark)' }}>
              Explore Properties by State & Province
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 6 }}>
              Browse verified residential rentals across 7 US States and 2 Canadian Provinces
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {SUPPORTED_REGIONS.flatMap((c) =>
              c.states.map((st) => ({
                countryName: c.name,
                countryCode: c.code,
                flag: c.flag,
                stateName: st.name,
                stateCode: st.code,
                cities: st.majorCities.slice(0, 2).join(', '),
              }))
            ).map((loc) => (
              <div
                key={`${loc.countryCode}-${loc.stateCode}`}
                onClick={() => router.push(`/properties?country=${loc.countryCode}&state=${encodeURIComponent(loc.stateName)}`)}
                className="card card-clickable"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 26 }}>{loc.flag}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                      {loc.stateName} ({loc.stateCode})
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {loc.countryName} • <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{loc.cities}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--color-text-muted)" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          HELP & SUPPORT ASSISTANCE
          ========================================================================= */}
      <section style={{ padding: '60px 0', backgroundColor: 'var(--color-bg)' }}>
        <div className="page-container">
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'clamp(24px, 4vw, 44px)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-tint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Headphones size={26} color="var(--color-primary)" />
            </div>

            <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, marginBottom: 8 }}>
              Need Help Finding or Applying for a Home?
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', maxWidth: 540, marginBottom: 24, lineHeight: 1.6 }}>
              Our smart assistance desk and property specialists are available to answer questions regarding tenant eligibility, documents, or provider listings.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/applicant/messages" className="btn btn-primary">
                Chat with Support Desk
              </Link>
              <Link href="/faq" className="btn btn-secondary">
                Search Help Center & FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
