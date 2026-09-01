import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X, Building2, Search, HelpCircle, Shield, PlusCircle, User, LogOut, LayoutDashboard } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { UserRole } from '@/lib/types';

export const PublicNavbar: React.FC = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('applicant');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    async function checkAuth() {
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setIsLoggedIn(true);
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, role')
              .or(`auth_user_id.eq.${session.user.id},email.eq.${session.user.email}`)
              .maybeSingle();

            const role = (profile?.role as UserRole) || 'applicant';
            setUserRole(role);
            setUserName(profile?.full_name || session.user.email?.split('@')[0] || 'User');
            return;
          }
        } catch (err) {
          console.warn('PublicNavbar auth check note:', err);
        }
      }

      // Check store local session
      if (store.isAuthenticated()) {
        const currentUser = store.getCurrentUser();
        setIsLoggedIn(true);
        if (currentUser) {
          setUserRole(currentUser.role);
          setUserName(currentUser.full_name);
        }
      } else {
        setIsLoggedIn(false);
      }
    }

    checkAuth();
  }, []);

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out note:', err);
      }
    }
    setIsLoggedIn(false);
    store.clearSession();
    router.replace('/auth/login');
  };

  const getDashboardPath = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'provider') return '/provider';
    return '/applicant';
  };

  const navLinks = [
    { label: 'Explore Homes', href: '/properties', icon: Search },
    { label: 'How It Works', href: '/#how-it-works', icon: Shield },
    { label: 'For Landlords', href: '/#for-landlords', icon: Building2 },
    { label: 'Help & FAQ', href: '/faq', icon: HelpCircle },
  ];

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
          height: 72,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="page-container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/Logo.png"
              alt="Blue Sky"
              style={{ height: 38, width: 'auto', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Blue Sky
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Property Management
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav style={{ display: 'none', alignItems: 'center', gap: 28 }} className="desktop-nav">
            {navLinks.map((link) => {
              const isActive = router.pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-navy-muted)',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? 'var(--color-primary)' : 'var(--color-navy-muted)')}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'none', alignItems: 'center', gap: 10 }} className="desktop-actions">
              {isLoggedIn ? (
                <>
                  <Link
                    href={getDashboardPath()}
                    className="btn btn-secondary btn-sm"
                    style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <LayoutDashboard size={15} color="var(--color-primary)" />
                    Dashboard {userName ? `(${userName.split(' ')[0]})` : ''}
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="btn btn-outline btn-sm"
                    style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}
                    title="Sign Out"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
                    Sign In
                  </Link>
                  <Link href="/provider/register" className="btn btn-primary btn-sm">
                    <PlusCircle size={15} /> List a Property
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-navy-dark)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
              }}
              className="mobile-toggle"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: 72,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              padding: '24px 20px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: 'var(--shadow-modal)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--color-navy-dark)',
                      backgroundColor: 'var(--color-surface-subtle)',
                    }}
                  >
                    <Icon size={18} color="var(--color-primary)" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isLoggedIn ? '1fr 1fr' : '1fr 1fr', gap: 10, marginTop: 8 }}>
              {isLoggedIn ? (
                <>
                  <Link
                    href={getDashboardPath()}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-primary"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="btn btn-secondary"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-secondary"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/provider/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-primary"
                  >
                    List a Property
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 900px) {
          :global(.desktop-nav),
          :global(.desktop-actions) {
            display: flex !important;
          }
          :global(.mobile-toggle) {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};
