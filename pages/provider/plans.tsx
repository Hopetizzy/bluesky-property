import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Building2,
  CheckCircle2,
  Zap,
  Clock,
  AlertCircle,
  CreditCard,
  FileText,
  RefreshCw,
  Receipt,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { listingPlansDb } from '@/lib/db/listingPlans';
import { ListingPlan, ProviderListingPeriod, ProviderPayment, ProviderProfile } from '@/lib/types';

export default function ListingPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ListingPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [currentPeriod, setCurrentPeriod] = useState<ProviderListingPeriod | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<ProviderPayment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    setFetchError('');

    try {
      // 1. Fetch active listing plans
      const activePlans = await listingPlansDb.getActivePlans();
      setPlans(activePlans);

      if (activePlans.length > 0) {
        const defaultPlan = activePlans.find((p) => p.is_popular) || activePlans[0];
        setSelectedPlanId(defaultPlan.id);
      }

      // 2. Fetch authenticated provider's current status and billing history
      if (isSupabaseConfigured()) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
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
            const period = await listingPlansDb.getProviderActivePeriod(providerId);
            setCurrentPeriod(period);

            const payments = await listingPlansDb.getProviderPayments(providerId);
            setPaymentHistory(payments);
            return;
          }
        }
      }

      // Fallback
      const periods = store.getListingPeriods();
      if (periods.length > 0) setCurrentPeriod(periods[0]);
      setPaymentHistory(store.getProviderPayments());
    } catch (err: any) {
      console.warn('Error loading plans data:', err);
      setFetchError(err.message || 'Unable to load listing plans from database.');
      const fallbackPlans = store.getListingPlans().filter((p) => p.is_active);
      setPlans(fallbackPlans);
      if (fallbackPlans.length > 0) {
        const defaultPlan = fallbackPlans.find((p) => p.is_popular) || fallbackPlans[0];
        setSelectedPlanId(defaultPlan.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleContinue = (planIdToUse?: string) => {
    const targetId = planIdToUse || selectedPlanId;
    if (!targetId) return;
    router.push(`/provider/payment?planId=${encodeURIComponent(targetId)}`);
  };

  const getCurrencySymbol = (code: string) => {
    switch (code?.toUpperCase()) {
      case 'USD':
        return '$';
      case 'CAD':
        return 'CA$';
      case 'GBP':
        return '£';
      case 'EUR':
        return '€';
      case 'AUD':
        return 'AU$';
      default:
        return '$';
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Compute active status
  const now = new Date().getTime();
  const expiresAt = currentPeriod ? new Date(currentPeriod.expires_at).getTime() : 0;
  const graceWindow = (currentPeriod?.grace_period_hours || 48) * 3600 * 1000;
  const isPeriodActive = currentPeriod ? expiresAt + graceWindow > now && currentPeriod.status === 'active' : false;
  const daysLeft = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 3600 * 24)));

  return (
    <AppLayout title="Listing Access Plans | Blue Sky Provider" isPublic={true}>
      <div
        style={{
          minHeight: 'calc(100vh - 160px)',
          background: 'linear-gradient(180deg, var(--color-surface-subtle) 0%, var(--color-bg) 100%)',
          padding: '24px 16px 120px 16px',
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          {/* Top Bar Navigation */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button
                onClick={() => router.push('/provider')}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  color: 'var(--color-navy-dark)',
                  backgroundColor: 'var(--color-white)',
                  fontSize: 13,
                  fontWeight: 700,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </button>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 9999,
                  backgroundColor: 'var(--color-primary-tint)',
                  color: 'var(--color-primary)',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                <ShieldCheck size={16} /> Verified Landlord & Provider Access
              </div>
            </div>

            <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
              <h1
                style={{
                  fontSize: 'clamp(24px, 4vw, 34px)',
                  fontWeight: 900,
                  color: 'var(--color-navy-dark)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                Choose Your Listing Access Plan
              </h1>
              <p
                style={{
                  fontSize: 'clamp(13px, 2vw, 15px)',
                  color: 'var(--color-text-secondary)',
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                Unlock global placement, instant applicant verification, and list <strong>unlimited properties</strong> worldwide with zero broker commissions.
              </p>
            </div>
          </div>

          {/* Current Active Plan Status Banner */}
          {currentPeriod && (
            <div
              style={{
                backgroundColor: isPeriodActive ? '#FFFFFF' : '#FFFBEB',
                border: isPeriodActive ? '2px solid #BAE6FD' : '2px solid #FDE68A',
                borderRadius: 'var(--radius-xl)',
                padding: '18px 20px',
                marginBottom: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Clock size={24} color={isPeriodActive ? 'var(--color-primary)' : '#D97706'} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                    Current Status: {isPeriodActive ? `Active Access (${daysLeft} days remaining)` : 'Access Expired'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Expires {new Date(currentPeriod.expires_at).toLocaleDateString()} (Includes +48h grace safety window)
                  </div>
                </div>
              </div>

              <Badge variant={isPeriodActive ? 'active' : 'expired'}>
                {isPeriodActive ? '🟢 ACTIVE ACCESS' : '🔴 EXPIRED'}
              </Badge>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                gap: 12,
                color: 'var(--color-text-secondary)',
              }}
            >
              <Loader2 size={36} className="animate-spin" color="var(--color-primary)" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Loading active database plans...</span>
            </div>
          )}

          {/* Error Message */}
          {!isLoading && fetchError && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger-text)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 24,
                maxWidth: 600,
                margin: '0 auto 24px auto',
              }}
            >
              <AlertCircle size={16} />
              <span>{fetchError}</span>
            </div>
          )}

          {/* Responsive Plans Grid */}
          {!isLoading && plans.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  plans.length === 1
                    ? '1fr'
                    : plans.length === 2
                    ? 'repeat(auto-fit, minmax(280px, 1fr))'
                    : plans.length === 3
                    ? 'repeat(auto-fit, minmax(260px, 1fr))'
                    : 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 20,
                alignItems: 'stretch',
                marginBottom: 36,
              }}
            >
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const currencySymbol = getCurrencySymbol(plan.currency_code);

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '28px 22px',
                      borderRadius: 'var(--radius-2xl)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary-tint)' : 'var(--color-white)',
                      boxShadow: isSelected ? '0 12px 28px rgba(14, 165, 233, 0.15)' : '0 4px 14px rgba(0, 0, 0, 0.04)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    {/* Most Popular Badge */}
                    {plan.is_popular && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -12,
                          right: 18,
                          backgroundColor: 'var(--color-primary)',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '4px 12px',
                          borderRadius: 9999,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          boxShadow: '0 4px 10px rgba(14, 165, 233, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Sparkles size={12} /> Most Popular
                      </span>
                    )}

                    <div>
                      {/* Duration & Plan Header */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-navy-dark)', letterSpacing: '-0.03em' }}>
                          {plan.duration_days}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Days Access
                        </span>
                      </div>

                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 6 }}>
                        {plan.name}
                      </h3>

                      {plan.description && (
                        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.4 }}>
                          {plan.description}
                        </p>
                      )}

                      {/* Price Display */}
                      <div
                        style={{
                          padding: '12px 14px',
                          backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.7)' : 'var(--color-surface-subtle)',
                          borderRadius: 'var(--radius-lg)',
                          marginBottom: 18,
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', verticalAlign: 'top', marginRight: 2 }}>
                            {currencySymbol}
                          </span>
                          <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em' }}>
                            {plan.price.toLocaleString()}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginLeft: 4 }}>
                            {plan.currency_code}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          one-time fee
                        </span>
                      </div>

                      {/* Features Checklist */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        {plan.features.map((feature, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--color-navy-dark)', lineHeight: 1.4 }}>
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                backgroundColor: isSelected ? 'var(--color-primary)' : 'rgba(14, 165, 233, 0.15)',
                                color: isSelected ? '#FFFFFF' : 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: 1,
                              }}
                            >
                              <Check size={11} strokeWidth={3} />
                            </div>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContinue(plan.id);
                      }}
                      className={isSelected ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{
                        width: '100%',
                        height: 42,
                        fontSize: 13,
                        fontWeight: 700,
                        marginTop: 12,
                      }}
                    >
                      {isSelected ? (
                        <>Selected & Proceed <ArrowRight size={15} /></>
                      ) : (
                        'Select Plan'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Payment Receipts & Invoice History */}
          {paymentHistory.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--color-white)',
                borderRadius: 'var(--radius-2xl)',
                border: '1px solid var(--color-border)',
                padding: '24px 20px',
                boxShadow: 'var(--shadow-card)',
                marginBottom: 32,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Receipt size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  Billing & Payment Proof History
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {paymentHistory.map((pmt) => (
                  <div
                    key={pmt.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid var(--color-border)',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                        {pmt.listing_plan_name || 'Listing Access Plan'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {pmt.payment_method_name || 'Direct Transfer'} • Submitted {new Date(pmt.submitted_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                        {pmt.currency_code} ${pmt.amount.toLocaleString()}
                      </span>

                      <Badge
                        variant={
                          pmt.status === 'verified'
                            ? 'published'
                            : pmt.status === 'rejected'
                            ? 'rejected'
                            : 'pending'
                        }
                      >
                        {pmt.status === 'verified'
                          ? '✓ VERIFIED'
                          : pmt.status === 'rejected'
                          ? '⚠️ REJECTED'
                          : '⏳ REVIEW PENDING'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grace Period & Information Note */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
              maxWidth: 720,
              margin: '0 auto',
            }}
          >
            <Clock size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Includes 48-Hour Grace Period:</strong> Properties stay actively listed throughout your duration. When access ends, listings are gracefully preserved in your archive until renewed.
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar for Mobile & Quick Checkout */}
      {selectedPlan && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid var(--color-border)',
            padding: '12px 16px',
            zIndex: 100,
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div
            style={{
              maxWidth: 1120,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Selected Plan
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                  {selectedPlan.name}
                </span>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-primary)' }}>
                  {getCurrencySymbol(selectedPlan.currency_code)}{selectedPlan.price.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleContinue()}
              className="btn btn-primary btn-lg"
              style={{ padding: '10px 24px', fontSize: 14 }}
            >
              Continue to Payment <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
