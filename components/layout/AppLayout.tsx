import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { MobileHeader } from './MobileHeader';
import { BottomNavigation } from './BottomNavigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { UserRole } from '@/lib/types';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  headerTitle?: string;
  isPublic?: boolean;
  hideNav?: boolean;
  hideHeader?: boolean;
  hideFooter?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title = 'Blue Sky Property Management | Verified Rentals Worldwide',
  headerTitle,
  isPublic = false,
  hideNav = false,
  hideHeader = false,
  hideFooter = false,
}) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(isPublic);
  const [isCheckingAuth, setIsCheckingAuth] = useState(!isPublic);

  useEffect(() => {
    if (isPublic) {
      setIsAuthorized(true);
      setIsCheckingAuth(false);
      return;
    }

    let isMounted = true;

    const verifyAccess = async () => {
      setIsCheckingAuth(true);

      const path = router.pathname;
      let currentRole: UserRole = store.getRole();
      let hasSession = store.isAuthenticated();

      // Check Supabase Auth session if configured
      if (isSupabaseConfigured()) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            hasSession = true;
            // Fetch role from profile if available
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .or(`auth_user_id.eq.${session.user.id},email.eq.${session.user.email}`)
              .maybeSingle();

            if (profile?.role) {
              currentRole = profile.role as UserRole;
              store.setRole(currentRole);
            }
          } else {
            // No Supabase session
            if (!store.getCurrentUser()) {
              hasSession = false;
            }
          }
        } catch (err) {
          console.warn('Auth guard check note:', err);
        }
      } else {
        // Local mode
        const localUser = store.getCurrentUser();
        if (localUser) {
          hasSession = true;
          currentRole = localUser.role;
        }
      }

      if (!isMounted) return;

      // 1. Admin Routes Guard
      if (path.startsWith('/admin')) {
        if (!hasSession || currentRole !== 'admin') {
          router.replace(`/auth/admin?redirect=${encodeURIComponent(router.asPath)}`);
          return;
        }
      }

      // 2. Provider Routes Guard (excluding registration)
      if (path.startsWith('/provider') && path !== '/provider/register') {
        if (!hasSession || currentRole !== 'provider') {
          router.replace(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
          return;
        }
      }

      // 3. Applicant / General Portal Routes Guard
      if (path.startsWith('/applicant') || path === '/notifications' || path === '/settings') {
        if (!hasSession) {
          router.replace(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
          return;
        }
      }

      setIsAuthorized(true);
      setIsCheckingAuth(false);
    };

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [router.pathname, router.asPath, isPublic]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta
          name="description"
          content="Verified rental property management and tenant application platform worldwide across USA, Canada, UK, and Australia."
        />
        <link rel="icon" href="/Logo.png" />
      </Head>

      {isPublic ? (
        /* =================================================================
           PUBLIC RESPONSIVE LAYOUT (Landing & Discovery Pages)
           Desktop Expanded + Mobile Fluid, Dedicated Public Header & Footer,
           NO Bottom Tab Navigation.
           ================================================================= */
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
          {!hideHeader && <PublicNavbar />}
          <main style={{ flex: 1 }}>{children}</main>
          {!hideFooter && <PublicFooter />}
        </div>
      ) : isCheckingAuth ? (
        /* =================================================================
           AUTH VERIFICATION LOADING SHELL
           Prevents unauthorized dashboard flashes and back-button leakage
           ================================================================= */
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-bg)',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <Loader2 size={32} color="var(--color-primary)" className="animate-spin" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Verifying secure session...
          </span>
        </div>
      ) : isAuthorized ? (
        /* =================================================================
           AUTHENTICATED / PORTAL LAYOUT (Tenant, Provider, Admin Portals)
           Responsive Shell with In-Portal Header & Bottom Navigation
           ================================================================= */
        <div className="portal-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
          {!hideHeader && (
            <MobileHeader
              title={headerTitle}
            />
          )}

          <main style={{ flex: 1, paddingBottom: hideNav ? 0 : 80 }}>{children}</main>

          {!hideNav && <BottomNavigation />}
        </div>
      ) : null}
    </>
  );
};
