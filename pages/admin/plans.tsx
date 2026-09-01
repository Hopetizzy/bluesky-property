import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Check,
  Trash2,
  Shield,
  DollarSign,
  Save,
  CheckCircle2,
  CreditCard,
  Building,
  Layers,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Info,
  Clock,
  X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { listingPlansDb } from '@/lib/db/listingPlans';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { ListingPlan, ApplicationFeeSettings, PaymentMethod, PaymentMethodType } from '@/lib/types';

export default function AdminPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ListingPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ListingPlan | null>(null);

  // Deletion Confirmation State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'plan' | 'method';
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Payment Method Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [methodId, setMethodId] = useState('');
  const [methodName, setMethodName] = useState('');
  const [methodType, setMethodType] = useState<PaymentMethodType>('bank_wire');
  const [methodCurrency, setMethodCurrency] = useState('USD');
  const [methodInstructions, setMethodInstructions] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingOrSwift, setRoutingOrSwift] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [zelleIdentifier, setZelleIdentifier] = useState('');
  const [methodIsActive, setMethodIsActive] = useState(true);

  // Application Fee Settings State (Admin Configurable)
  const [feeSettings, setFeeSettings] = useState<ApplicationFeeSettings>({
    is_enabled: true,
    amount: 50,
    currency_code: 'USD',
  });
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [feeSaveSuccess, setFeeSaveSuccess] = useState(false);

  // Form State for Create / Edit Plan
  const [planId, setPlanId] = useState('');
  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('90');
  const [price, setPrice] = useState('99');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [featuresStr, setFeaturesStr] = useState(
    'Unlimited property listings\nPriority listing verification\nFeatured listing badges\nActive for full duration'
  );

  const loadData = async () => {
    // 1. Load listing plans
    try {
      const plansList = await listingPlansDb.getAllPlansForAdmin();
      setPlans(plansList);
    } catch {
      setPlans(store.getListingPlans());
    }

    // 2. Load payment methods
    try {
      const methods = await listingPlansDb.getAllPaymentMethodsForAdmin();
      setPaymentMethods(methods);
    } catch {
      setPaymentMethods(store.getPaymentMethods());
    }

    // 3. Load application fee settings
    try {
      const res = await fetch('/api/settings/application-fee');
      const json = await res.json();
      if (json.success && json.data) {
        setFeeSettings(json.data as ApplicationFeeSettings);
        store.saveApplicationFeeSettings(json.data as ApplicationFeeSettings);
        return;
      }
    } catch (apiErr) {
      console.warn('API /api/settings/application-fee fetch note:', apiErr);
    }

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
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveFeeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFee(true);
    setFeeSaveSuccess(false);

    try {
      // 1. Save via server API endpoint (guarantees DB write into system_settings)
      try {
        await fetch('/api/settings/application-fee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feeSettings),
        });
      } catch (apiErr) {
        console.warn('API fee save note:', apiErr);
      }

      if (isSupabaseConfigured()) {
        await supabase.from('system_settings').upsert({
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

  // Plan Form Helpers
  const openCreateModal = () => {
    setEditingPlan(null);
    setPlanId(`plan-${Date.now().toString().slice(-4)}`);
    setPlanName('');
    setDescription('Standard listing access for landlords and property managers.');
    setDurationDays('90');
    setPrice('99');
    setCurrencyCode('USD');
    setIsPopular(false);
    setIsActive(true);
    setFeaturesStr('Unlimited property listings\nPriority verification\nFeatured badges\nActive for full duration');
    setIsModalOpen(true);
  };

  const openEditModal = (plan: ListingPlan) => {
    setEditingPlan(plan);
    setPlanId(plan.id);
    setPlanName(plan.name);
    setDescription(plan.description || '');
    setDurationDays(plan.duration_days.toString());
    setPrice(plan.price.toString());
    setCurrencyCode(plan.currency_code || 'USD');
    setIsPopular(plan.is_popular || false);
    setIsActive(plan.is_active ?? true);
    setFeaturesStr((plan.features || []).join('\n'));
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPlan: ListingPlan = {
      id: planId || `plan-${durationDays}-${Date.now().toString().slice(-4)}`,
      name: planName || `${durationDays} Days Listing Access`,
      description: description.trim(),
      duration_days: parseInt(durationDays, 10) || 30,
      price: parseFloat(price) || 49,
      currency_code: currencyCode || 'USD',
      is_popular: isPopular,
      is_active: isActive,
      features: featuresStr.split('\n').map((f) => f.trim()).filter((f) => f.length > 0),
      created_at: editingPlan?.created_at || new Date().toISOString(),
    };

    const saved = await listingPlansDb.savePlan(newPlan);
    setPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === newPlan.id || p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setIsModalOpen(false);
    await loadData();
  };

  // Payment Method Form Helpers
  const openCreatePaymentMethodModal = () => {
    setEditingPaymentMethod(null);
    setMethodId(`pm-${Date.now().toString().slice(-4)}`);
    setMethodName('');
    setMethodType('bank_wire');
    setMethodCurrency('USD');
    setMethodInstructions('Send payment to the official account details below and upload your transfer receipt confirmation.');
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setRoutingOrSwift('');
    setPaypalEmail('');
    setZelleIdentifier('');
    setMethodIsActive(true);
    setIsPaymentModalOpen(true);
  };

  const openEditPaymentMethodModal = (method: PaymentMethod) => {
    setEditingPaymentMethod(method);
    setMethodId(method.id);
    setMethodName(method.name);
    setMethodType(method.type);
    setMethodCurrency(method.currency_code || 'USD');
    setMethodInstructions(method.instructions || '');
    setBankName(method.bank_name || '');
    setAccountName(method.account_name || '');
    setAccountNumber(method.account_number || '');
    setRoutingOrSwift(method.routing_or_swift || '');
    setPaypalEmail(method.paypal_email || '');
    setZelleIdentifier(method.zelle_identifier || '');
    setMethodIsActive(method.is_active);
    setIsPaymentModalOpen(true);
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    const isBankType = methodType === 'bank_wire' || methodType === 'ach_transfer' || methodType === 'cashiers_check' || methodType === 'other';
    const isPayPal = methodType === 'paypal';
    const isZelle = methodType === 'zelle';

    const newMethod: PaymentMethod = {
      id: methodId || `pm-${Date.now().toString().slice(-4)}`,
      name: methodName.trim() || 'Payment Channel',
      type: methodType,
      currency_code: methodCurrency || 'USD',
      instructions: methodInstructions.trim(),
      account_name: accountName.trim() || undefined,
      account_number: isBankType ? (accountNumber.trim() || undefined) : undefined,
      routing_or_swift: isBankType ? (routingOrSwift.trim() || undefined) : undefined,
      bank_name: isBankType ? (bankName.trim() || undefined) : undefined,
      paypal_email: isPayPal ? (paypalEmail.trim() || undefined) : undefined,
      zelle_identifier: isZelle ? (zelleIdentifier.trim() || undefined) : undefined,
      is_active: methodIsActive,
    };

    const saved = await listingPlansDb.savePaymentMethod(newMethod);
    setPaymentMethods((prev) => {
      const idx = prev.findIndex((m) => m.id === newMethod.id || m.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setIsPaymentModalOpen(false);
    await loadData();
  };

  const handleTogglePaymentMethod = async (method: PaymentMethod) => {
    const updated = { ...method, is_active: !method.is_active };
    setPaymentMethods((prev) => prev.map((m) => (m.id === method.id ? updated : m)));
    await listingPlansDb.savePaymentMethod(updated);
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmTarget.type === 'plan') {
        await listingPlansDb.deletePlan(deleteConfirmTarget.id);
        setPlans((prev) => prev.filter((p) => p.id !== deleteConfirmTarget.id));
      } else {
        await listingPlansDb.deletePaymentMethod(deleteConfirmTarget.id);
        setPaymentMethods((prev) => prev.filter((m) => m.id !== deleteConfirmTarget.id));
      }
      setDeleteConfirmTarget(null);
    } catch (err: any) {
      alert(`Error deleting ${deleteConfirmTarget.type}: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout title="Plans & Application Fee Manager | Blue Sky Admin" headerTitle="Plans & Fee Manager">
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 80px 16px' }}>
        
        {/* Header Command Strip */}
        <div className="flex-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => router.push('/admin')}
              style={{
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-navy-dark)',
                width: 38,
                height: 38,
                transition: 'all 0.15s ease',
              }}
              title="Return to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em', margin: 0 }}>
                  Plans & Fee Settings
                </h1>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    backgroundColor: '#EFF6FF',
                    color: '#1E40AF',
                    padding: '2px 8px',
                    borderRadius: 12,
                    border: '1px solid #DBEAFE',
                  }}
                >
                  Commercial Controls
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2, margin: 0 }}>
                Configure provider listing access tiers, tenant screening fees, and banking channels
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            1. TENANT APPLICATION SCREENING FEE CONTROL
            ========================================================================= */}
        <div
          className="card"
          style={{
            margin: '0 0 28px 0',
            padding: 20,
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex-between" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                }}
              >
                <Shield size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  Tenant Rental Application Screening Fee
                </h2>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  Control whether applicants pay a screening fee and set the live charge amount
                </div>
              </div>
            </div>

            <Badge variant={feeSettings.is_enabled ? 'approved' : 'rejected'}>
              {feeSettings.is_enabled ? 'FEE ACTIVE' : 'FEE WAIVED'}
            </Badge>
          </div>

          <form onSubmit={handleSaveFeeSettings} style={{ marginTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
              {/* Fee Master Toggle */}
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                  Application Fee Status
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setFeeSettings({ ...feeSettings, is_enabled: true })}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: feeSettings.is_enabled ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: feeSettings.is_enabled ? '#EFF6FF' : 'var(--color-white)',
                      color: feeSettings.is_enabled ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Fee Enabled (ON)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeeSettings({ ...feeSettings, is_enabled: false })}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: !feeSettings.is_enabled ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                      backgroundColor: !feeSettings.is_enabled ? '#FEF2F2' : 'var(--color-white)',
                      color: !feeSettings.is_enabled ? '#B91C1C' : 'var(--color-navy-dark)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Waive Fee (OFF)
                  </button>
                </div>
              </div>

              {/* Fee Amount */}
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                  Fee Amount
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={feeSettings.amount}
                    onChange={(e) => setFeeSettings({ ...feeSettings, amount: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '8px 32px 8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                    required
                  />
                  <DollarSign size={15} color="var(--color-text-muted)" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {/* Currency Code */}
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                  Currency
                </label>
                <select
                  value={feeSettings.currency_code}
                  onChange={(e) => setFeeSettings({ ...feeSettings, currency_code: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 13,
                    outline: 'none',
                    backgroundColor: 'white',
                  }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>

            <div className="flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
              {feeSaveSuccess ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16A34A', fontSize: 12, fontWeight: 700 }}>
                  <CheckCircle2 size={16} /> Application fee settings updated live in database!
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Changes take effect immediately across all public property application forms.
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingFee}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Save size={14} /> {isSavingFee ? 'Saving...' : 'Save Fee Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* =========================================================================
            2. PROVIDER LISTING ACCESS PLANS LIST
            ========================================================================= */}
        <div className="flex-between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
              Provider Listing Access Plans
            </h2>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Dynamic subscription tiers for landlords & property managers
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={15} /> Create Plan
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 32 }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="card"
              style={{
                margin: 0,
                padding: 18,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-white)',
                border: plan.is_popular ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                boxShadow: plan.is_popular ? '0 4px 14px rgba(30, 64, 175, 0.08)' : 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="flex-between" style={{ marginBottom: 8, alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                      {plan.name}
                    </span>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      Duration: <strong>{plan.duration_days} Days</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-primary)' }}>
                      ${plan.price.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 4 }}>
                      {plan.currency_code || 'USD'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  {plan.is_popular && (
                    <Badge variant="info">FEATURED TIER</Badge>
                  )}
                  <Badge variant={plan.is_active ? 'approved' : 'warning'}>
                    {plan.is_active ? 'ACTIVE' : 'ARCHIVED'}
                  </Badge>
                </div>

                {plan.description && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                    {plan.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    fontSize: 12,
                    borderTop: '1px solid var(--color-surface-subtle)',
                    paddingTop: 10,
                  }}
                >
                  {(plan.features || []).map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-navy-dark)' }}>
                      <Check size={13} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--color-surface-subtle)',
                  paddingTop: 12,
                  marginTop: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget({ type: 'plan', id: plan.id, name: plan.name })}
                  className="btn btn-outline-danger btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11 }}
                  title="Delete Plan Permanently"
                >
                  <Trash2 size={12} /> Delete
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(plan)}
                  className="btn btn-outline-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Edit2 size={13} /> Edit Plan
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* =========================================================================
            3. PAYMENT METHODS & ESCROW CHANNELS
            ========================================================================= */}
        <div className="flex-between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
              Remittance Payment Methods & Channels
            </h2>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Banking and digital channels displayed on the provider subscription checkout
            </div>
          </div>
          <button
            onClick={openCreatePaymentMethodModal}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={15} /> Add Payment Method
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="card"
              style={{
                margin: 0,
                padding: 16,
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                    }}
                  >
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                      {method.name}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                      Type: {method.type.replace('_', ' ').toUpperCase()} • Currency: {method.currency_code || 'USD'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => openEditPaymentMethodModal(method)}
                    className="btn btn-outline-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 10px' }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePaymentMethod(method)}
                    className={method.is_active ? 'btn btn-outline-primary btn-sm' : 'btn btn-outline-secondary btn-sm'}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '4px 10px' }}
                  >
                    {method.is_active ? <ToggleRight size={16} color="var(--color-primary)" /> : <ToggleLeft size={16} />}
                    {method.is_active ? 'Active' : 'Inactive'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmTarget({ type: 'method', id: method.id, name: method.name })}
                    className="btn btn-outline-danger btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 8px' }}
                    title="Delete Payment Method Permanently"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                {method.instructions}
              </div>

              {/* Bank Details (Only for Wire / ACH / Checks) */}
              {(method.type === 'bank_wire' || method.type === 'ach_transfer' || method.type === 'cashiers_check' || method.type === 'other') && (method.bank_name || method.account_number || method.account_name) && (
                <div style={{ fontSize: 12, color: 'var(--color-navy-dark)', marginTop: 6, fontWeight: 600 }}>
                  {method.bank_name && <span>Bank: {method.bank_name} • </span>}
                  {method.account_name && <span>Account Holder: {method.account_name} • </span>}
                  {method.account_number && <span>Account #: {method.account_number} • </span>}
                  {method.routing_or_swift && <span>Routing/SWIFT: {method.routing_or_swift}</span>}
                </div>
              )}

              {/* PayPal Details */}
              {method.type === 'paypal' && (
                <div style={{ fontSize: 12, color: 'var(--color-navy-dark)', marginTop: 6, fontWeight: 600 }}>
                  <span>PayPal Recipient: <strong style={{ color: 'var(--color-primary)' }}>{method.paypal_email || 'Not specified'}</strong></span>
                  {method.account_name && <span style={{ marginLeft: 8 }}>• Account Holder / Business: <strong>{method.account_name}</strong></span>}
                </div>
              )}

              {/* Zelle Details */}
              {method.type === 'zelle' && (
                <div style={{ fontSize: 12, color: 'var(--color-navy-dark)', marginTop: 6, fontWeight: 600 }}>
                  <span>Zelle Recipient: <strong style={{ color: 'var(--color-primary)' }}>{method.zelle_identifier || 'Not specified'}</strong></span>
                  {method.account_name && <span style={{ marginLeft: 8 }}>• Account Holder / Name: <strong>{method.account_name}</strong></span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Permanent Deletion Warning Confirmation Modal */}
      <BottomSheet
        isOpen={!!deleteConfirmTarget}
        onClose={() => !isDeleting && setDeleteConfirmTarget(null)}
        title="Confirm Permanent Deletion"
      >
        {deleteConfirmTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
              }}
            >
              <AlertTriangle size={26} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: '#991B1B', margin: '0 0 6px 0' }}>
                  Permanent Deletion Warning
                </h4>
                <p style={{ fontSize: 13, color: '#B91C1C', margin: 0, lineHeight: 1.5 }}>
                  Are you sure you want to permanently delete{' '}
                  <strong>&quot;{deleteConfirmTarget.name}&quot;</strong>?
                </p>
                <p style={{ fontSize: 12, color: '#7F1D1D', marginTop: 8, marginBottom: 0 }}>
                  This action cannot be undone. It will permanently remove this{' '}
                  {deleteConfirmTarget.type === 'plan' ? 'listing access plan' : 'payment remittance method'} from the platform database and provider subscription checkout.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmTarget(null)}
                className="btn btn-outline"
                style={{ fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="btn btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <Trash2 size={14} />
                {isDeleting ? 'Deleting Permanently...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Create / Edit Plan Bottom Sheet Modal */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Listing Plan' : 'Create New Listing Plan'}
      >
        <form onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
              Plan Title
            </label>
            <input
              type="text"
              placeholder="e.g. 90 Days Professional Access"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 13,
                outline: 'none',
              }}
              required
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
              Description
            </label>
            <input
              type="text"
              placeholder="Brief tagline or description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                placeholder="90"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 13,
                  outline: 'none',
                }}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                Price ($ USD)
              </label>
              <input
                type="number"
                min="0"
                placeholder="99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 13,
                  outline: 'none',
                }}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
              Features (1 per line)
            </label>
            <textarea
              rows={4}
              value={featuresStr}
              onChange={(e) => setFeaturesStr(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 12,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
              />
              Mark as &quot;Featured Tier&quot;
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active on Checkout
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Save size={16} /> {editingPlan ? 'Update Plan' : 'Publish Plan'}
          </button>
        </form>
      </BottomSheet>

      {/* Create / Edit Payment Method Bottom Sheet Modal */}
      <BottomSheet
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={editingPaymentMethod ? 'Edit Payment Method' : 'Add New Payment Method'}
      >
        <form onSubmit={handleSavePaymentMethod} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
              Method Name
            </label>
            <input
              type="text"
              placeholder="e.g. JPMorgan Chase Bank Wire / ACH"
              value={methodName}
              onChange={(e) => setMethodName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 13,
                outline: 'none',
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                Channel Type
              </label>
              <select
                value={methodType}
                onChange={(e) => setMethodType(e.target.value as PaymentMethodType)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 13,
                  outline: 'none',
                  backgroundColor: 'white',
                }}
              >
                <option value="bank_wire">Bank Wire</option>
                <option value="ach_transfer">ACH Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="zelle">Zelle</option>
                <option value="interac_etransfer">Interac e-Transfer</option>
                <option value="cashiers_check">Cashier Check / Bank Draft</option>
                <option value="other">Other Escrow / Custom</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                Currency
              </label>
              <select
                value={methodCurrency}
                onChange={(e) => setMethodCurrency(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 13,
                  outline: 'none',
                  backgroundColor: 'white',
                }}
              >
                <option value="USD">USD ($)</option>
                <option value="CAD">CAD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
              Instructions for Provider
            </label>
            <textarea
              rows={3}
              placeholder="Provide clear payment instructions that will be displayed to the provider during checkout..."
              value={methodInstructions}
              onChange={(e) => setMethodInstructions(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 12,
                outline: 'none',
                fontFamily: 'inherit',
              }}
              required
            />
          </div>

          {/* Conditional Fields based on Type */}
          {(methodType === 'bank_wire' || methodType === 'ach_transfer' || methodType === 'cashiers_check' || methodType === 'other') && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. JPMorgan Chase Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Blue Sky Property LLC"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                    Account Number / IBAN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                    Routing / SWIFT / BIC
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CHASUS33XXX"
                    value={routingOrSwift}
                    onChange={(e) => setRoutingOrSwift(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {methodType === 'paypal' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                  PayPal Business Email *
                </label>
                <input
                  type="email"
                  placeholder="e.g. billing@blueskyproperty.com"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                  Account Holder / Business Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Blue Sky Management LLC"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {methodType === 'zelle' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                  Zelle Phone / Email Identifier *
                </label>
                <input
                  type="text"
                  placeholder="e.g. payments@blueskyproperty.com or +1 (555) 019-9000"
                  value={zelleIdentifier}
                  onChange={(e) => setZelleIdentifier(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                  Account Holder / Recipient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hope Enterprises"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
            <input
              type="checkbox"
              checked={methodIsActive}
              onChange={(e) => setMethodIsActive(e.target.checked)}
            />
            Active Payment Channel (Visible on Checkout)
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Save size={16} /> {editingPaymentMethod ? 'Update Payment Channel' : 'Save Payment Channel'}
          </button>
        </form>
      </BottomSheet>
    </AppLayout>
  );
}


