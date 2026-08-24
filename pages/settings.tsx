import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, User, Shield, Bell, Globe, LogOut, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { store } from '@/lib/store';

export default function SettingsPage() {
  const router = useRouter();
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('English');

  const handleLogout = () => {
    store.setRole('applicant');
    router.push('/auth/login');
  };

  return (
    <AppLayout title="Settings & Profile | Blue Sky Property" headerTitle="Settings">
      <div style={{ padding: '16px 16px 80px 16px' }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--color-navy-dark)',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 800 }}>Account & Settings</h1>
          <div style={{ width: 20 }} />
        </div>

        {/* Profile Card */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-tint)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              JD
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                John Doe
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                john.doe@example.com
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-surface-subtle)' }} className="flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Globe size={18} color="var(--color-primary)" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Default Currency</span>
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ border: 'none', background: 'none', fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}
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
              <span style={{ fontSize: 14, fontWeight: 600 }}>ID Vault Security</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-success)' }}>
              Encrypted
            </span>
          </div>

          <Link href="/notifications" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={18} color="var(--color-warning)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-navy-dark)' }}>Push Notifications</span>
            </div>
            <ChevronRight size={16} color="var(--color-text-muted)" />
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger"
          style={{ height: 48 }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </AppLayout>
  );
}
