import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Shield,
  ShieldCheck,
  CreditCard,
  Layers,
  MapPin,
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { propertiesDb } from '@/lib/db/properties';
import { listingPlansDb } from '@/lib/db/listingPlans';
import { Property, ProviderListingPeriod, Profile, ProviderProfile } from '@/lib/types';

export default function ProviderDashboardPage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [listingPeriod, setListingPeriod] = useState<ProviderListingPeriod | null>(null);
  const [displayName, setDisplayName] = useState<string>('Property Partner');
  const [applicationsCount, setApplicationsCount] = useState<number>(0);

  const loadProviderData = async () => {
    setIsLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // 1. Fetch user profile
          const { data: userProf } = await supabase
            .from('profiles')
            .select('*')
            .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
            .maybeSingle();

          if (userProf) {
            setProfile(userProf);
            setDisplayName(userProf.full_name || user.email?.split('@')[0] || 'Property Partner');
          } else {
            setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Property Partner');
          }

          // 2. Fetch provider profile
          const profileId = userProf?.id;
          let provProf: any = null;

          if (profileId) {
            const { data: provData } = await supabase
              .from('provider_profiles')
              .select('*')
              .eq('profile_id', profileId)
              .maybeSingle();
            provProf = provData;
          }

          if (!provProf && user.email) {
            // Check by matching profiles
            const { data: fallbackProv } = await supabase
              .from('provider_profiles')
              .select('*, profiles!inner(email)')
              .eq('profiles.email', user.email)
              .maybeSingle();
            provProf = fallbackProv;
          }

          if (provProf) {
            setProviderProfile(provProf);
            if (provProf.company_name) {
              setDisplayName(provProf.company_name);
            }
          }

          const providerId = provProf?.id || profileId || 'prov-1';

          // 3. Fetch active listing period
          const period = await listingPlansDb.getProviderActivePeriod(providerId);
          setListingPeriod(period);

          // 4. Fetch provider's properties
          const providerProps = await propertiesDb.getPropertiesByProvider(providerId);
          setProperties(providerProps);

          // 5. Fetch count of applications for these properties
          if (providerProps.length > 0) {
            const propIds = providerProps.map((p) => p.id);
            const { count } = await supabase
              .from('rental_applications')
              .select('id', { count: 'exact', head: true })
              .in('property_id', propIds);
            setApplicationsCount(count || 0);
          } else {
            setApplicationsCount(0);
          }
        } else {
          // Fallback to demo local store if unauthenticated
          loadFromLocalStore();
        }
      } else {
        // Supabase not configured -> Local store fallback
        loadFromLocalStore();
      }
    } catch (err) {
      console.warn('Provider dashboard fetch error, using local fallback:', err);
      loadFromLocalStore();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromLocalStore = () => {
    const allProps = store.getProperties();
    // In local demo mode, show provider properties
    const provProps = allProps.filter((p) => p.provider_id === 'prov-1' || !p.is_admin_direct);
    setProperties(provProps);

    const periods = store.getListingPeriods();
    if (periods.length > 0) {
      setListingPeriod(periods[0]);
    }

    const apps = store.getApplications();
    const propIds = new Set(provProps.map((p) => p.id));
    setApplicationsCount(apps.filter((a) => propIds.has(a.property_id)).length);

    setDisplayName('Pacific Heights Realty LLC');
  };

  useEffect(() => {
    loadProviderData();
  }, []);

  // Compute live portfolio metrics
  const totalProps = properties.length;
  const published = properties.filter((p) => p.status === 'approved').length;
  const pending = properties.filter((p) => p.status === 'pending_verification').length;
  const rejected = properties.filter((p) => p.status === 'rejected').length;
  const draft = properties.filter((p) => p.status === 'draft').length;

  // Compute remaining listing access duration
  const now = new Date().getTime();
  const expiresAtTime = listingPeriod ? new Date(listingPeriod.expires_at).getTime() : 0;
  const graceWindowMs = (listingPeriod?.grace_period_hours || 48) * 3600 * 1000;
  const effectiveExpiry = expiresAtTime + graceWindowMs;
  const isPeriodActive = listingPeriod ? effectiveExpiry > now && listingPeriod.status === 'active' : false;

  const msRemaining = Math.max(0, expiresAtTime - now);
  const daysRemaining = Math.floor(msRemaining / (1000 * 3600 * 24));
  const hoursRemaining = Math.floor((msRemaining % (1000 * 3600 * 24)) / (1000 * 3600));

  const isGraceActive = msRemaining === 0 && effectiveExpiry > now;

  return (
    <AppLayout title="Provider Dashboard | Blue Sky Property" headerTitle="Provider Portal">
      <div style={{ padding: '20px 16px 80px 16px', maxWidth: 1000, margin: '0 auto' }}>
        {/* Loading State */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
            <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
            <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Loading your provider portfolio...</span>
          </div>
        ) : (
          <>
            {/* Header Greeting & Business Info */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Listing Provider Command Center
                  </span>
                  {providerProfile?.verification_status === 'verified' && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--color-success)',
                        backgroundColor: '#DCFCE7',
                        padding: '2px 8px',
                        borderRadius: 100,
                      }}
                    >
                      <ShieldCheck size={12} /> Verified
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  {displayName}
                </h1>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  {providerProfile?.provider_type
                    ? `${providerProfile.provider_type.replace('_', ' ').toUpperCase()} • Worldwide Real Estate Partner`
                    : 'Real Estate Management & Listings Partner'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={loadProviderData}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  title="Refresh data"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
                <Link
                  href="/provider/properties/new"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <PlusCircle size={14} /> + New Listing
                </Link>
              </div>
            </div>

            {/* Listing Access Status Banner */}
            <div
              style={{
                backgroundColor: isPeriodActive ? '#FFFFFF' : '#FFFBEB',
                border: isPeriodActive ? '2px solid #BAE6FD' : '2px solid #FDE68A',
                borderRadius: 'var(--radius-xl)',
                padding: '22px 20px',
                marginBottom: 24,
                boxShadow: 'var(--shadow-card)',
                background: isPeriodActive
                  ? 'linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%)'
                  : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
              }}
            >
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={18} color={isPeriodActive ? 'var(--color-primary)' : '#D97706'} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Listing Access Tier
                  </span>
                </div>
                <Badge variant={isPeriodActive ? 'active' : isGraceActive ? 'expiring' : 'expired'}>
                  {isPeriodActive
                    ? 'ACTIVE ACCESS'
                    : isGraceActive
                    ? '48H GRACE WINDOW'
                    : 'ACCESS EXPIRED'}
                </Badge>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  {isPeriodActive ? (
                    <>
                      <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1 }}>
                        {daysRemaining} <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-navy-dark)' }}>days</span>{' '}
                        {hoursRemaining} <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-navy-dark)' }}>hrs remaining</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                        Valid through {new Date(listingPeriod!.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} (includes +48h grace safety window)
                      </div>
                    </>
                  ) : isGraceActive ? (
                    <>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', lineHeight: 1.2 }}>
                        Grace Period Active
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                        Your listing access expired, but your listings remain live during the 48-hour grace window. Renew now to avoid delisting.
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-danger)', lineHeight: 1.2 }}>
                        No Active Listing Access
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                        Activate a listing plan to publish properties worldwide and accept tenant applications.
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Link
                    href="/provider/plans"
                    className={isPeriodActive ? 'btn btn-primary btn-sm' : 'btn btn-primary'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0 18px',
                      height: 42,
                      boxShadow: '0 4px 12px rgba(14, 116, 144, 0.2)',
                    }}
                  >
                    <RefreshCw size={14} /> {isPeriodActive ? 'Renew / Extend Access' : 'Choose a Listing Plan'}
                  </Link>
                </div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: isPeriodActive ? '#0369A1' : '#92400E',
                  borderTop: isPeriodActive ? '1px solid #E0F2FE' : '1px solid #FDE68A',
                  paddingTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={14} />
                <span>
                  Active access permits <strong>unlimited property listings</strong>, high-res photo uploads, and zero per-listing commission fees.
                </span>
              </div>
            </div>

            {/* Quick Portfolio Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <div className="card" style={{ margin: 0, padding: '14px 12px', textAlign: 'center', borderTop: '3px solid var(--color-primary)' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-navy-dark)' }}>{totalProps}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginTop: 2, textTransform: 'uppercase' }}>
                  Total Listings
                </div>
              </div>

              <div className="card" style={{ margin: 0, padding: '14px 12px', textAlign: 'center', borderTop: '3px solid var(--color-success)' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-success)' }}>{published}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginTop: 2, textTransform: 'uppercase' }}>
                  Live & Approved
                </div>
              </div>

              <div className="card" style={{ margin: 0, padding: '14px 12px', textAlign: 'center', borderTop: '3px solid var(--color-warning)' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-warning)' }}>{pending}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginTop: 2, textTransform: 'uppercase' }}>
                  Under Review
                </div>
              </div>

              <div className="card" style={{ margin: 0, padding: '14px 12px', textAlign: 'center', borderTop: '3px solid var(--color-danger)' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-danger)' }}>{rejected}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginTop: 2, textTransform: 'uppercase' }}>
                  Action Needed
                </div>
              </div>

              <div className="card" style={{ margin: 0, padding: '14px 12px', textAlign: 'center', borderTop: '3px solid #6366F1' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#6366F1' }}>{applicationsCount}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginTop: 2, textTransform: 'uppercase' }}>
                  Applications
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 10,
                marginBottom: 28,
              }}
            >
              <Link
                href="/provider/properties/new"
                className="btn btn-primary"
                style={{
                  height: 48,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <PlusCircle size={18} /> + Add New Property
              </Link>

              <Link
                href="/provider/properties"
                className="btn btn-outline"
                style={{
                  height: 48,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: 'var(--color-white)',
                }}
              >
                <Building2 size={18} /> Manage All Properties
              </Link>

              <Link
                href="/provider/plans"
                className="btn btn-outline"
                style={{
                  height: 48,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: 'var(--color-white)',
                }}
              >
                <CreditCard size={18} /> Listing Plans
              </Link>

              <Link
                href="/provider/payments"
                className="btn btn-outline"
                style={{
                  height: 48,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: 'var(--color-white)',
                }}
              >
                <RefreshCw size={18} /> Payment History
              </Link>
            </div>

            {/* Recent Properties Section */}
            <div>
              <div className="flex-between" style={{ marginBottom: 14 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                    Your Property Portfolio
                  </h2>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Track live status, admin verification feedback, and applicant activity
                  </span>
                </div>
                <Link
                  href="/provider/properties"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  View all ({totalProps}) <ChevronRight size={16} />
                </Link>
              </div>

              {properties.length === 0 ? (
                /* Empty state */
                <div
                  className="card"
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    border: '2px dashed var(--color-border)',
                    backgroundColor: '#FAFAFA',
                  }}
                >
                  <Building2 size={44} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 6 }}>
                    No properties listed yet
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 420, margin: '0 auto 20px auto' }}>
                    Publish your first property to start receiving verified rental applications worldwide.
                  </p>
                  <Link href="/provider/properties/new" className="btn btn-primary" style={{ display: 'inline-flex', gap: 6 }}>
                    <PlusCircle size={16} /> Create First Listing
                  </Link>
                </div>
              ) : (
                /* Dynamic Property Cards List */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {properties.slice(0, 5).map((prop) => {
                    const primaryImage =
                      prop.images && prop.images.length > 0
                        ? prop.images.find((img) => img.is_primary)?.storage_path || prop.images[0].storage_path
                        : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80';

                    const startingRent =
                      prop.units && prop.units.length > 0
                        ? Math.min(...prop.units.map((u) => u.rent_amount))
                        : null;
                    const currency = prop.units?.[0]?.currency_code || 'USD';

                    return (
                      <Link
                        key={prop.id}
                        href={`/provider/properties/${prop.id}/status`}
                        className="card-hover"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          padding: 14,
                          borderRadius: 'var(--radius-lg)',
                          backgroundColor: 'var(--color-white)',
                          border: '1px solid var(--color-border)',
                          boxShadow: 'var(--shadow-card)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
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
                            width: 72,
                            height: 72,
                            borderRadius: 'var(--radius-md)',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <div
                              style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: 'var(--color-navy-dark)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {prop.title}
                            </div>
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--color-text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              marginBottom: 6,
                            }}
                          >
                            <MapPin size={12} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {prop.street_address ? `${prop.street_address}, ` : ''}{prop.city}, {prop.state_province} ({prop.country_code})
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                                ? 'LIVE & PUBLISHED'
                                : prop.status === 'pending_verification'
                                ? 'IN REVIEW'
                                : prop.status === 'rejected'
                                ? 'CHANGES NEEDED'
                                : prop.status.replace('_', ' ').toUpperCase()}
                            </Badge>

                            {startingRent && (
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
                                {currency} ${startingRent.toLocaleString()}/mo
                              </span>
                            )}

                            {prop.units && prop.units.length > 0 && (
                              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                • {prop.units.length} unit{prop.units.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }} className="hide-mobile">
                            Audit Status
                          </span>
                          <ChevronRight size={18} color="var(--color-text-muted)" />
                        </div>
                      </Link>
                    );
                  })}

                  {properties.length > 5 && (
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                      <Link href="/provider/properties" className="btn btn-outline btn-sm">
                        View All {properties.length} Properties
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
