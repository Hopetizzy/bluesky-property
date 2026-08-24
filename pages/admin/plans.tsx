import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Plus, Edit2, Check, Sparkles, Trash2, Shield, DollarSign, Save, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { ListingPlan, ApplicationFeeSettings } from '@/lib/types';

export default function AdminPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ListingPlan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Application Fee Settings State (Admin Configurable)
  const [feeSettings, setFeeSettings] = useState<ApplicationFeeSettings>({
    is_enabled: true,
    amount: 50,
    currency_code: 'USD',
  });
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [feeSaveSuccess, setFeeSaveSuccess] = useState(false);

  // New/Edit Plan Form State
  const [planName, setPlanName] = useState('');
  const [durationDays, setDurationDays] = useState('365');
  const [price, setPrice] = useState('349');
  const [isPopular, setIsPopular] = useState(false);
  const [featuresStr, setFeaturesStr] = useState('Unlimited property listings\nTop tier search prominence\nDedicated account manager\nActive for full 365 days');

  useEffect(() => {
    async function loadData() {
      // 1. Load listing plans
      setPlans(store.getListingPlans());

      // 2. Load application fee settings
      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'application_fee')
            .maybeSingle();

          if (data?.value) {
            setFeeSettings(data.value as ApplicationFeeSettings);
            return;
          }
        } catch (err) {
          console.warn('Fee load note:', err);
        }
      }

      setFeeSettings(store.getApplicationFeeSettings());
    }

    loadData();
  }, []);

  const handleSaveFeeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFee(true);
    setFeeSaveSuccess(false);

    try {
      if (isSupabaseConfigured()) {
        await supabase
          .from('system_settings')
          .upsert({
            key: 'application_fee',
            value: feeSettings,
            updated_at: new Date().toISOString(),
          });
      }

      store.saveApplicationFeeSettings(feeSettings);
      setFeeSaveSuccess(true);
      setTimeout(() => setFeeSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error saving fee settings: ${err.message}`);
    } finally {
      setIsSavingFee(false);
    }
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlan: ListingPlan = {
      id: `plan-${durationDays}-${Date.now().toString().slice(-4)}`,
      name: planName || `${durationDays} Days Annual Access`,
      duration_days: parseInt(durationDays, 10) || 30,
      price: parseFloat(price) || 49,
      currency_code: 'USD',
      is_popular: isPopular,
      is_active: true,
      features: featuresStr.split('\n').filter((f) => f.trim().length > 0),
      created_at: new Date().toISOString(),
    };

    store.saveListingPlan(newPlan);
    setPlans(store.getListingPlans());
    setIsModalOpen(false);
    alert('Listing Access Plan saved! It is now live on the Provider payment page.');
  };

  return (
    <AppLayout title="Plans & Application Fee Manager | Blue Sky Admin" headerTitle="Plans & Fee Manager">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 80px 16px' }}>
        {/* Header */}
        <div className="flex-between" style={{ marginBottom: 20 }}>
          <button
            onClick={() => router.push('/admin')}
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
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Admin Command Center
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)' }}>Plans & Fee Control</h1>
          <div style={{ width: 40 }} />
        </div>

        {/* =========================================================================
            ADMIN APPLICATION FEE CONFIGURATION CARD (TURN ON/OFF, ADJUST PRICE)
            ========================================================================= */}
        <div
          className="card"
          style={{
            margin: '0 0 28px 0',
            padding: 24,
            borderRadius: 'var(--radius-2xl)',
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: 'var(--color-primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  Tenant Rental Application Verification Fee
                </h2>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Control whether applicants pay a screening fee and set the live charge amount
                </div>
              </div>
            </div>

            <Badge variant={feeSettings.is_enabled ? 'approved' : 'rejected'}>
              {feeSettings.is_enabled ? 'FEE ACTIVE' : 'FEE WAIVED'}
            </Badge>
          </div>

          <form onSubmit={handleSaveFeeSettings} style={{ marginTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
              {/* Fee Toggle */}
              <div className="form-group">
                <label className="form-label">Application Fee Status</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setFeeSettings({ ...feeSettings, is_enabled: true })}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: feeSettings.is_enabled ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: feeSettings.is_enabled ? 'var(--color-primary-tint)' : 'var(--color-white)',
                      color: feeSettings.is_enabled ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Fee Enabled (ON)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeeSettings({ ...feeSettings, is_enabled: false })}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: !feeSettings.is_enabled ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                      backgroundColor: !feeSettings.is_enabled ? '#FEE2E2' : 'var(--color-white)',
                      color: !feeSettings.is_enabled ? '#B91C1C' : 'var(--color-navy-dark)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Waive Fee (OFF)
                  </button>
                </div>
              </div>

              {/* Fee Amount */}
              <div className="form-group">
                <label className="form-label">Fee Amount ($ USD)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    className="form-input"
                    value={feeSettings.amount}
                    onChange={(e) => setFeeSettings({ ...feeSettings, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                  <DollarSign size={16} color="var(--color-text-muted)" style={{ position: 'absolute', right: 14, top: 14 }} />
                </div>
              </div>

              {/* Currency Code */}
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select
                  className="form-select"
                  value={feeSettings.currency_code}
                  onChange={(e) => setFeeSettings({ ...feeSettings, currency_code: e.target.value })}
                >
                  <option value="USD">USD ($)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>

            <div className="flex-between">
              {feeSaveSuccess ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontSize: 13, fontWeight: 700 }}>
                  <CheckCircle2 size={16} /> Application fee settings updated live!
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Changes take effect immediately across all property application forms.
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingFee}
                className="btn btn-primary"
                style={{ padding: '0 24px' }}
              >
                <Save size={16} /> {isSavingFee ? 'Saving...' : 'Save Fee Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* =========================================================================
            PROVIDER LISTING ACCESS PLANS LIST
            ========================================================================= */}
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
              Provider Listing Access Plans
            </h2>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Dynamic subscription tiers for landlords & property managers
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Create Plan
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {plans.map((plan) => (
            <div key={plan.id} className="card" style={{ margin: 0, padding: 20, borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)' }}>
              <div className="flex-between" style={{ marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Duration: {plan.duration_days} Days
                  </div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-primary)' }}>
                  ${plan.price.toLocaleString()}
                </div>
              </div>

              {plan.is_popular && (
                <div style={{ marginBottom: 10 }}>
                  <Badge variant="info">★ POPULAR TIER</Badge>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, borderTop: '1px solid var(--color-surface-subtle)', paddingTop: 12 }}>
                {plan.features.map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-navy-dark)' }}>
                    <Check size={14} color="var(--color-primary)" /> {feat}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Plan Bottom Sheet */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Listing Plan"
      >
        <form onSubmit={handleSavePlan}>
          <div className="form-group">
            <label className="form-label">Plan Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 1 Year Premium Unlimited"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Duration (Days)</label>
              <input
                type="number"
                className="form-input"
                placeholder="365"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Price ($ USD)</label>
              <input
                type="number"
                className="form-input"
                placeholder="349"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Features (1 per line)</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={featuresStr}
              onChange={(e) => setFeaturesStr(e.target.value)}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
            />
            Mark as "Popular" badge
          </label>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Publish Plan
          </button>
        </form>
      </BottomSheet>
    </AppLayout>
  );
}
