import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  CreditCard,
  Building2,
  DollarSign,
  Layers,
  Key,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { DEFAULT_SITE_CONFIG, SiteConfigSettings } from '@/pages/api/settings/site-config';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'fees' | 'security'>('general');

  // Site Config State
  const [siteConfig, setSiteConfig] = useState<SiteConfigSettings>(DEFAULT_SITE_CONFIG);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');
  const [configError, setConfigError] = useState('');

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    async function fetchSiteConfig() {
      try {
        const res = await fetch('/api/settings/site-config');
        if (res.ok) {
          const data = await res.json();
          setSiteConfig(data);
        }
      } catch (err) {
        console.warn('Site config load note:', err);
      }
    }
    fetchSiteConfig();
  }, []);

  const handleSaveSiteConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSuccess('');
    setConfigError('');

    try {
      const res = await fetch('/api/settings/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteConfig),
      });

      if (!res.ok) {
        throw new Error('Failed to update platform settings');
      }

      const updated = await res.json();
      setSiteConfig(updated.data || siteConfig);
      setConfigSuccess('Platform configuration saved successfully.');
      setTimeout(() => setConfigSuccess(''), 4000);
    } catch (err: any) {
      setConfigError(err.message || 'Error updating settings');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }
      setPasswordSuccess('Administrative password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <AppLayout title="Settings | Blue Sky Admin" headerTitle="Settings">
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px 80px' }}>
        
        {/* Navigation & Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/admin"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} />
              Admin Portal
            </Link>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={22} color="var(--color-primary-navy)" />
                Settings
              </h1>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                Manage brand identity, contact metadata, application fees, and system security
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              href="/admin/plans"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-main)',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <CreditCard size={14} />
              Plans & Payment Methods
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 8,
            marginBottom: 24,
          }}
        >
          {[
            { id: 'general', label: 'Brand & Platform Info', icon: Globe },
            { id: 'fees', label: 'Fees & Payment Gateways', icon: DollarSign },
            { id: 'security', label: 'Admin Security', icon: Key },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: isActive ? '1px solid var(--color-primary, #0066FF)' : '1px solid transparent',
                  backgroundColor: isActive ? 'var(--color-primary, #0066FF)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: General Platform Configuration */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveSiteConfig}>
            <div
              style={{
                backgroundColor: 'var(--color-white, #ffffff)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary-navy)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="var(--color-primary-navy)" />
                Brand Identity & Public Information
              </h2>

              {configSuccess && (
                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <CheckCircle2 size={16} />
                  {configSuccess}
                </div>
              )}

              {configError && (
                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <AlertCircle size={16} />
                  {configError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={siteConfig.support_email}
                    onChange={(e) => setSiteConfig({ ...siteConfig, support_email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Support Phone Number
                  </label>
                  <input
                    type="text"
                    value={siteConfig.support_phone}
                    onChange={(e) => setSiteConfig({ ...siteConfig, support_phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Office / Headquarters Address
                  </label>
                  <input
                    type="text"
                    value={siteConfig.office_address}
                    onChange={(e) => setSiteConfig({ ...siteConfig, office_address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={siteConfig.facebook_url}
                    onChange={(e) => setSiteConfig({ ...siteConfig, facebook_url: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Twitter / X URL
                  </label>
                  <input
                    type="url"
                    value={siteConfig.twitter_url}
                    onChange={(e) => setSiteConfig({ ...siteConfig, twitter_url: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={siteConfig.instagram_url}
                    onChange={(e) => setSiteConfig({ ...siteConfig, instagram_url: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 6 }}>
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={siteConfig.linkedin_url}
                    onChange={(e) => setSiteConfig({ ...siteConfig, linkedin_url: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-navy)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isSavingConfig ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Settings
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: Fees & Gateways Quick Management */}
        {activeTab === 'fees' && (
          <div
            style={{
              backgroundColor: 'var(--color-white, #ffffff)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              marginBottom: 24,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary-navy)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={18} color="var(--color-primary-navy)" />
              Application Fees & Payment Gateways
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Application verification fees and provider listing subscription plans are managed with live database synchronization.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={20} color="#0284C7" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Application Fee Pricing</h3>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Configured per submission</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                  Adjust the mandatory ID verification fee charged to prospective tenants during application step 5.
                </p>
                <Link
                  href="/admin/plans"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-navy)',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Configure Fees in Plans Portal &rarr;
                </Link>
              </div>

              <div
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={20} color="var(--color-success)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Manual Payment Methods</h3>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Bank, Interac, Crypto, Zelle</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                  Add or edit bank accounts, $Cashtags, Interac emails, or crypto wallets for manual proof verification.
                </p>
                <Link
                  href="/admin/plans"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-navy)',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Manage Payment Accounts &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Security & Admin Password */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword}>
            <div
              style={{
                backgroundColor: 'var(--color-white, #ffffff)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                marginBottom: 24,
                maxWidth: 600,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary-navy)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={18} color="var(--color-primary-navy)" />
                Update Administrator Credentials
              </h2>

              {passwordSuccess && (
                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <CheckCircle2 size={16} />
                  {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <AlertCircle size={16} />
                  {passwordError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 6 }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      style={{
                        width: '100%',
                        padding: '10px 38px 10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: 14,
                        outline: 'none',
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 6 }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-navy)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  Update Admin Password
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
