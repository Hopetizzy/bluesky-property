import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { UserRole } from '@/lib/types';

export default function AuthLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('USA');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          throw new Error(error.message);
        } else if (data?.user) {
          // Check role from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .or(`auth_user_id.eq.${data.user.id},email.eq.${data.user.email}`)
            .maybeSingle();

          const userRole = (profile?.role as UserRole) || 'applicant';
          store.setRole(userRole);

          if (userRole === 'admin') router.push('/admin');
          else if (userRole === 'provider') router.push('/provider');
          else router.push('/applicant');
          return;
        }
      }

      // Local / Offline fallback
      store.setRole('applicant');
      router.push('/applicant');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

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

    const cleanPhone = phoneNumber.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = fullName.trim();

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: cleanFullName,
              phone: cleanPhone,
              phone_number: cleanPhone,
              role: 'applicant',
              country_code: country,
            },
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.user) {
          // Upsert into public.profiles to guarantee phone number and metadata are persisted immediately
          const { error: profileError } = await supabase.from('profiles').upsert(
            {
              auth_user_id: data.user.id,
              email: cleanEmail,
              phone: cleanPhone,
              full_name: cleanFullName,
              role: 'applicant',
              country_code: country,
              status: 'active',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          );

          if (profileError) {
            console.warn('Profile sync note:', profileError.message);
          }
        }
      }

      // Update local application store role to applicant (tenant)
      store.setRole('applicant');
      setSuccessMessage('Tenant account registered successfully! Redirecting...');

      setTimeout(() => {
        router.push('/applicant');
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout title="Sign In & Tenant Registration | Blue Sky Property" isPublic={true}>
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
            maxWidth: 480,
            padding: '32px 28px',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
            backgroundColor: 'var(--color-white)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <img src="/Logo.png" alt="Blue Sky" style={{ height: 42, width: 'auto' }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)' }}>Blue Sky</span>
            </Link>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-navy-dark)', marginTop: 4 }}>
              {tab === 'login' ? 'Welcome Back!' : 'Tenant Registration'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {tab === 'login'
                ? 'Sign in to access your tenant account, applications, and documents'
                : 'Create your tenant account to search and apply for verified homes'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--color-surface-subtle)',
              padding: 4,
              borderRadius: 'var(--radius-md)',
              marginBottom: 20,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: tab === 'login' ? 'var(--color-white)' : 'transparent',
                color: tab === 'login' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: tab === 'login' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: tab === 'register' ? 'var(--color-white)' : 'transparent',
                color: tab === 'register' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: tab === 'register' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Tenant Sign Up
            </button>
          </div>

          {/* Error & Success Messages */}
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

          {/* Form */}
          <form onSubmit={tab === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Full Name (Register Mode) */}
            {tab === 'register' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 40 }}
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* Phone & Country (Register Mode) */}
            {tab === 'register' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone
                      size={16}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-text-muted)',
                      }}
                    />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: 36 }}
                      placeholder="+1 (555) 0199"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Country</label>
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
            )}

            {/* Password */}
            <div className="form-group" style={{ margin: 0 }}>
              <div className="flex-between" style={{ marginBottom: 4 }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                {tab === 'login' && (
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Secure 6+ characters
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register Mode) */}
            {tab === 'register' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 40 }}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg"
              style={{ marginTop: 8, width: '100%' }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={18} className="animate-spin" /> Processing...
                </span>
              ) : tab === 'login' ? (
                <>Sign In to Account <ArrowRight size={16} /></>
              ) : (
                <>Register as Tenant <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Landlord & Agent Callout Box */}
          <div
            style={{
              marginTop: 24,
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-tint)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Building2 size={20} color="var(--color-primary)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                  Are you a Landlord or Agent?
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Publish properties and manage listings
                </div>
              </div>
            </div>
            <Link
              href="/provider/register"
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0, padding: '8px 12px', fontSize: 12 }}
            >
              List Property
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
