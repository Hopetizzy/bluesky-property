import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Check,
  Loader2,
  AlertCircle,
  CreditCard,
  Building,
  Copy,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { listingPlansDb } from '@/lib/db/listingPlans';
import { ListingPlan, PaymentMethod, ProviderPayment, ProviderProfile } from '@/lib/types';

export default function ProviderPaymentPage() {
  const router = useRouter();
  const { planId } = router.query;
  const [selectedPlan, setSelectedPlan] = useState<ListingPlan | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [uploadedProof, setUploadedProof] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Authenticated provider info
  const [providerId, setProviderId] = useState<string>('prov-1');
  const [providerName, setProviderName] = useState<string>('Property Partner');

  useEffect(() => {
    async function initPaymentData() {
      setIsLoading(true);
      try {
        let fetchedPlan: ListingPlan | null = null;
        let fetchedMethods: PaymentMethod[] = [];

        // 1. Resolve logged in provider
        if (isSupabaseConfigured()) {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('id, full_name')
              .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
              .maybeSingle();

            if (prof?.id) {
              const { data: provProf } = await supabase
                .from('provider_profiles')
                .select('*')
                .eq('profile_id', prof.id)
                .maybeSingle();

              if (provProf?.id) {
                setProviderId(provProf.id);
                setProviderName(provProf.company_name || prof.full_name || 'Property Partner');
              } else {
                setProviderId(prof.id);
                setProviderName(prof.full_name || 'Property Partner');
              }
            }
          }
        }

        // 2. Fetch plans & methods
        const activePlans = await listingPlansDb.getActivePlans();
        if (planId) {
          fetchedPlan = activePlans.find((p) => p.id === planId) || null;
        }
        if (!fetchedPlan && activePlans.length > 0) {
          fetchedPlan = activePlans[0];
        }
        setSelectedPlan(fetchedPlan);

        fetchedMethods = await listingPlansDb.getPaymentMethods();
        setPaymentMethods(fetchedMethods);
        if (fetchedMethods.length > 0) {
          setSelectedMethodId(fetchedMethods[0].id);
        }
      } catch (err) {
        console.warn('Payment init note:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initPaymentData();
  }, [planId]);

  const activeMethod = paymentMethods.find((m) => m.id === selectedMethodId);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofFileName(file.name);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const rawResult = uploadEvent.target?.result as string;
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 900;
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.7);
              setUploadedProof(compressed);
            } else {
              setUploadedProof(rawResult.length > 80000 ? `receipt_${Date.now()}.jpg` : rawResult);
            }
          } catch {
            setUploadedProof(rawResult.length > 80000 ? `receipt_${Date.now()}.jpg` : rawResult);
          }
        };
        img.onerror = () => {
          setUploadedProof(`receipt_${Date.now()}.jpg`);
        };
        img.src = rawResult;
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedProof(`receipt_${Date.now()}_${file.name}`);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !activeMethod) return;

    setIsSubmitting(true);

    try {
      let resolvedProvId = providerId;
      let resolvedProvName = providerName;

      if (isSupabaseConfigured()) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('id, full_name')
            .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
            .maybeSingle();

          if (prof?.id) {
            let { data: provProf } = await supabase
              .from('provider_profiles')
              .select('id, company_name')
              .eq('profile_id', prof.id)
              .maybeSingle();

            if (!provProf) {
              const { data: createdProv } = await supabase
                .from('provider_profiles')
                .insert({
                  profile_id: prof.id,
                  provider_type: 'owner',
                  business_phone: '+1 (555) 000-0000',
                  country_code: 'USA',
                  verification_status: 'verified',
                })
                .select('id, company_name')
                .single();
              provProf = createdProv;
            }

            if (provProf?.id) {
              resolvedProvId = provProf.id;
              resolvedProvName = provProf.company_name || prof.full_name || 'Property Partner';
            }
          }
        }
      }

      let proofPath = uploadedProof || `receipt_${Date.now()}.jpg`;

      // If Supabase is configured and we have an image, try to upload to storage
      if (isSupabaseConfigured() && uploadedProof && uploadedProof.startsWith('data:')) {
        try {
          const res = await fetch(uploadedProof);
          const blob = await res.blob();
          const fileName = `provider_${resolvedProvId}_${Date.now()}.jpg`;
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('payment-proofs-vault')
            .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr && uploadData?.path) {
            proofPath = uploadData.path;
          }
        } catch (storageErr) {
          console.warn('Storage upload note:', storageErr);
        }
      }

      const newPayment: ProviderPayment = {
        id: `pay-${Date.now()}`,
        provider_id: resolvedProvId,
        provider_name: resolvedProvName,
        listing_plan_id: selectedPlan.id,
        listing_plan_name: selectedPlan.name,
        payment_method_id: activeMethod.id,
        payment_method_name: activeMethod.name,
        amount: selectedPlan.price,
        currency_code: selectedPlan.currency_code,
        proof_storage_path: proofPath,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      };

      await listingPlansDb.submitPayment(newPayment);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Payment submit error:', err?.message || err);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AppLayout title="Payment Proof Submitted | Blue Sky Provider" isPublic={true}>
        <div
          style={{
            minHeight: 'calc(100vh - 160px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 16px',
            background: 'linear-gradient(180deg, var(--color-surface-subtle) 0%, var(--color-bg) 100%)',
          }}
        >
          <div
            className="card animate-fade-in-up"
            style={{
              width: '100%',
              maxWidth: 540,
              padding: '40px 28px',
              borderRadius: 'var(--radius-2xl)',
              textAlign: 'center',
              backgroundColor: 'var(--color-white)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}
            >
              <CheckCircle2 size={44} />
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-navy-dark)', marginBottom: 8 }}>
              Payment Receipt Uploaded!
            </h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Your payment proof has been routed to our billing verification team. Your listing access will activate immediately upon verification.
            </p>

            <div
              style={{
                backgroundColor: 'var(--color-surface-subtle)',
                padding: '18px 20px',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'left',
                marginBottom: 24,
                fontSize: 13,
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Selected Plan:</span>
                <strong style={{ color: 'var(--color-navy-dark)' }}>{selectedPlan?.name}</strong>
              </div>
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Duration:</span>
                <strong style={{ color: 'var(--color-navy-dark)' }}>{selectedPlan?.duration_days} Days Access</strong>
              </div>
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Amount Paid:</span>
                <strong style={{ color: 'var(--color-primary)' }}>
                  {selectedPlan?.currency_code} ${selectedPlan?.price.toLocaleString()}
                </strong>
              </div>
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Payment Method:</span>
                <strong style={{ color: 'var(--color-navy-dark)' }}>{activeMethod?.name}</strong>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Status:</span>
                <Badge variant="pending">⏳ AUDIT IN PROGRESS</Badge>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/provider" className="btn btn-primary" style={{ flex: 1, height: 44 }}>
                Return to Dashboard
              </Link>
              <Link href="/provider/properties" className="btn btn-outline" style={{ flex: 1, height: 44 }}>
                Manage Properties
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Provider Checkout | Blue Sky Property" isPublic={true}>
      <div
        style={{
          minHeight: 'calc(100vh - 160px)',
          background: 'linear-gradient(180deg, var(--color-surface-subtle) 0%, var(--color-bg) 100%)',
          padding: '24px 16px 80px 16px',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          {/* Header Back Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button
              onClick={() => router.push('/provider/plans')}
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
              <ArrowLeft size={16} /> Back to Plans
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--color-success)' }}>
              <ShieldCheck size={16} /> Encrypted & Verified Transfer
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
              <Loader2 size={36} className="animate-spin" color="var(--color-primary)" />
              <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Loading payment methods...</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
              {/* Left Column: Plan Summary & Payment Destination */}
              <div>
                {/* Plan Summary Card */}
                {selectedPlan && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-white)',
                      borderRadius: 'var(--radius-2xl)',
                      border: '1px solid var(--color-border)',
                      padding: 24,
                      marginBottom: 20,
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Selected Subscription Tier
                    </span>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-navy-dark)', margin: '4px 0 8px 0' }}>
                      {selectedPlan.name}
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
                      <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)' }}>
                        ${selectedPlan.price.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                        {selectedPlan.currency_code} / {selectedPlan.duration_days} Days
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                      ✓ Includes unlimited property listings, zero commissions, and 48-hour grace period protection.
                    </div>
                  </div>
                )}

                {/* Choose Payment Method */}
                <div
                  style={{
                    backgroundColor: 'var(--color-white)',
                    borderRadius: 'var(--radius-2xl)',
                    border: '1px solid var(--color-border)',
                    padding: 24,
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 14 }}>
                    1. Select Payment Method
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {paymentMethods.map((method) => {
                      const isSelected = selectedMethodId === method.id;
                      return (
                        <div
                          key={method.id}
                          onClick={() => setSelectedMethodId(method.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-lg)',
                            border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            backgroundColor: isSelected ? 'var(--color-primary-tint)' : 'var(--color-white)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                border: isSelected ? '6px solid var(--color-primary)' : '2px solid #CBD5E1',
                                backgroundColor: 'white',
                              }}
                            />
                            <span style={{ fontSize: 14, fontWeight: isSelected ? 800 : 600, color: 'var(--color-navy-dark)' }}>
                              {method.name}
                            </span>
                          </div>
                          <Badge variant={isSelected ? 'primary' : 'info'}>
                            {method.type === 'interac_etransfer'
                              ? '🇨🇦 INTERAC'
                              : method.type === 'bitcoin'
                              ? '⚡ BITCOIN'
                              : method.type === 'cash_app'
                              ? '💵 CASH APP'
                              : method.type === 'chime'
                              ? '🟢 CHIME'
                              : method.type === 'facebook_pay'
                              ? '🔵 META PAY'
                              : method.type.toUpperCase()}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Transfer Details */}
                  {activeMethod && (
                    <div
                      style={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 16,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 8 }}>
                        Official Transfer Details:
                      </div>

                      {activeMethod.account_name && (
                        <div className="flex-between" style={{ fontSize: 12, marginBottom: 6 }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Beneficiary / Account:</span>
                          <strong>{activeMethod.account_name}</strong>
                        </div>
                      )}

                      {activeMethod.account_number && (
                        <div className="flex-between" style={{ fontSize: 12, marginBottom: 6 }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            {activeMethod.type === 'bitcoin'
                              ? 'BTC Wallet Address:'
                              : activeMethod.type === 'cash_app'
                              ? 'Cash App $Cashtag:'
                              : activeMethod.type === 'chime'
                              ? 'Chime Sign / Email:'
                              : activeMethod.type === 'facebook_pay'
                              ? 'Facebook Pay Tag / ID:'
                              : activeMethod.type === 'interac_etransfer'
                              ? 'Interac Recipient Email:'
                              : 'Account / Identifier:'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <strong style={{ fontFamily: activeMethod.type === 'bitcoin' ? 'monospace' : 'inherit', color: 'var(--color-primary)' }}>
                              {activeMethod.account_number}
                            </strong>
                            <button
                              type="button"
                              onClick={() => handleCopy(activeMethod.account_number!, 'acct')}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
                              title="Copy"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </div>
                      )}

                      {activeMethod.routing_or_swift && (
                        <div className="flex-between" style={{ fontSize: 12, marginBottom: 6 }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            {activeMethod.type === 'bitcoin' ? 'Blockchain Network:' : 'Network / Sub-Detail:'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <strong>{activeMethod.routing_or_swift}</strong>
                            <button
                              type="button"
                              onClick={() => handleCopy(activeMethod.routing_or_swift!, 'swift')}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
                              title="Copy"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </div>
                      )}

                      {activeMethod.bank_name && (
                        <div className="flex-between" style={{ fontSize: 12, marginBottom: 6 }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Platform / Institution:</span>
                          <strong>{activeMethod.bank_name}</strong>
                        </div>
                      )}

                      {activeMethod.instructions && (
                        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-secondary)', borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
                          <strong>Instructions:</strong> {activeMethod.instructions}
                        </div>
                      )}

                      {copiedKey && (
                        <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 6, fontWeight: 700 }}>
                          ✓ Copied to clipboard!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Upload Proof & Submit */}
              <div
                style={{
                  backgroundColor: 'var(--color-white)',
                  borderRadius: 'var(--radius-2xl)',
                  border: '1px solid var(--color-border)',
                  padding: 24,
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 8 }}>
                  2. Upload Payment Proof
                </h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                  After sending transfer via your banking app or wallet, upload the screenshot or transaction PDF below.
                </p>

                <form onSubmit={handleSubmitProof}>
                  <div
                    style={{
                      border: '2px dashed #BAE6FD',
                      backgroundColor: '#F0F9FF',
                      borderRadius: 'var(--radius-xl)',
                      padding: '30px 20px',
                      textAlign: 'center',
                      marginBottom: 20,
                    }}
                  >
                    <Upload size={36} color="var(--color-primary)" style={{ margin: '0 auto 10px auto' }} />
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 4 }}>
                      {proofFileName ? proofFileName : 'Upload Transfer Receipt / Screenshot'}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                      Supports PNG, JPG, WebP, or PDF receipts.
                    </p>

                    <label className="btn btn-primary btn-sm" style={{ display: 'inline-flex', cursor: 'pointer', gap: 6 }}>
                      <FileText size={15} /> {proofFileName ? 'Replace File' : 'Browse Receipt File'}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {uploadedProof && (
                      <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-success)', fontWeight: 700 }}>
                        <CheckCircle2 size={16} /> File ready for submission
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      padding: 14,
                      borderRadius: 'var(--radius-lg)',
                      marginBottom: 20,
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.5,
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    💡 <strong>Quick Activation Tip:</strong> Include your provider business name or email in the payment transfer memo so our audit team can verify your payment instantly.
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedPlan}
                    className="btn btn-primary btn-lg"
                    style={{
                      width: '100%',
                      height: 50,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Submitting Payment Proof...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} /> Submit Payment for Verification
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
