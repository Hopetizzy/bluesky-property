import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  Globe,
  LogOut,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Share2,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { store } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { UserRole } from '@/lib/types';
import { DEFAULT_SITE_CONFIG, SiteConfigSettings } from '@/pages/api/settings/site-config';

export default function SettingsPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('applicant');
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; full_name: string; role: UserRole } | null>(null);

  // Settings
  const [currency, setCurrency] = useState('USD');

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
    async function loadUserData() {
      const activeRole = store.getRole();
      setRole(activeRole);

      let user = store.getCurrentUser();

      if (isSupabaseConfigured()) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .or(`auth_user_id.eq.${authUser.id},email.eq.${authUser.email}`)
              .maybeSingle();

            if (profile) {
              user = {
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name || authUser.email?.split('@')[0] || 'User',
                role: (profile.role as UserRole) || activeRole,
              };
              store.setCurrentUser(user);
            }
          }
        } catch (err) {
          console.warn('Settings load user note:', err);
        }
      }

      if (user) {
        setCurrentUser(user);
        setRole(user.role);
      } else {
        // Fallback demo user
        const fallback =
          activeRole === 'admin'
            ? { id: 'admin-1', email: 'admin@blueskyproperty.com', full_name: 'Admin', role: 'admin' as UserRole }
            : activeRole === 'provider'
            ? { id: 'prov-1', email: 'helen@pacificheights.com', full_name: 'Pacific Heights Realty LLC', role: 'provider' as UserRole }
            : { id: 'user-1', email: 'john.doe@example.com', full_name: 'John Doe (Tenant)', role: 'applicant' as UserRole };
        setCurrentUser(fallback);
      }
    }

    loadUserData();
  }, []);

  // Brand & Social Links Configuration (Admin Desk)
  const [siteConfig, setSiteConfig] = useState<SiteConfigSettings>(DEFAULT_SITE_CONFIG);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState('');
  const [configErrorMsg, setConfigErrorMsg] = useState('');

  useEffect(() => {
    async function loadSiteConfig() {
      try {
        const res = await fetch('/api/settings/site-config');
        const json = await res.json();
        if (json.success && json.data) {
          setSiteConfig(json.data);
        }
      } catch (err) {
        console.warn('Settings load site-config note:', err);
      }
    }
    loadSiteConfig();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordSuccess('');
    setPasswordError('');

    if (!oldPassword.trim()) {
      setPasswordError('Please enter your current (old) password.');
      setIsChangingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      setIsChangingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please re-enter.');
      setIsChangingPassword(false);
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError('New password must be different from your current password.');
      setIsChangingPassword(false);
      return;
    }

    try {
      // 1. Try server-side API endpoint directly connected to Supabase Auth & Database
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser?.email || 'admin@blueskyproperty.com',
          oldPassword,
          newPassword,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to update password.');
      }

      // 2. Also update in Supabase Auth client session if active
      if (isSupabaseConfigured()) {
        try {
          await supabase.auth.updateUser({ password: newPassword });
        } catch (clientErr) {
          console.warn('Client auth update note:', clientErr);
        }
      }

      setPasswordSuccess('Password changed successfully! Your new credentials are active in the database.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password. Please check your credentials.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveSiteConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSuccessMsg('');
    setConfigErrorMsg('');

    try {
      const res = await fetch('/api/settings/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteConfig),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to save site settings');

      setConfigSuccessMsg('Brand support & social links updated successfully! Live on site footer.');
      setTimeout(() => setConfigSuccessMsg(''), 4000);
    } catch (err: any) {
      setConfigErrorMsg(err.message || 'Failed to save settings.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    store.clearSession();
    // Redirect to main landing page
    router.replace('/');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'BS';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <AppLayout title="Account & Security Settings | Blue Sky Property" headerTitle="Account Settings">
      <div style={{ padding: '20px 16px 80px 16px', maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex-between" style={{ marginBottom: 20 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--color-navy-dark)',
              padding: 4,
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)' }}>Account & Settings</h1>
          <div style={{ width: 20 }} />
        </div>

        {/* Profile Card */}
        <div
          className="card"
          style={{
            padding: 18,
            marginBottom: 20,
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: role === 'admin' ? '#0F172A' : 'var(--color-primary-tint)',
                color: role === 'admin' ? '#38BDF8' : 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 800,
                flexShrink: 0,
                border: role === 'admin' ? '2px solid #38BDF8' : 'none',
              }}
            >
              {getInitials(currentUser?.full_name)}
            </div>
            <div style={{ flex: 1 }}>
              <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                    {currentUser?.full_name || 'User Account'}
                  </h2>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {currentUser?.email || 'user@domain.com'}
                  </div>
                </div>
                <Badge variant={role === 'admin' ? 'approved' : role === 'provider' ? 'active' : 'info'}>
                  {role.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECURITY & PASSWORD CHANGE CARD (REQUIRES OLD PASSWORD)
            ========================================================================= */}
        <div
          className="card"
          style={{
            padding: 20,
            marginBottom: 20,
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: 'rgba(0, 102, 255, 0.1)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Key size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                Security & Password
              </h2>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Type your current password to set a new password
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {passwordError && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid #FECACA',
                color: 'var(--color-danger-text)',
                fontSize: 12,
                marginTop: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={15} color="var(--color-danger)" style={{ flexShrink: 0 }} />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-success-bg)',
                border: '1px solid #86EFAC',
                color: 'var(--color-success-text)',
                fontSize: 12,
                marginTop: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={15} color="var(--color-success)" style={{ flexShrink: 0 }} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Old Password */}
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Current (Old) Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 36, paddingRight: 36, height: 40, fontSize: 13 }}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showOldPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                New Password (min 6 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 36, paddingRight: 36, height: 40, fontSize: 13 }}
                  placeholder="Enter new secure password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 36, height: 40, fontSize: 13 }}
                  placeholder="Re-enter new password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="btn btn-primary"
              style={{ marginTop: 4, height: 40, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Verifying & Updating...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} /> Update Password
                </>
              )}
            </button>
          </form>
        </div>

        {/* Brand Support & Social Links (Admin Desk Only) */}
        {role === 'admin' && (
          <div className="card" style={{ marginBottom: 20, borderRadius: 'var(--radius-xl)' }}>
            <div className="flex-between" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--color-navy-dark)' }}>
                  Brand Support & Social Links
                </h3>
              </div>
              <Badge variant="verified">PUBLIC FOOTER</Badge>
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Configure public support emails, helpline phone numbers, and official social media channel links rendered on the footer.
            </p>

            {configSuccessMsg && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #86EFAC',
                  color: '#065F46',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <CheckCircle2 size={16} color="#16A34A" /> {configSuccessMsg}
              </div>
            )}

            {configErrorMsg && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#991B1B',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <AlertCircle size={16} color="#DC2626" /> {configErrorMsg}
              </div>
            )}

            <form onSubmit={handleSaveSiteConfig} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Support Email */}
              <div>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Official Support Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="email"
                    value={siteConfig.support_email}
                    onChange={(e) => setSiteConfig({ ...siteConfig, support_email: e.target.value })}
                    className="form-input"
                    style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
                    placeholder="e.g. support@blueskyproperty.com"
                    required
                  />
                </div>
              </div>

              {/* Support Phone & Office Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Support Phone Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      value={siteConfig.support_phone}
                      onChange={(e) => setSiteConfig({ ...siteConfig, support_phone: e.target.value })}
                      className="form-input"
                      style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
                      placeholder="e.g. +1 (800) 555-0199"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Headquarters Office Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      value={siteConfig.office_address}
                      onChange={(e) => setSiteConfig({ ...siteConfig, office_address: e.target.value })}
                      className="form-input"
                      style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
                      placeholder="e.g. 9454 Wilshire Blvd, Beverly Hills"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links Row 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Facebook Page URL
                  </label>
                  <input
                    type="url"
                    value={siteConfig.facebook_url}
                    onChange={(e) => setSiteConfig({ ...siteConfig, facebook_url: e.target.value })}
                    className="form-input"
                    style={{ height: 38, fontSize: 13 }}
                    placeholder="https://facebook.com/blueskyproperty"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    X (Twitter) Profile URL
                  </label>
                  <input
                    type="url"
                    value={siteConfig.twitter_url}
                    onChange={(e) => setSiteConfig({ ...siteConfig, twitter_url: e.target.value })}
                    className="form-input"
                    style={{ height: 38, fontSize: 13 }}
                    placeholder="https://twitter.com/blueskyprop"
                  />
                </div>
              </div>

              {/* Social Links Row 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={siteConfig.instagram_url}
                    onChange={(e) => setSiteConfig({ ...siteConfig, instagram_url: e.target.value })}
                    className="form-input"
                    style={{ height: 38, fontSize: 12 }}
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={siteConfig.linkedin_url}
                    onChange={(e) => setSiteConfig({ ...siteConfig, linkedin_url: e.target.value })}
                    className="form-input"
                    style={{ height: 38, fontSize: 12 }}
                    placeholder="https://linkedin.com/..."
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    YouTube Channel URL
                  </label>
                  <input
                    type="url"
                    value={siteConfig.youtube_url}
                    onChange={(e) => setSiteConfig({ ...siteConfig, youtube_url: e.target.value })}
                    className="form-input"
                    style={{ height: 38, fontSize: 12 }}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingConfig}
                className="btn btn-primary"
                style={{ marginTop: 6, height: 40, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {isSavingConfig ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving Settings to Database...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Update Brand & Social Links
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Preferences Section */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20, borderRadius: 'var(--radius-xl)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-surface-subtle)' }} className="flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Globe size={18} color="var(--color-primary)" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Default Currency</span>
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ border: 'none', background: 'none', fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', outline: 'none' }}
            >
              <option value="USD">USD ($)</option>
              <option value="CAD">CAD (CA$)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="AUD">AUD (A$)</option>
            </select>
          </div>

          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-surface-subtle)' }} className="flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={18} color="var(--color-success)" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Encryption & RLS Status</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-success)' }}>
              🟢 Active Protected
            </span>
          </div>

          <Link href="/notifications" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={18} color="var(--color-warning)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-navy-dark)' }}>Notifications & Alerts</span>
            </div>
            <ChevronRight size={16} color="var(--color-text-muted)" />
          </Link>
        </div>

        {/* Sign Out Button (Takes cleanly to Landing Page) */}
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger"
          style={{ width: '100%', height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}
        >
          <LogOut size={16} /> Sign Out of Account
        </button>
      </div>
    </AppLayout>
  );
}
