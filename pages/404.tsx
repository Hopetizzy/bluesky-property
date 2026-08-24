import React from 'react';
import Link from 'next/link';
import { Home, Search, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function NotFoundPage() {
  return (
    <AppLayout title="Page Not Found | Blue Sky Property" hideNav={true}>
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '80vh',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <AlertCircle size={36} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 8 }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 28, maxWidth: 300 }}>
          The page or property listing you are looking for may have expired or moved.
        </p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/" className="btn btn-primary">
            <Home size={16} /> Return to Home
          </Link>
          <Link href="/properties" className="btn btn-secondary">
            <Search size={16} /> Explore All Properties
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
