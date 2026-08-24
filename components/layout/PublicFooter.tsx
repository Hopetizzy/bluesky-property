import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Globe, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        borderTop: '1px solid #1E293B',
        paddingTop: 56,
        paddingBottom: 40,
        marginTop: 60,
      }}
    >
      <div className="page-container">
        {/* Top Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Col 1: Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img src="/Logo.png" alt="Logo" style={{ height: 36, width: 'auto' }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#38BDF8' }}>Blue Sky</span>
            </div>
            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, marginBottom: 20 }}>
              The global verified property management platform connecting quality tenants with accredited property managers and owners across USA, Canada, UK, Australia, and Europe.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4ADE80' }}>
              <ShieldCheck size={16} /> 100% Inspected & Verified Listings
            </div>
          </div>

          {/* Col 2: Popular Global Cities */}
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>
              Popular Rental Cities
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#94A3B8' }}>
              <Link href="/properties?location=Los%20Angeles" style={{ transition: 'color 0.15s' }}>
                📍 Los Angeles, CA (USA)
              </Link>
              <Link href="/properties?location=Toronto" style={{ transition: 'color 0.15s' }}>
                📍 Toronto, ON (Canada)
              </Link>
              <Link href="/properties?location=London" style={{ transition: 'color 0.15s' }}>
                📍 London, Greater London (UK)
              </Link>
              <Link href="/properties?location=Vancouver" style={{ transition: 'color 0.15s' }}>
                📍 Vancouver, BC (Canada)
              </Link>
              <Link href="/properties?location=Austin" style={{ transition: 'color 0.15s' }}>
                📍 Austin, TX (USA)
              </Link>
            </div>
          </div>

          {/* Col 3: For Providers & Landlords */}
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>
              For Landlords & Agents
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#94A3B8' }}>
              <Link href="/provider/register">List Your Property</Link>
              <Link href="/provider/plans">Listing Access Subscription Plans</Link>
              <Link href="/provider/payment">External Proof Verification</Link>
              <Link href="/faq">Landlord Verification Rules</Link>
              <Link href="/auth/login">Provider Portal Login</Link>
            </div>
          </div>

          {/* Col 4: Trust & Support */}
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>
              Trust & Support Desk
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#94A3B8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={14} color="#38BDF8" /> support@blueskyproperty.com
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={14} color="#38BDF8" /> +1 (800) 555-0199
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={14} color="#38BDF8" /> Private Encrypted Vault
              </div>
              <Link href="/faq" style={{ color: '#38BDF8', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                Search FAQ & Knowledge Base <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid #1E293B',
            paddingTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#64748B',
            textAlign: 'center',
          }}
        >
          <div>
            © {new Date().getFullYear()} Blue Sky Property Management Worldwide LLC. All rights reserved. Equal Housing Opportunity.
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="#" style={{ color: '#94A3B8' }}>Privacy Policy</a>
            <a href="#" style={{ color: '#94A3B8' }}>Terms of Service</a>
            <a href="#" style={{ color: '#94A3B8' }}>Security Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
