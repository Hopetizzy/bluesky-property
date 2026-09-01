import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Globe, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { DEFAULT_SITE_CONFIG, SiteConfigSettings } from '@/pages/api/settings/site-config';

export const PublicFooter: React.FC = () => {
  const [config, setConfig] = useState<SiteConfigSettings>(DEFAULT_SITE_CONFIG);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/settings/site-config');
        const json = await res.json();
        if (json.success && json.data) {
          setConfig(json.data);
        }
      } catch (err) {
        console.warn('Footer site-config load note:', err);
      }
    }
    loadConfig();
  }, []);

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
          {/* Col 1: Brand Info & Social Links */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img src="/Logo.png" alt="Logo" style={{ height: 36, width: 'auto' }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#38BDF8' }}>Blue Sky</span>
            </div>
            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, marginBottom: 16 }}>
              The global verified property management platform connecting quality tenants with accredited property managers and owners across USA, Canada, UK, Australia, and Europe.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4ADE80', marginBottom: 18 }}>
              <ShieldCheck size={16} /> 100% Inspected & Verified Listings
            </div>

            {/* Dynamic Social Media Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {config.facebook_url && (
                <a
                  href={config.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                  title="Facebook"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
              )}
              {config.twitter_url && (
                <a
                  href={config.twitter_url}
                  target="_blank"
                  rel="noreferrer"
                  title="X (Twitter)"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {config.instagram_url && (
                <a
                  href={config.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  title="Instagram"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
              )}
              {config.linkedin_url && (
                <a
                  href={config.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  title="LinkedIn"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
                  </svg>
                </a>
              )}
              {config.youtube_url && (
                <a
                  href={config.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  title="YouTube"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
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
                <Mail size={14} color="#38BDF8" />
                <a href={`mailto:${config.support_email}`} style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  {config.support_email}
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={14} color="#38BDF8" />
                <a href={`tel:${config.support_phone}`} style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  {config.support_phone}
                </a>
              </div>
              {config.office_address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#64748B' }}>
                  <MapPin size={14} color="#38BDF8" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{config.office_address}</span>
                </div>
              )}
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

