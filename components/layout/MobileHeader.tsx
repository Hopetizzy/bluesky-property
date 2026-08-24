import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bell, User, LogOut, LayoutDashboard, FileText, Shield, MessageSquare, Search, Building } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { UserRole } from '@/lib/types';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
}) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const [role, setRole] = useState<UserRole>('applicant');
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    setRole(store.getRole());

    async function loadHeaderData() {
      if (isSupabaseConfigured()) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: notifs, count } = await supabase
              .from('notifications')
              .select('*', { count: 'exact' })
              .eq('is_read', false);

            setUnreadNotifs(count !== null ? count : (notifs?.length || 0));

            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, role')
              .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
              .maybeSingle();

            if (profile?.full_name) {
              setUserName(profile.full_name);
            }
            if (profile?.role) {
              setRole(profile.role as UserRole);
              store.setRole(profile.role as UserRole);
            }
            return;
          }
        } catch (err) {
          console.warn('Header Supabase sync note:', err);
        }
      }

      const notifs = store.getNotifications();
      setUnreadNotifs(notifs.filter((n) => !n.is_read).length);
    }

    loadHeaderData();

    const handleFocus = () => loadHeaderData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    store.setRole('applicant');
    router.push('/');
  };

  const applicantNavLinks = [
    { label: 'Overview', href: '/applicant', icon: LayoutDashboard },
    { label: 'My Applications', href: '/applicant/applications', icon: FileText },
    { label: 'ID Vault', href: '/applicant/documents', icon: Shield },
    { label: 'Messages', href: '/applicant/messages', icon: MessageSquare },
    { label: 'Explore Homes', href: '/properties', icon: Search },
  ];

  const providerNavLinks = [
    { label: 'Dashboard', href: '/provider', icon: LayoutDashboard },
    { label: 'My Properties', href: '/provider/properties', icon: Building },
    { label: 'Listing Plans', href: '/provider/plans', icon: Shield },
    { label: 'Payment History', href: '/provider/payments', icon: FileText },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ];

  const activeLinks =
    currentPath.startsWith('/provider') || role === 'provider'
      ? providerNavLinks
      : applicantNavLinks;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        height: 70,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/Logo.png"
              alt="Blue Sky"
              style={{ height: 38, width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Blue Sky
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {role === 'provider' ? 'Landlord Portal' : role === 'admin' ? 'Admin Portal' : 'Tenant Portal'}
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: 8,
          }}
          className="desktop-portal-nav"
        >
          {activeLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === '/applicant'
              ? currentPath === '/applicant'
              : currentPath.startsWith(link.href);

            return (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-navy-muted)',
                  backgroundColor: isActive ? 'var(--color-primary-tint)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-subtle)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon size={16} color={isActive ? 'var(--color-primary)' : 'currentColor'} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Title */}
        {title && (
          <div
            className="mobile-header-title"
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--color-navy-dark)',
              textAlign: 'center',
              display: 'block',
            }}
          >
            {title}
          </div>
        )}

        {/* Right Actions: Notification Bell & Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/notifications"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface-subtle)',
              color: 'var(--color-navy-dark)',
              transition: 'all 0.15s ease',
            }}
            aria-label={`Notifications (${unreadNotifs} unread)`}
          >
            <Bell size={18} />
            {unreadNotifs > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'var(--color-danger)',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 800,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
                }}
              >
                {unreadNotifs > 99 ? '99+' : unreadNotifs}
              </span>
            )}
          </Link>

          {/* User Display & Sign Out Button */}
          <button
            onClick={handleSignOut}
            title="Sign Out"
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--color-navy-dark)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-white)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-danger)';
              e.currentTarget.style.color = 'var(--color-danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-navy-dark)';
            }}
          >
            <LogOut size={16} />
            <span className="desktop-signout-text">Sign Out</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 900px) {
          :global(.desktop-portal-nav) {
            display: flex !important;
          }
          :global(.mobile-header-title) {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          :global(.desktop-signout-text) {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
