import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ApplicationSuccessPage() {
  const router = useRouter();
  const { ref } = router.query;

  const appRef = (ref as string) || 'BS-10293';

  return (
    <AppLayout title="Application Submitted | Blue Sky" hideNav={true} hideHeader={true}>
      <div
        style={{
          padding: '48px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
          justifyContent: 'center',
        }}
      >
        {/* Animated Green Circle Checkmark */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            backgroundColor: '#DCFCE7',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            boxShadow: '0 0 0 12px rgba(34, 197, 94, 0.1)',
          }}
        >
          <CheckCircle size={52} strokeWidth={2.5} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 8 }}>
          Application Submitted!
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          Your rental application has been successfully received.
        </p>

        {/* Reference ID Pill */}
        <div
          style={{
            backgroundColor: 'var(--color-primary-tint)',
            color: 'var(--color-primary)',
            fontSize: 13,
            fontWeight: 700,
            padding: '6px 16px',
            borderRadius: 9999,
            marginBottom: 32,
            border: '1px solid #BAE6FD',
          }}
        >
          Application Ref: {appRef}
        </div>

        {/* What Happens Next Card */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            textAlign: 'left',
            marginBottom: 32,
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 16 }}>
            What happens next?
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-navy-dark)', lineHeight: 1.4 }}>
                <strong>Document Review:</strong> Our administrative team will review your submitted information and identity documents.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-navy-dark)', lineHeight: 1.4 }}>
                <strong>Real-time Updates:</strong> You will receive notifications as your application moves from Under Review to Decision.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-navy-dark)', lineHeight: 1.4 }}>
                <strong>Track Anytime:</strong> Check status, message landlords, or upload extra files in your Applicant Portal.
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/applicant/applications" className="btn btn-primary">
            Go to My Applications <ArrowRight size={16} />
          </Link>
          <Link href="/" className="btn btn-secondary">
            <Home size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
