import React from 'react';
import Head from 'next/head';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { MobileHeader } from './MobileHeader';
import { BottomNavigation } from './BottomNavigation';

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
      ) : (
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
      )}
    </>
  );
};
