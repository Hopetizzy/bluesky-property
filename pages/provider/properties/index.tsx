import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  PlusCircle,
  ChevronRight,
  Building2,
  MapPin,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Home,
  DollarSign,
  Layers,
  Filter,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { propertiesDb } from '@/lib/db/properties';
import { Property, PropertyStatus } from '@/lib/types';

type FilterTab = 'all' | 'approved' | 'pending_verification' | 'rejected' | 'draft';

export default function ProviderPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'title'>('newest');

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
            .maybeSingle();

          let providerId = profile?.id;

          if (profile?.id) {
            const { data: provProf } = await supabase
              .from('provider_profiles')
              .select('id')
              .eq('profile_id', profile.id)
              .maybeSingle();
            if (provProf?.id) providerId = provProf.id;
          }

          if (providerId) {
            const list = await propertiesDb.getPropertiesByProvider(providerId);
            setProperties(list);
            return;
          }
        }
      }

      // Offline / Demo Fallback
      const allProps = store.getProperties();
      setProperties(allProps.filter((p) => p.provider_id === 'prov-1' || !p.is_admin_direct));
    } catch (err) {
      console.warn('Error loading provider properties:', err);
      const allProps = store.getProperties();
      setProperties(allProps.filter((p) => p.provider_id === 'prov-1' || !p.is_admin_direct));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // Compute count per tab
  const counts = useMemo(() => {
    return {
      all: properties.length,
      approved: properties.filter((p) => p.status === 'approved').length,
      pending_verification: properties.filter((p) => p.status === 'pending_verification').length,
      rejected: properties.filter((p) => p.status === 'rejected').length,
      draft: properties.filter((p) => p.status === 'draft').length,
    };
  }, [properties]);

  // Filter & Sort properties
  const filteredProperties = useMemo(() => {
    return properties
      .filter((p) => {
        // Tab filter
        if (activeTab !== 'all' && p.status !== activeTab) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title?.toLowerCase().includes(q);
          const matchCity = p.city?.toLowerCase().includes(q);
          const matchState = p.state_province?.toLowerCase().includes(q);
          const matchAddress = p.street_address?.toLowerCase().includes(q);
          const matchCountry = p.country_name?.toLowerCase().includes(q);
          return matchTitle || matchCity || matchState || matchAddress || matchCountry;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
        if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }
        const aRent = a.units && a.units.length > 0 ? Math.min(...a.units.map((u) => u.rent_amount)) : 0;
        const bRent = b.units && b.units.length > 0 ? Math.min(...b.units.map((u) => u.rent_amount)) : 0;
        if (sortBy === 'price_asc') return aRent - bRent;
        if (sortBy === 'price_desc') return bRent - aRent;
        return 0;
      });
  }, [properties, activeTab, searchQuery, sortBy]);

  return (
    <AppLayout title="Property Portfolio | Blue Sky Provider" headerTitle="My Properties">
      <div style={{ padding: '20px 16px 80px 16px', maxWidth: 1000, margin: '0 auto' }}>
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => router.push('/provider')}
              className="btn btn-outline btn-sm"
              style={{
                width: 38,
                height: 38,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
              }}
              title="Back to Overview"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                My Listings Portfolio
              </h1>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {properties.length} total propert{properties.length === 1 ? 'y' : 'ies'} registered
              </span>
            </div>
          </div>

          <Link
            href="/provider/properties/new"
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 42,
              padding: '0 18px',
              fontSize: 14,
            }}
          >
            <PlusCircle size={18} /> + Add New Property
          </Link>
        </div>

        {/* Search Bar & Sort Row */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 240,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={18}
              color="var(--color-text-muted)"
              style={{ position: 'absolute', left: 14, pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder="Search by property title, street, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 44,
                paddingLeft: 42,
                paddingRight: 14,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-white)',
                fontSize: 14,
                outline: 'none',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  background: 'none',
                  border: 'none',
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                height: 44,
                padding: '0 12px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-white)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-navy-dark)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="price_asc">Rent: Low to High</option>
              <option value="price_desc">Rent: High to Low</option>
              <option value="title">Title: A - Z</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs with Dynamic Counts */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#EEF2F6',
            padding: 4,
            borderRadius: 'var(--radius-lg)',
            marginBottom: 20,
            overflowX: 'auto',
            gap: 4,
          }}
        >
          {(
            [
              { id: 'all', label: 'All Listings', count: counts.all },
              { id: 'approved', label: 'Live & Published', count: counts.approved },
              { id: 'pending_verification', label: 'Under Review', count: counts.pending_verification },
              { id: 'rejected', label: 'Changes Needed', count: counts.rejected },
              { id: 'draft', label: 'Drafts', count: counts.draft },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                style={{
                  flex: 1,
                  minWidth: 100,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--color-white)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 100,
                    backgroundColor: isActive ? 'var(--color-primary-light)' : '#E2E8F0',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
            <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
            <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Loading your properties...</span>
          </div>
        ) : filteredProperties.length === 0 ? (
          /* Empty Filter State */
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-xl)',
              border: '2px dashed var(--color-border)',
            }}
          >
            <Building2 size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 6 }}>
              {searchQuery ? 'No matching properties found' : `No properties in "${activeTab.replace('_', ' ')}"`}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 440, margin: '0 auto 20px auto' }}>
              {searchQuery
                ? `No properties matched your search for "${searchQuery}". Try searching with different keywords.`
                : 'Create and submit a new property to have it verified by our compliance team and published globally.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} className="btn btn-outline btn-sm">
                  Clear Search
                </button>
              ) : (
                <Link href="/provider/properties/new" className="btn btn-primary" style={{ display: 'inline-flex', gap: 6 }}>
                  <PlusCircle size={16} /> Add New Property
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Properties Cards List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredProperties.map((prop) => {
              const primaryImage =
                prop.images && prop.images.length > 0
                  ? prop.images.find((img) => img.is_primary)?.storage_path || prop.images[0].storage_path
                  : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80';

              const startingRent =
                prop.units && prop.units.length > 0
                  ? Math.min(...prop.units.map((u) => u.rent_amount))
                  : null;
              const currency = prop.units?.[0]?.currency_code || 'USD';
              const unitCount = prop.units?.length || 0;

              return (
                <div
                  key={prop.id}
                  style={{
                    backgroundColor: 'var(--color-white)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-card)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Thumbnail */}
                    <img
                      src={primaryImage}
                      alt={prop.title}
                      onError={(e) => {
                        (e.target as HTMLElement).setAttribute(
                          'src',
                          'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80'
                        );
                      }}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 'var(--radius-lg)',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />

                    {/* Property Info */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Badge
                          variant={
                            prop.status === 'approved'
                              ? 'published'
                              : prop.status === 'rejected'
                              ? 'rejected'
                              : prop.status === 'draft'
                              ? 'info'
                              : 'pending'
                          }
                        >
                          {prop.status === 'approved'
                            ? 'LIVE & APPROVED'
                            : prop.status === 'pending_verification'
                            ? 'PENDING REVIEW'
                            : prop.status === 'rejected'
                            ? 'CHANGES REQUIRED'
                            : prop.status.replace('_', ' ').toUpperCase()}
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
                          {prop.property_type.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-navy-dark)', margin: '4px 0 6px 0', lineHeight: 1.3 }}>
                        {prop.title}
                      </h3>

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
                          {prop.street_address ? `${prop.street_address}, ` : ''}{prop.city}, {prop.state_province} {prop.postal_code || ''} ({prop.country_name || prop.country_code})
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        {startingRent && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>From:</span>
                            <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--color-primary)' }}>
                              {currency} ${startingRent.toLocaleString()}/mo
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          <Layers size={13} />
                          <span>{unitCount} {unitCount === 1 ? 'Unit' : 'Units'} Configured</span>
                        </div>

                        {prop.created_at && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            <Clock size={12} />
                            <span>Added {new Date(prop.created_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verification Note Alert if Rejected */}
                  {prop.status === 'rejected' && prop.verification_notes && (
                    <div
                      style={{
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        fontSize: 12,
                        color: '#991B1B',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}
                    >
                      <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <strong>Compliance Feedback:</strong> {prop.verification_notes}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Footer */}
                  <div
                    style={{
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      ID: <span style={{ fontFamily: 'monospace' }}>{prop.id.slice(0, 8)}...</span>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {prop.status === 'approved' && prop.slug && (
                        <Link
                          href={`/properties/${prop.slug}`}
                          target="_blank"
                          className="btn btn-outline btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                        >
                          <ExternalLink size={13} /> View Live Listing
                        </Link>
                      )}

                      <Link
                        href={`/provider/properties/${prop.id}/status`}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                      >
                        Audit Status & Details <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
