import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Shield,
  Building2,
  Users,
  CreditCard,
  FileCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  PlusCircle,
  RefreshCw,
  TrendingUp,
  Settings,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  Layers,
  Search,
  Activity,
  Check,
  X,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { propertiesDb } from '@/lib/db/properties';
import { listingPlansDb } from '@/lib/db/listingPlans';
import { applicationsDb } from '@/lib/db/applications';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { Property, ProviderPayment, RentalApplication } from '@/lib/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<ProviderPayment[]>([]);
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [providersCount, setProvidersCount] = useState<number>(0);
  const [activePeriodsCount, setActivePeriodsCount] = useState<number>(0);
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const [propsData, paymentsData, appsData, providersRes, periodsRes] = await Promise.all([
          propertiesDb.getAllPropertiesForAdmin(),
          listingPlansDb.getAllPaymentsForAdmin(),
          applicationsDb.getApplications(),
          supabase.from('provider_profiles').select('id', { count: 'exact', head: true }),
          supabase.from('provider_listing_periods').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        ]);

        setProperties(propsData);
        setPayments(paymentsData);
        setApplications(appsData);
        setProvidersCount(providersRes.count || 0);
        setActivePeriodsCount(periodsRes.count || 0);
        setDbConnected(true);
      } else {
        // Local Fallback
        setProperties(store.getProperties());
        setPayments(store.getProviderPayments());
        setApplications(store.getApplications());
        setProvidersCount(1);
        setActivePeriodsCount(1);
        setDbConnected(false);
      }
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
      setProperties(store.getProperties());
      setPayments(store.getProviderPayments());
      setApplications(store.getApplications());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Metrics
  const totalProps = properties.length;
  const publishedProps = properties.filter((p) => p.status === 'approved').length;
  const pendingProps = properties.filter(
    (p) => p.status === 'pending_verification' || p.status === 'draft'
  ).length;
  const rejectedProps = properties.filter((p) => p.status === 'rejected' || p.status === 'suspended').length;

  const pendingPayments = payments.filter((p) => p.status === 'pending').length;
  const verifiedPayments = payments.filter((p) => p.status === 'verified');
  const totalRevenue = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingApps = applications.filter((a) => a.status === 'under_review' || a.status === 'submitted').length;
  const approvedApps = applications.filter((a) => a.status === 'approved').length;

  const totalUrgentItems = pendingProps + pendingPayments + pendingApps;

  return (
    <AppLayout title="Super Admin Command Center | Blue Sky Property" headerTitle="Super Admin Console">
      <div style={{ padding: '24px 16px 80px 16px', maxWidth: 1120, margin: '0 auto' }}>
        {/* Top Operational Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(0, 102, 255, 0.08)',
                  color: 'var(--color-primary)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                <Shield size={12} /> Command Tower
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: dbConnected ? '#22C55E' : '#3B82F6',
                    display: 'inline-block',
                  }}
                />
                {dbConnected ? 'Live Supabase Connected' : 'Local Data Engine'}
              </span>
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: 'var(--color-navy-dark)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Operations Command Center
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 0 }}>
              Live metrics, review queues, financial settlements, and inventory governance.
            </p>
          </div>

          {/* Header Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            {/* Easily Accessible Settings Button */}
            <Link
              href="/admin/settings"
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Settings size={14} />
              <span>Settings</span>
            </Link>

            <Link
              href="/admin/messages"
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <MessageSquare size={14} />
              <span>Support Inquiries</span>
            </Link>

            <Link
              href="/admin/properties/create"
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <PlusCircle size={14} />
              <span>New Property</span>
            </Link>
          </div>
        </div>

        {/* 4 Primary KPI Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 14,
            marginBottom: 24,
          }}
        >
          {/* Card 1: Properties Registry */}
          <div
            className="card"
            style={{
              margin: 0,
              padding: '18px 16px',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="flex-between" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Properties
              </span>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: 'rgba(0, 102, 255, 0.1)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={18} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-navy-dark)', lineHeight: 1 }}>
              {totalProps}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, fontSize: 12 }}>
              <span style={{ color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> {publishedProps} Live
              </span>
              {pendingProps > 0 && (
                <span style={{ color: 'var(--color-danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} /> {pendingProps} Pending
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Verified Revenue */}
          <div
            className="card"
            style={{
              margin: 0,
              padding: '18px 16px',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="flex-between" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Verified Revenue
              </span>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DollarSign size={18} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-navy-dark)', lineHeight: 1 }}>
              ${totalRevenue.toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12 }}>
              {pendingPayments > 0 ? (
                <span style={{ color: '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> {pendingPayments} Payments to Audit
                </span>
              ) : (
                <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check size={12} /> All Proofs Settled
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Rental Applications */}
          <div
            className="card"
            style={{
              margin: 0,
              padding: '18px 16px',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="flex-between" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Applications
              </span>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileCheck size={18} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-navy-dark)', lineHeight: 1 }}>
              {applications.length}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, fontSize: 12 }}>
              <span style={{ color: 'var(--color-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {pendingApps} In Review
              </span>
              <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> {approvedApps} Approved
              </span>
            </div>
          </div>

          {/* Card 4: Providers & Active Plans */}
          <div
            className="card"
            style={{
              margin: 0,
              padding: '18px 16px',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="flex-between" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Provider Accounts
              </span>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: 'rgba(147, 51, 234, 0.1)',
                  color: '#9333EA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={18} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-navy-dark)', lineHeight: 1 }}>
              {providersCount || 1}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12 }}>
              <span style={{ color: '#9333EA', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={12} /> {activePeriodsCount || 1} Active Listing Periods
              </span>
            </div>
          </div>
        </div>

        {/* Action Required Queue Section */}
        <div style={{ marginBottom: 28 }}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Urgent Action Required
              </div>
              {totalUrgentItems > 0 && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {totalUrgentItems} Pending
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Queue Item 1: Pending Properties */}
            <Link
              href="/admin/properties"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: pendingProps > 0 ? '#FEF2F2' : 'var(--color-white)',
                border: pendingProps > 0 ? '1px solid #FECACA' : '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
                textDecoration: 'none',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    backgroundColor: pendingProps > 0 ? '#EF4444' : 'var(--color-surface-subtle)',
                    color: pendingProps > 0 ? 'white' : 'var(--color-navy-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                    {pendingProps > 0
                      ? `${pendingProps} Property Listings Awaiting Verification`
                      : 'All Property Listings Verified & Current'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Inspect address authenticity, image proofs, unit counts & pricing
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {pendingProps > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>Inspect Queue</span>
                )}
                <ChevronRight size={18} color={pendingProps > 0 ? '#DC2626' : 'var(--color-text-muted)'} />
              </div>
            </Link>

            {/* Queue Item 2: Pending Payments */}
            <Link
              href="/admin/payments"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: pendingPayments > 0 ? '#FFFBEB' : 'var(--color-white)',
                border: pendingPayments > 0 ? '1px solid #FDE68A' : '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
                textDecoration: 'none',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    backgroundColor: pendingPayments > 0 ? '#F59E0B' : 'var(--color-surface-subtle)',
                    color: pendingPayments > 0 ? 'white' : 'var(--color-navy-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CreditCard size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                    {pendingPayments > 0
                      ? `${pendingPayments} Provider Payment Proofs Awaiting Audit`
                      : 'All Provider Payment Proofs Audited'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Verify transfer receipts and trigger automatic RPC listing renewals
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {pendingPayments > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#D97706' }}>Audit Payments</span>
                )}
                <ChevronRight size={18} color={pendingPayments > 0 ? '#D97706' : 'var(--color-text-muted)'} />
              </div>
            </Link>

            {/* Queue Item 3: Pending Applications */}
            <Link
              href="/admin/applications"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: pendingApps > 0 ? '#EFF6FF' : 'var(--color-white)',
                border: pendingApps > 0 ? '1px solid #BFDBFE' : '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
                textDecoration: 'none',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    backgroundColor: pendingApps > 0 ? '#0066FF' : 'var(--color-surface-subtle)',
                    color: pendingApps > 0 ? 'white' : 'var(--color-navy-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                    {pendingApps > 0
                      ? `${pendingApps} Rental Applications Pending Decision`
                      : 'Rental Applications Queue Clear'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Review tenant background, income ratios, and government identity vaults
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {pendingApps > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0066FF' }}>Screen Queue</span>
                )}
                <ChevronRight size={18} color={pendingApps > 0 ? '#0066FF' : 'var(--color-text-muted)'} />
              </div>
            </Link>
          </div>
        </div>

        {/* Administrative Modules Grid */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Administrative Operations Suite
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {/* Module 1: Properties Registry */}
            <Link
              href="/admin/properties"
              className="card"
              style={{
                margin: 0,
                padding: '20px 18px',
                borderRadius: 'var(--radius-xl)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
              }}
            >
              <div>
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: 'rgba(0, 102, 255, 0.1)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Building2 size={20} />
                  </div>
                  <Badge variant="approved">{publishedProps} Active</Badge>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                  Properties Registry
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                  Review provider listings, toggle featured badges, and manage first-party inventory worldwide.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
                Open Registry <ArrowRight size={14} />
              </div>
            </Link>

            {/* Module 2: Providers Hub */}
            <Link
              href="/admin/providers"
              className="card"
              style={{
                margin: 0,
                padding: '20px 18px',
                borderRadius: 'var(--radius-xl)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
              }}
            >
              <div>
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: 'rgba(2, 132, 199, 0.1)',
                      color: '#0284C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Users size={20} />
                  </div>
                  <Badge variant="approved">Verified Hub</Badge>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                  Providers Directory
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                  Manage registered real estate agencies, verify broker licenses, and audit listing periods.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, fontSize: 12, fontWeight: 700, color: '#0284C7' }}>
                Manage Providers <ArrowRight size={14} />
              </div>
            </Link>

            {/* Module 3: Payments Desk */}
            <Link
              href="/admin/payments"
              className="card"
              style={{
                margin: 0,
                padding: '20px 18px',
                borderRadius: 'var(--radius-xl)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
              }}
            >
              <div>
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      color: '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CreditCard size={20} />
                  </div>
                  <Badge variant={pendingPayments > 0 ? 'warning' : 'approved'}>
                    {pendingPayments > 0 ? `${pendingPayments} Pending` : 'Audited'}
                  </Badge>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                  Payments Verification
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                  Inspect transfer proofs, confirm bank credits, and trigger automated period renewals.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, fontSize: 12, fontWeight: 700, color: '#D97706' }}>
                Audit Payments <ArrowRight size={14} />
              </div>
            </Link>

            {/* Module 4: Plans & Fee Settings */}
            <Link
              href="/admin/plans"
              className="card"
              style={{
                margin: 0,
                padding: '20px 18px',
                borderRadius: 'var(--radius-xl)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
              }}
            >
              <div>
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: 'rgba(147, 51, 234, 0.1)',
                      color: '#9333EA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Layers size={20} />
                  </div>
                  <Badge variant="active">Listing Tiers</Badge>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                  Listing Plans & Rates
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                  Configure provider tier durations, multi-currency fees, and application processing settings.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, fontSize: 12, fontWeight: 700, color: '#9333EA' }}>
                Manage Listing Plans <ArrowRight size={14} />
              </div>
            </Link>

            {/* Module 5: Rental Applications */}
            <Link
              href="/admin/applications"
              className="card"
              style={{
                margin: 0,
                padding: '20px 18px',
                borderRadius: 'var(--radius-xl)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
              }}
            >
              <div>
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      color: 'var(--color-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileCheck size={20} />
                  </div>
                  <Badge variant="approved">{applications.length} Total</Badge>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                  Applications Audit
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                  Comprehensive tenant screening, income verification, document review, and decisioning.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, fontSize: 12, fontWeight: 700, color: 'var(--color-success)' }}>
                Review Queue <ArrowRight size={14} />
              </div>
            </Link>

            {/* Module 6: Account Security & Settings */}
            <Link
              href="/admin/settings"
              className="card"
              style={{
                margin: 0,
                padding: '20px 18px',
                borderRadius: 'var(--radius-xl)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: 'var(--color-surface-subtle)',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
              }}
            >
              <div>
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: '#0F172A',
                      color: '#38BDF8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Settings size={20} />
                  </div>
                  <Badge variant="info">Security</Badge>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                  Account & Security
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                  Change administrator password with old password verification, manage profile & preferences.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                Open Settings <ArrowRight size={14} />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
