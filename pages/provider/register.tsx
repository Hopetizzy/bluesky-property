import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Building2, ShieldCheck, ArrowRight, Phone, Mail, FileText, Lock, Eye, EyeOff, User, CheckCircle2, AlertCircle, Loader2, Home, Briefcase, Key, Building } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { ProviderType } from '@/lib/types';

export default function ProviderRegisterPage() {
  const router = useRouter();

  // Form Fields
  const [providerType, setProviderType] = useState<ProviderType>('owner');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [country, setCountry] = useState('USA');

  // State
  const [isExistingAuthUser, setIsExistingAuthUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user is already signed in
  useEffect(() => {
    async function checkCurrentSession() {
      if (!isSupabaseConfigured()) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsExistingAuthUser(true);
          setEmail(session.user.email || '');
          if (session.user.user_metadata?.full_name) {
            setFullName(session.user.user_metadata.full_name);
          }
          if (session.user.user_metadata?.phone) {
            setPhone(session.user.user_metadata.phone);
          }
          if (session.user.user_metadata?.company_name) {
            setCompanyName(session.user.user_metadata.company_name);
          }
        }
      } catch (err) {
        console.warn('Session check note:', err);
      }
    }
    checkCurrentSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!isExistingAuthUser) {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter.');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        setIsLoading(false);
        return;
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanFullName = fullName.trim() || companyName.trim();
    const cleanCompanyName = companyName.trim();
    const cleanLicense = licenseNumber.trim() || null;

    try {
      if (isSupabaseConfigured()) {
        let authUserId: string | null = null;

        // Step 1: Sign up if not already logged in
        if (!isExistingAuthUser) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
              data: {
                full_name: cleanFullName,
                phone: cleanPhone,
                phone_number: cleanPhone,
                company_name: cleanCompanyName,
                provider_type: providerType,
                role: 'provider',
                country_code: country,
              },
            },
          });

          if (authError && !authError.message.includes('already registered')) {
            throw new Error(authError.message);
          }
          authUserId = authData?.user?.id || null;
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          authUserId = user?.id || null;
        }

        // Step 2: Upsert into public.profiles
        const profilePayload: any = {
          email: cleanEmail,
          phone: cleanPhone,
          full_name: cleanFullName,
          role: 'provider',
          country_code: country,
          status: 'active',
          updated_at: new Date().toISOString(),
        };
        if (authUserId) {
          profilePayload.auth_user_id = authUserId;
        }

        const { data: upsertedProfile, error: profileErr } = await supabase
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'email' })
          .select('id')
          .maybeSingle();

        if (profileErr) {
          console.warn('Profiles upsert note:', profileErr.message);
        }

        // Retrieve the profile id UUID
        let targetProfileId = upsertedProfile?.id;
        if (!targetProfileId) {
          const { data: fetchedProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', cleanEmail)
            .maybeSingle();
          targetProfileId = fetchedProfile?.id;
        }

        // Step 3: Insert / Upsert into public.provider_profiles
        if (targetProfileId) {
          const { error: providerErr } = await supabase
            .from('provider_profiles')
            .upsert(
              {
                profile_id: targetProfileId,
                provider_type: providerType,
                company_name: cleanCompanyName,
                license_number: cleanLicense,
                business_phone: cleanPhone,
                country_code: country,
                verification_status: 'verified',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'profile_id' }
            );

          if (providerErr) {
            console.warn('Provider profile insert note:', providerErr.message);
          }
        }
      }

      // Update local role and forward to listing plans
      store.setRole('provider');
      setSuccessMessage('Landlord / Agent account created! Forwarding to listing plans...');

      setTimeout(() => {
        router.push('/provider/plans');
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to register Landlord / Agent. Please check the details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout title="Landlord & Agent Registration | Blue Sky Property" isPublic={true}>
      <div
        style={{
          minHeight: 'calc(100vh - 160px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 16px 60px 16px',
          background: 'linear-gradient(180deg, var(--color-surface-subtle) 0%, var(--color-bg) 100%)',
        }}
      >
        <div
          className="card animate-fade-in-up"
          style={{
            width: '100%',
            maxWidth: 560,
            padding: '36px 30px',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
            backgroundColor: 'var(--color-white)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-tint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
              }}
            >
              <Building2 size={28} color="var(--color-primary)" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
              Landlord & Agent Registration
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
              Register your business to access listing periods, receive tenant applications, and publish verified properties worldwide.
            </p>
          </div>

          {errorMessage && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger-text)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-success-bg)',
                color: 'var(--color-success-text)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Provider Type Selection */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Provider Classification</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { type: 'owner', label: 'Property Owner', icon: Home },
                  { type: 'agent', label: 'Real Estate Agent', icon: Briefcase },
                  { type: 'property_manager', label: 'Property Manager', icon: Key },
                  { type: 'brokerage', label: 'Brokerage / Agency', icon: Building },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = providerType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setProviderType(item.type as ProviderType)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? 'var(--color-primary-tint)' : 'var(--color-white)',
                        color: isSelected ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={16} color={isSelected ? 'var(--color-primary)' : 'var(--color-navy-muted)'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact Person Name & Company Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Contact Person Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="e.g. Helen Vance"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Company / Portfolio Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Pacific Heights Realty LLC"
                  required
                />
              </div>
            </div>

            {/* Contact Details: Phone & Country */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Business Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="+1 (415) 555-0188"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Primary Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="form-select"
                >
                  <option value="USA">🇺🇸 United States</option>
                  <option value="CAN">🇨🇦 Canada</option>
                  <option value="GBR">🇬🇧 United Kingdom</option>
                  <option value="AUS">🇦🇺 Australia</option>
                  <option value="EUR">🇪🇺 Europe</option>
                </select>
              </div>
            </div>

            {/* Business Email */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Business Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="contact@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Fields (Only if not existing session) */}
            {!isExistingAuthUser && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Create Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: 36, paddingRight: 36 }}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: 36 }}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Real Estate License */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Real Estate License Number (Optional)</label>
              <div style={{ position: 'relative' }}>
                <FileText size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="e.g. DRE #01928472 or Broker Lic #"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg"
              style={{ marginTop: 8, width: '100%' }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={18} className="animate-spin" /> Saving Registration...
                </span>
              ) : (
                <>Complete Registration & Choose Plan <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Tenant Redirection Banner */}
          <div
            style={{
              marginTop: 20,
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              borderTop: '1px solid var(--color-border)',
              paddingTop: 16,
            }}
          >
            Looking to rent an apartment or home instead?{' '}
            <Link href="/auth/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
              Register as Tenant
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
