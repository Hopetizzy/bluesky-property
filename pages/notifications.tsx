import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';

export default function NotificationsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Determine active role from localStorage or current session
    let role = 'applicant';
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('bluesky_current_role') ||
        localStorage.getItem('user_role') ||
        (localStorage.getItem('provider_session') ? 'provider' : '') ||
        (localStorage.getItem('admin_session') ? 'admin' : '');

      if (storedRole === 'admin' || window.location.pathname.startsWith('/admin')) {
        role = 'admin';
      } else if (storedRole === 'provider' || window.location.pathname.startsWith('/provider')) {
        role = 'provider';
      } else {
        role = 'applicant';
      }
    }

    if (role === 'admin') {
      router.replace('/admin/notifications');
    } else if (role === 'provider') {
      router.replace('/provider/notifications');
    } else {
      router.replace('/applicant/notifications');
    }
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background, #f8fafc)',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      <Loader2 size={36} className="animate-spin" color="var(--color-primary-navy, #0F172A)" style={{ marginBottom: 16 }} />
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary, #64748B)' }}>
        Redirecting to your notifications...
      </p>
    </div>
  );
}
