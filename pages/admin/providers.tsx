import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Users, Building, Clock, ShieldCheck, Mail, Phone } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { store } from '@/lib/store';

export default function AdminProvidersPage() {
  const router = useRouter();

  const providers = [
    {
      id: 'prov-1',
      name: 'Pacific Heights Realty LLC',
      type: 'brokerage',
      email: 'manager@pacificheights.com',
      phone: '+1 (415) 555-0188',
      license: 'DRE #01928472',
      status: 'active',
      plan: '90 Days Access',
      daysLeft: 70,
      activePropertiesCount: 2,
    },
    {
      id: 'prov-2',
      name: 'Kensington Residential UK',
      type: 'agent',
      email: 'lettings@kensingtonres.co.uk',
      phone: '+44 20 7946 0912',
      license: 'ARLA #884910',
      status: 'active',
      plan: '180 Days Access',
      daysLeft: 142,
      activePropertiesCount: 1,
    },
    {
      id: 'prov-3',
      name: 'Austin Premier Properties',
      type: 'property_manager',
      email: 'contact@austinpremier.com',
      phone: '+1 (512) 555-0133',
      license: 'TREC #0582910',
      status: 'pending',
      plan: '90 Days Access (Payment Pending)',
      daysLeft: 0,
      activePropertiesCount: 1,
    },
  ];

  return (
    <AppLayout title="Provider Management | Blue Sky Admin" headerTitle="Provider Management">
      <div style={{ padding: '16px 16px 80px 16px' }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <button
            onClick={() => router.push('/admin')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--color-navy-dark)',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 800 }}>Registered Providers</h1>
          <div style={{ width: 20 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {providers.map((p) => (
            <div key={p.id} className="card" style={{ margin: 0, padding: 14 }}>
              <div className="flex-between" style={{ marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {p.type.replace('_', ' ')} • {p.license}
                  </div>
                </div>
                <Badge variant={p.status === 'active' ? 'active' : 'pending'}>
                  {p.status.toUpperCase()}
                </Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={13} /> {p.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} /> {p.phone}
                </div>
              </div>

              <div className="flex-between" style={{ borderTop: '1px solid var(--color-surface-subtle)', paddingTop: 10, marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: p.daysLeft > 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {p.daysLeft > 0 ? `🟢 ${p.daysLeft} Days Access Left` : '🟡 Payment Verification Required'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {p.activePropertiesCount} Active Properties
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
