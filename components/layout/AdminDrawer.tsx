import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  X,
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  FileCheck,
  MessageSquare,
  HelpCircle,
  Settings,
  ShieldAlert,
  LogOut,
  PlusCircle,
  Shield,
  Bell,
} from 'lucide-react';
import { store } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDrawer: React.FC<AdminDrawerProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [pendingPropsCount, setPendingPropsCount] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [pendingAppsCount, setPendingAppsCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const props = store.getProperties();
      setPendingPropsCount(props.filter((p) => p.status === 'pending_verification').length);

      const payments = store.getProviderPayments();
      setPendingPaymentsCount(payments.filter((p) => p.status === 'pending').length);

      const apps = store.getApplications();
      setPendingAppsCount(apps.filter((a) => a.status === 'under_review' || a.status === 'submitted').length);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const links = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'All Properties', href: '/admin/properties', icon: Building2, badge: pendingPropsCount > 0 ? pendingPropsCount : undefined, badgeColor: '#EF4444' },
    { label: 'Add Property', href: '/admin/properties/create', icon: PlusCircle },
    { label: 'Providers', href: '/admin/providers', icon: Users },
    { label: 'Payments Verification', href: '/admin/payments', icon: CreditCard, badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined, badgeColor: '#F59E0B' },
    { label: 'Applications', href: '/admin/applications', icon: FileCheck, badge: pendingAppsCount > 0 ? pendingAppsCount : undefined, badgeColor: '#0066FF' },
    { label: 'Listing Plans & Fees', href: '/admin/plans', icon: Shield },
    { label: 'Support Messages', href: '/admin/messages', icon: MessageSquare },
    { label: 'FAQs & Keywords', href: '/faq', icon: HelpCircle },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 290,
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          height: '100%',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 0 25px rgba(0,0,0,0.4)',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="flex-between" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/Logo.png" alt="Logo" style={{ height: 28, width: 'auto' }} />
              <div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#38BDF8', display: 'block' }}>Blue Sky Admin</span>
                <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>Command & Operations</span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = router.pathname === link.href;

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    backgroundColor: isActive ? 'rgba(0, 102, 255, 0.2)' : 'transparent',
                    borderLeft: isActive ? '3px solid #0066FF' : '3px solid transparent',
                    transition: 'all 0.15s ease',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={17} color={isActive ? '#38BDF8' : '#94A3B8'} />
                    {link.label}
                  </div>

                  {link.badge !== undefined && (
                    <span
                      style={{
                        backgroundColor: link.badgeColor || '#0066FF',
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 10,
                        minWidth: 18,
                        textAlign: 'center',
                      }}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1E293B', paddingTop: 16, marginTop: 20 }}>
          <button
            onClick={async () => {
              if (isSupabaseConfigured()) {
                try {
                  await supabase.auth.signOut();
                } catch (e) {
                  console.warn('Sign out note:', e);
                }
              }
              store.clearSession();
              onClose();
              router.replace('/');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              background: 'none',
              border: 'none',
              color: '#EF4444',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 6,
            }}
          >
            <LogOut size={16} />
            Exit Admin Console
          </button>
        </div>
      </div>
    </div>
  );
};
