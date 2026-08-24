import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Search, MessageSquare, User, Building, PlusCircle, FileText, CheckCircle2, Shield, Settings, LayoutDashboard } from 'lucide-react';
import { store } from '@/lib/store';

export const BottomNavigation: React.FC = () => {
  const router = useRouter();
  const currentPath = router.pathname;
  let role = store.getRole();

  // Infer portal role automatically from current path
  if (currentPath.startsWith('/provider')) {
    role = 'provider';
  } else if (currentPath.startsWith('/admin')) {
    role = 'admin';
  } else if (currentPath.startsWith('/applicant')) {
    role = 'applicant';
  }

  // Navigation Items per Portal
  let navItems = [
    { label: 'Overview', href: '/applicant', icon: LayoutDashboard },
    { label: 'Applications', href: '/applicant/applications', icon: FileText },
    { label: 'ID Vault', href: '/applicant/documents', icon: Shield },
    { label: 'Messages', href: '/applicant/messages', icon: MessageSquare },
  ];

  if (role === 'provider') {
    navItems = [
      { label: 'Overview', href: '/provider', icon: LayoutDashboard },
      { label: 'Properties', href: '/provider/properties', icon: Building },
      { label: 'Add Listing', href: '/provider/properties/new', icon: PlusCircle },
      { label: 'Plans', href: '/provider/plans', icon: Shield },
    ];
  } else if (role === 'admin') {
    navItems = [
      { label: 'Overview', href: '/admin', icon: LayoutDashboard },
      { label: 'Properties', href: '/admin/properties', icon: Building },
      { label: 'Applications', href: '/admin/applications', icon: CheckCircle2 },
      { label: 'Payments', href: '/admin/payments', icon: FileText },
    ];
  }

  return (
    <>
      <nav
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--color-border)',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.06)',
          zIndex: 900,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0 8px',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/applicant' || item.href === '/provider' || item.href === '/admin'
              ? currentPath === item.href
              : currentPath.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                flex: 1,
                height: '100%',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ fontSize: 11, fontWeight: isActive ? 800 : 500 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        @media (min-width: 900px) {
          :global(.mobile-bottom-nav) {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};
