import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search, ChevronDown, ChevronUp, HelpCircle, MessageSquare, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { messagesDb } from '@/lib/db';
import { FAQ } from '@/lib/types';
import Link from 'next/link';

export default function FAQPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>('70000001-0000-0000-0000-000000000001');

  useEffect(() => {
    async function loadFaqs() {
      const list = await messagesDb.getFAQs();
      setFaqs(list);
      if (list.length > 0) {
        setOpenId(list[0].id);
      }
    }
    loadFaqs();
  }, []);

  const filtered = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppLayout
      title="Help & FAQ Center | Blue Sky Property"
      isPublic={true}
    >
      <div className="page-container" style={{ padding: '40px 16px 80px 16px', maxWidth: 840 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
            Knowledge Center
          </span>
          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, marginTop: 4, marginBottom: 10 }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Everything you need to know about tenant applications, document verification, and provider listing access.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: 28 }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search questions by keyword (e.g. apply, timeline, documents, provider)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 44, height: 50, borderRadius: 'var(--radius-lg)' }}
          />
        </div>

        {/* FAQ Accordion List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="card card-clickable"
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-lg)',
                }}
                onClick={() => setOpenId(isOpen ? null : faq.id)}
              >
                <div className="flex-between">
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-navy-dark)', paddingRight: 10 }}>
                    {faq.question}
                  </div>
                  {isOpen ? <ChevronUp size={20} color="var(--color-primary)" /> : <ChevronDown size={20} color="var(--color-text-muted)" />}
                </div>

                {isOpen && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid var(--color-surface-subtle)',
                      fontSize: 14,
                      color: 'var(--color-navy-muted)',
                      lineHeight: 1.6,
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still need help? */}
        <div
          style={{
            marginTop: 40,
            padding: 32,
            borderRadius: 'var(--radius-2xl)',
            backgroundColor: 'var(--color-primary-tint)',
            textAlign: 'center',
            border: '1px solid #BAE6FD',
          }}
        >
          <HelpCircle size={32} color="var(--color-primary)" style={{ margin: '0 auto 10px auto' }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Still Have Questions?</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 18 }}>
            Our verified customer support desk and smart assistant are available 24/7.
          </p>
          <Link href="/applicant/messages" className="btn btn-primary btn-sm" style={{ margin: '0 auto', display: 'inline-flex' }}>
            <MessageSquare size={15} /> Chat with Support Desk
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
