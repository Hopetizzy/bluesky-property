import React from 'react';
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
} from 'lucide-react';
import { store } from '@/lib/store';

interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDrawer: React.FC<AdminDrawerProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const links = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'All Properties', href: '/admin/properties', icon: Building2 },
    { label: 'Add Property (Admin)', href: '/admin/properties/create', icon: PlusCircle },
    { label: 'Providers', href: '/admin/providers', icon: Users },
    { label: 'Payments Verification', href: '/admin/payments', icon: CreditCard },
    { label: 'Applications', href: '/admin/applications', icon: FileCheck },
    { label: 'Listing Plans', href: '/admin/plans', icon: Settings },
    { label: 'Messages', href: '/applicant/messages', icon: MessageSquare },
    { label: 'FAQs & Keywords', href: '/faq', icon: HelpCircle },
    { label: 'Settings', href: '/settings', icon: Settings },
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
          width: 280,
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          height: '100%',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 0 20px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="flex-between" style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/Logo.png" alt="Logo" style={{ height: 28, width: 'auto' }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: '#38BDF8' }}>Blue Sky Admin</span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    backgroundColor: isActive ? 'rgba(0, 102, 255, 0.2)' : 'transparent',
                    borderLeft: isActive ? '3px solid #0066FF' : '3px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={18} color={isActive ? '#38BDF8' : '#94A3B8'} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1E293B', paddingTop: 16 }}>
          <button
            onClick={() => {
              store.setRole('applicant');
              onClose();
              router.push('/');
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
              fontSize: 14,
              cursor: 'pointer',
              padding: '8px 12px',
            }}
          >
            <LogOut size={18} />
            Exit Admin View
          </button>
        </div>
      </div>
    </div>
  );
};
