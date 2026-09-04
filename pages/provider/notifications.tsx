import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  CreditCard,
  Building2,
  Check,
  Loader2,
  Info,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { NotificationItem } from '@/lib/types';

type FilterTab = 'all' | 'unread' | 'applications' | 'payments' | 'system';

export default function ProviderNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      let notifs: NotificationItem[] = [];

      // 1. Fetch from local store (Provider-only)
      const localNotifs = store.getNotifications().filter(
        (n) => n.role === 'provider'
      );

      // 2. Fetch from Supabase (Provider-only)
      if (isSupabaseConfigured()) {
        const { data: dbNotifs } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbNotifs && dbNotifs.length > 0) {
          const mappedDb: NotificationItem[] = dbNotifs
            .filter((n: any) => n.role === 'provider')
            .map((n: any) => ({
              id: String(n.id),
              user_id: n.profile_id || n.user_id || 'provider-1',
              profile_id: n.profile_id || undefined,
              role: 'provider',
              type: n.type || 'info',
              title: n.title,
              message: n.message,
              link_url: n.link_url || undefined,
              is_read: Boolean(n.is_read),
              created_at: n.created_at || new Date().toISOString(),
            }));

          // Merge without duplicates
          const seen = new Set<string>();
          notifs = [...mappedDb, ...localNotifs].filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        } else {
          notifs = localNotifs;
        }
      } else {
        notifs = localNotifs;
      }

      // Sort newest first
      notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(notifs);
    } catch (err) {
      console.warn('Provider notifications load note:', err);
      setNotifications(store.getNotifications());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    store.markNotificationAsRead(id);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Mark read error:', err);
      }
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    store.markAllNotificationsAsRead('provider');

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('is_read', false);
      } catch (err) {
        console.warn('Mark all read error:', err);
      }
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setIsMarkingAll(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === 'unread') return !item.is_read;
      if (activeTab === 'applications') return item.type === 'application' || item.title.toLowerCase().includes('application');
      if (activeTab === 'payments') return item.type === 'payment' || item.title.toLowerCase().includes('payment') || item.title.toLowerCase().includes('plan');
      if (activeTab === 'system') return item.type === 'system' || item.type === 'property' || item.type === 'info';
      return true;
    });
  }, [notifications, activeTab]);

  const getNotificationIcon = (type: string, title: string) => {
    const t = type.toLowerCase();
    const tit = title.toLowerCase();
    if (t === 'application' || tit.includes('application')) {
      return <FileText size={20} color="var(--color-primary-navy)" />;
    }
    if (t === 'payment' || tit.includes('payment') || tit.includes('plan')) {
      return <CreditCard size={20} color="#0284C7" />;
    }
    if (t === 'property' || tit.includes('property') || tit.includes('listing')) {
      return <Building2 size={20} color="#0D9488" />;
    }
    if (t === 'success' || tit.includes('approved') || tit.includes('verified')) {
      return <CheckCircle2 size={20} color="var(--color-success)" />;
    }
    if (t === 'warning' || tit.includes('alert') || tit.includes('rejected')) {
      return <AlertTriangle size={20} color="var(--color-warning)" />;
    }
    return <Bell size={20} color="var(--color-primary-navy)" />;
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <AppLayout title="Provider Notifications | Blue Sky Property" headerTitle="Provider Notifications">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 80px' }}>
        
        {/* Navigation & Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/provider"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} />
              Dashboard
            </Link>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={22} color="var(--color-primary-navy)" />
                Provider Notifications
              </h1>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                Real-time updates on tenant applications, listing plans, and property reviews
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={loadNotifications}
              disabled={isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-main)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-navy)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Check size={14} />
                Mark All Read ({unreadCount})
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 8,
            marginBottom: 20,
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {[
            { id: 'all', label: 'All Alerts', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'applications', label: 'Applications', count: notifications.filter((n) => n.type === 'application' || n.title.toLowerCase().includes('application')).length },
            { id: 'payments', label: 'Plans & Payments', count: notifications.filter((n) => n.type === 'payment' || n.title.toLowerCase().includes('payment') || n.title.toLowerCase().includes('plan')).length },
            { id: 'system', label: 'System & Listings', count: notifications.filter((n) => n.type === 'system' || n.type === 'property' || n.type === 'info').length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: isActive ? '1px solid var(--color-primary, #0066FF)' : '1px solid transparent',
                  backgroundColor: isActive ? 'var(--color-primary, #0066FF)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: '1px 6px',
                      borderRadius: 10,
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--color-surface)',
                      color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                      fontWeight: 700,
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Loader2 size={32} className="animate-spin" color="var(--color-primary-navy)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Loading provider notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: 'var(--color-background)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Bell size={24} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 6px' }}>
              No notifications in this category
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 20px', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
              You will receive instant alerts here when tenants submit applications, when payments are verified, or when property listings change status.
            </p>
            {activeTab !== 'all' && (
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View All Notifications
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredNotifications.map((notif) => {
              const icon = getNotificationIcon(notif.type, notif.title);
              const targetUrl = notif.link_url || (notif.type === 'application' ? '/provider/properties' : notif.type === 'payment' ? '/provider/payments' : '/provider');

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) handleMarkAsRead(notif.id);
                    if (targetUrl) router.push(targetUrl);
                  }}
                  style={{
                    backgroundColor: notif.is_read ? 'var(--color-surface)' : 'var(--color-white, #ffffff)',
                    border: notif.is_read ? '1px solid var(--color-border)' : '1.5px solid var(--color-primary-navy)',
                    boxShadow: notif.is_read ? 'none' : '0 2px 8px rgba(15, 23, 42, 0.06)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  {/* Icon Container */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: notif.is_read ? 'var(--color-background)' : 'rgba(15, 23, 42, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: notif.is_read ? 600 : 700, color: 'var(--color-text-main)' }}>
                          {notif.title}
                        </span>
                        {!notif.is_read && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: 'var(--color-primary-navy)',
                              color: '#ffffff',
                            }}
                          >
                            New
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        {formatTimeAgo(notif.created_at)}
                      </span>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 10px', lineHeight: 1.45 }}>
                      {notif.message}
                    </p>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--color-primary-navy)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        View Details <ExternalLink size={12} />
                      </span>

                      {!notif.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
