import React, { useState, useEffect } from 'react';
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
  Building2,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PropertyCard } from '@/components/property/PropertyCard';
import { propertiesDb } from '@/lib/db';
import { Property } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [rentPeriod, setRentPeriod] = useState('monthly');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    async function loadData() {
      const allProps = await propertiesDb.getPublicProperties();
      setProperties(allProps);
    }
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push({
      pathname: '/properties',
      query: {
        location: searchLocation || undefined,
        type: propertyType !== 'all' ? propertyType : undefined,
      },
    });
  };

  const popularLocations = [
    { name: 'Los Angeles', country: 'United States', flag: '🇺🇸' },
    { name: 'Toronto', country: 'Canada', flag: '🇨🇦' },
    { name: 'London', country: 'United Kingdom', flag: '🇬🇧' },
    { name: 'Vancouver', country: 'Canada', flag: '🇨🇦' },
    { name: 'Austin', country: 'United States', flag: '🇺🇸' },
    { name: 'New York', country: 'United States', flag: '🇺🇸' },
  ];

  const categories = [
    { id: 'all', label: 'All Properties' },
    { id: 'apartment', label: 'Apartments' },
    { id: 'studio', label: 'Studios' },
    { id: 'townhouse', label: 'Townhouses' },
    { id: 'condo', label: 'Condos' },
    { id: 'penthouse', label: 'Penthouses' },
    { id: 'duplex', label: 'Duplexes' },
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
          padding: '70px 0 90px 0',
          backgroundImage:
            'linear-gradient(135deg, rgba(0, 102, 255, 0.90) 0%, rgba(15, 23, 42, 0.82) 50%, rgba(15, 23, 42, 0.45) 100%), url(https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1920&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#FFFFFF',
        }}
      >
        <div className="page-container" style={{ position: 'relative', zIndex: 10 }}>
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
              Verified properties. Transparent process. Peace of mind.
            </p>
          </div>

          {/* Clean White Search Card */}
          <div
            className="animate-fade-in-up"
            style={{
              maxWidth: 900,
              margin: '0 auto',
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              color: 'var(--color-navy-dark)',
            }}
          >
            <form onSubmit={handleSearch}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 14,
                  marginBottom: 16,
                }}
              >
                {/* Location */}
                <div>
                  <label className="form-label">Search Location</label>
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
                      placeholder="City, area, or address..."
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: 42, height: 48, backgroundColor: 'var(--color-surface-subtle)' }}
                    />
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <label className="form-label">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="form-select"
                    style={{ height: 48, backgroundColor: 'var(--color-surface-subtle)' }}
                  >
                    <option value="all">All Types</option>
                    <option value="apartment">Apartments</option>
                    <option value="studio">Studios</option>
                    <option value="townhouse">Townhouses</option>
                    <option value="condo">Condos</option>
                    <option value="penthouse">Penthouses</option>
                    <option value="duplex">Duplexes</option>
                  </select>
                </div>

                {/* Rent Period */}
                <div>
                  <label className="form-label">Rent Period</label>
                  <select
                    value={rentPeriod}
                    onChange={(e) => setRentPeriod(e.target.value)}
                    className="form-select"
                    style={{ height: 48, backgroundColor: 'var(--color-surface-subtle)' }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual Lease</option>
                  </select>
                </div>

                {/* Search Button */}
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', height: 48 }}
                  >
                    <Search size={18} /> Search Properties
                  </button>
                </div>
              </div>

              {/* Popular City Shortcuts */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 12,
                  fontSize: 12,
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>Popular:</span>
                {['Los Angeles', 'Toronto', 'London', 'Vancouver', 'Austin'].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setSearchLocation(city);
                      router.push(`/properties?location=${encodeURIComponent(city)}`);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURED RENTALS & CATEGORIES (Fetched Directly from Database)
          ========================================================================= */}
      <section style={{ padding: '60px 0' }} className="animate-fade-in">
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
          POPULAR CITIES SHOWCASE
          ========================================================================= */}
      <section style={{ padding: '60px 0', backgroundColor: 'var(--color-white)' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 36px auto' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
              Worldwide Metropolises
            </span>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, marginTop: 4 }}>
              Explore Properties by City
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {popularLocations.map((loc) => (
              <div
                key={loc.name}
                onClick={() => router.push(`/properties?location=${encodeURIComponent(loc.name)}`)}
                className="card card-clickable"
                style={{
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 26 }}>{loc.flag}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                      {loc.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {loc.country}
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
