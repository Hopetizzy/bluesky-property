import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Shield,
  ShieldCheck,
  Lock,
  FileText,
  Eye,
  CheckCircle2,
  Database,
  UserCheck,
  Server,
  ArrowLeft,
  Mail,
  Scale,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <AppLayout title="Privacy Policy & Data Protection | Blue Sky Property" headerTitle="Privacy Policy">
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
            <ShieldCheck size={13} /> Official Legal Policy
          </span>
        </div>

        {/* Page Title Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-navy-dark)', margin: 0, lineHeight: 1.2 }}>
            Privacy Policy & Data Collection Disclosures
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
            Last Updated: September 2026 • Worldwide Scope (United States, Canada, United Kingdom, Australia, Europe)
          </p>
        </div>

        {/* Highlights Banner Card */}
        <div
          style={{
            padding: 24,
            borderRadius: 'var(--radius-xl)',
            backgroundColor: '#0F172A',
            color: 'white',
            marginBottom: 36,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Lock size={22} color="#38BDF8" />
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Our Commitment to Applicant Privacy & Bank-Grade Vault Security
            </h2>
          </div>
          <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
            Blue Sky Property Management is committed to protecting your fundamental privacy rights. We collect and process sensitive rental applicant information strictly for verified property underwriting, tenant screening under the Fair Credit Reporting Act (FCRA), and lease administration. All sensitive documents are isolated inside encrypted vaults with multi-factor authentication and strict role-based access.
          </p>
        </div>

        {/* Policy Body Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, fontSize: 14, color: 'var(--color-navy-dark)', lineHeight: 1.7 }}>
          {/* Section 1 */}
          <section className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0, 102, 255, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                1
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--color-navy-dark)' }}>
                Categories of Data We Collect
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              To facilitate rental applications, property verifications, and lease contracting, Blue Sky Property collects the following categories of personal and financial information:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              <div style={{ padding: 14, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)' }}>
                <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: 4 }}>
                  Personal Identifiers
                </strong>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Full legal name, email address, mobile telephone number, date of birth, nationality, and residential addresses.
                </span>
              </div>

              <div style={{ padding: 14, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)' }}>
                <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: 4 }}>
                  Government Identification & SSN
                </strong>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Driver's license, passport, national identity cards (front & back scans), and Social Security Number / Tax ID for FCRA background checks.
                </span>
              </div>

              <div style={{ padding: 14, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)' }}>
                <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: 4 }}>
                  Employment & Financial Records
                </strong>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Employer name, occupation, monthly income, paystubs, W-2 forms, and bank verification statements.
                </span>
              </div>

              <div style={{ padding: 14, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)' }}>
                <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: 4 }}>
                  Payment Receipts & Invoices
                </strong>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Wire transaction screenshots, application fee remittance proofs, and provider subscription invoices.
                </span>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0, 102, 255, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                2
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--color-navy-dark)' }}>
                How We Use Collected Information
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 14 }}>
              We process your data only for legitimate, lawful purposes related to real estate transactions:
            </p>

            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10, color: 'var(--color-text-secondary)' }}>
              <li>
                <strong style={{ color: 'var(--color-navy-dark)' }}>Tenant Underwriting & Screening:</strong> Evaluating rental qualifications, calculating rent-to-income coverage ratios (minimum 2.5x threshold), and verifying employment stability.
              </li>
              <li>
                <strong style={{ color: 'var(--color-navy-dark)' }}>Identity & Fraud Prevention:</strong> Validating government IDs against anti-fraud registries to protect homeowners, property managers, and fellow residents.
              </li>
              <li>
                <strong style={{ color: 'var(--color-navy-dark)' }}>Background & Credit Screening:</strong> Authorized screening reports executed strictly under the provisions of the Fair Credit Reporting Act (15 U.S.C. § 1681).
              </li>
              <li>
                <strong style={{ color: 'var(--color-navy-dark)' }}>Lease Contract Execution:</strong> Drafting legal residential tenancy agreements and coordinating move-in dates between approved tenants and property managers.
              </li>
              <li>
                <strong style={{ color: 'var(--color-navy-dark)' }}>Platform Communications:</strong> Sending automated email and in-app status updates regarding application approvals, lease signings, or requested clarifications.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0, 102, 255, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                3
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--color-navy-dark)' }}>
                Encrypted Storage Vault & Security Architecture
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 14 }}>
              Blue Sky maintains industry-standard physical, technical, and administrative safeguards to protect your records:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, backgroundColor: 'var(--color-surface-subtle)', borderRadius: 8 }}>
                <Server size={18} color="var(--color-primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--color-navy-dark)', fontSize: 13 }}>AES-256 Rest Encryption:</strong>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    All uploaded identification cards, paystubs, utility bills, and payment receipts are encrypted in transit via TLS 1.3 and stored in isolated storage vaults with 256-bit Advanced Encryption Standard.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, backgroundColor: 'var(--color-surface-subtle)', borderRadius: 8 }}>
                <UserCheck size={18} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--color-navy-dark)', fontSize: 13 }}>Role-Based Access Control (RBAC):</strong>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Sensitive records (including SSN and financial documents) are strictly inaccessible to the general public and are restricted exclusively to authorized administrative underwriters.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0, 102, 255, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                4
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--color-navy-dark)' }}>
                Your Privacy Rights (CCPA, GDPR & Worldwide Regulations)
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Depending on your location, you hold specific legal rights regarding your personal information:
            </p>

            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--color-text-secondary)' }}>
              <li>
                <strong style={{ color: 'var(--color-navy-dark)' }}>Right to Access / Know:</strong> You may request a complete export of all data stored within your Blue Sky account vault.
              </li>
              <li>
                <strong style={{ color: 'var(--color-navy-dark)' }}>Right to Rectification:</strong> You may correct inaccurate or outdated personal details through your profile dashboard or by contacting support.
              </li>
              <li>
                <strong style={{ color: 'var(--color-navy-dark)' }}>Right to Deletion / Erasure:</strong> You may request permanent deletion of your account and uploaded files, subject to statutory tax and real estate ledger retention requirements.
              </li>
              <li>
                <strong style={{ color: 'var(--color-navy-dark)' }}>No Sale of Personal Data:</strong> We never sell, rent, or trade applicant personal or financial information to marketing data brokers.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="card" style={{ padding: 24, borderRadius: 'var(--radius-xl)', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0, 102, 255, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                5
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--color-navy-dark)' }}>
                Data Protection Officer & Contact
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 14 }}>
              For privacy inquiries, data subject access requests (DSAR), or compliance verification:
            </p>

            <div style={{ padding: 14, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-subtle)', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div>
                <strong>Blue Sky Property Management LLC — Legal & Privacy Compliance</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)' }}>
                <Mail size={14} color="var(--color-primary)" />
                <span>privacy@blueskyproperty.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)' }}>
                <Globe size={14} color="var(--color-primary)" />
                <span>Equal Housing Opportunity Compliance Desk</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
