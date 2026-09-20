import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ShieldCheck,
  Lock,
  FileCheck2,
  Server,
  UserCheck,
  ArrowLeft,
  Scale,
  Globe,
  CheckCircle2,
  Database,
  Building,
  AlertCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function PoliciesPage() {
  const router = useRouter();

  return (
    <AppLayout title="Data Security & Fair Housing Policies | Blue Sky Property" headerTitle="Platform Policies">
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
            <ShieldCheck size={13} /> Compliance Standards
          </span>
        </div>

        {/* Page Title Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-navy-dark)', margin: 0, lineHeight: 1.2 }}>
            Data Security Vault & Fair Housing Compliance
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
            Comprehensive Standards on Document Vault Encryption, Equal Housing Opportunity, and Underwriting Governance
          </p>
        </div>

        {/* Policy Body Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontSize: 14, color: 'var(--color-navy-dark)', lineHeight: 1.7 }}>
          {/* Section 1: Equal Housing Opportunity */}
          <section className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={18} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--color-navy-dark)' }}>
                1. Equal Housing Opportunity Statement
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Blue Sky Property Management strictly complies with the Federal Fair Housing Act (Title VIII of the Civil Rights Act of 1968), the Canadian Human Rights Act, and corresponding provincial and state human rights legislation.
            </p>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              We do not discriminate against any applicant, tenant, or prospective resident on the basis of race, color, religion, sex, disability, familial status, national origin, sexual orientation, gender identity, source of income, or veteran status. All underwriting criteria (income multiples, rental history, and identity verification) are applied consistently and objectively.
            </p>
          </section>

          {/* Section 2: Vault Encryption & Storage Isolation */}
          <section className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0, 102, 255, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={18} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--color-navy-dark)' }}>
                2. Encrypted Document Vault Specifications
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Our proprietary private storage vaults ensure maximum confidentiality:
            </p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--color-text-secondary)', margin: 0 }}>
              <li>
                <strong>Data in Transit:</strong> All file transmissions are encrypted utilizing TLS 1.3 cryptographic protocols with perfect forward secrecy.
              </li>
              <li>
                <strong>Data at Rest:</strong> Government IDs and financial proofs are stored in isolated private S3 buckets utilizing server-side AES-256 encryption.
              </li>
              <li>
                <strong>Access Token Expiry:</strong> Direct file viewing links generated for underwriter review utilize time-limited cryptographically signed URLs that expire automatically.
              </li>
              <li>
                <strong>Zero Public Indexing:</strong> Applicant documents are excluded from public search engines and web crawlers.
              </li>
            </ul>
          </section>

          {/* Section 3: FCRA Background Check Protocol */}
          <section className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileCheck2 size={18} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--color-navy-dark)' }}>
                3. Fair Credit Reporting Act (FCRA) Compliance
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Under the FCRA, applicants have the right to know what information is contained in their screening reports:
            </p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--color-text-secondary)', margin: 0 }}>
              <li>Adverse Action Notices are delivered in writing if an application cannot be approved due to screening findings.</li>
              <li>Applicants receive the contact details of the consumer reporting agency that provided the report.</li>
              <li>Applicants hold the statutory right to dispute inaccurate information directly with the credit bureau.</li>
            </ul>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
