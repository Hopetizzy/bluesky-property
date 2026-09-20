import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Scale,
  DollarSign,
  Building,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function TermsOfServicePage() {
  const router = useRouter();

  return (
    <AppLayout title="Terms of Service & Application Agreement | Blue Sky Property" headerTitle="Terms of Service">
      <div style={{ padding: '32px 16px 80px 16px', maxWidth: 900, margin: '0 auto' }}>
        {/* Back Navigation & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--color-navy-dark)',
              padding: 0,
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(0, 102, 255, 0.08)',
              color: 'var(--color-primary)',
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Scale size={13} /> Terms & User Agreement
          </span>
        </div>

        {/* Page Title Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-navy-dark)', margin: 0, lineHeight: 1.2 }}>
            Terms of Service & Rental Application Agreement
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
            Effective Date: September 2026 • Governing Terms for Tenants, Property Providers, and Platform Users
          </p>
        </div>

        {/* Terms Content Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontSize: 14, color: 'var(--color-navy-dark)', lineHeight: 1.7 }}>
          {/* Section 1 */}
          <section className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', margin: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 10px 0', color: 'var(--color-navy-dark)' }}>
              1. Acceptance of Terms & Eligibility
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              By accessing the Blue Sky Property Management platform, applying for rental residences, or listing residential properties, you agree to be bound by these Terms of Service. All applicants must be at least 18 years of age and legally competent to enter into residential tenancy agreements under applicable state, provincial, and national laws.
            </p>
          </section>

          {/* Section 2 */}
          <section className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', margin: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 10px 0', color: 'var(--color-navy-dark)' }}>
              2. Truthfulness & Accuracy Certification
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              When completing standard or direct rental applications, you certify that:
            </p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--color-text-secondary)', margin: 0 }}>
              <li>All personal identifiers, dates of birth, and contact numbers provided are accurate and belong to you.</li>
              <li>All uploaded documents (paystubs, bank records, government IDs) are authentic, unedited, and verifiable.</li>
              <li>Material misrepresentations, forged proofs, or fraudulent SSN inputs will result in immediate application rejection, termination of tenancy, and potential referral to authorities.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', margin: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 10px 0', color: 'var(--color-navy-dark)' }}>
              3. Application & Screening Fees
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Application processing and background verification fees cover the direct out-of-pocket costs of credit bureau inquiries, criminal history screening, and identity vault processing. Unless expressly required otherwise by applicable local jurisdiction laws, application processing fees are non-refundable once background screening has commenced.
            </p>
          </section>

          {/* Section 4 */}
          <section className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', margin: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 10px 0', color: 'var(--color-navy-dark)' }}>
              4. Property Provider Standards & Verified Listings
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Property managers and landlords using the platform must hold authentic ownership or authorized management rights for all listed properties. All properties undergo administrative review before public publication. Blue Sky reserves the right to suspend or delete any listing that violates Fair Housing standards or misrepresents unit amenities or pricing.
            </p>
          </section>

          {/* Section 5 */}
          <section className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', margin: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 10px 0', color: 'var(--color-navy-dark)' }}>
              5. Governing Law & Dispute Resolution
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              These Terms shall be construed and governed in accordance with the laws of the jurisdiction where the target property is situated, without regard to conflicts of law principles. Any dispute arising under these terms shall be resolved through good-faith administrative mediation prior to formal proceedings.
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
