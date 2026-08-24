import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Bell, CheckCircle2, Clock, AlertTriangle, Shield, Check, Loader2, Info } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { NotificationItem } from '@/lib/types';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      setIsLoading(true);
      try {
        let notifs: NotificationItem[] = [];

        if (isSupabaseConfigured()) {
          const { data: dbNotifs } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

          if (dbNotifs && dbNotifs.length > 0) {
            notifs = dbNotifs.map((n: any) => ({
              id: String(n.id),
              user_id: n.profile_id || n.user_id || 'user-1',
              type: n.type || 'info',
              title: n.title,
              message: n.message,
              link_url: n.link_url || undefined,
              is_read: Boolean(n.is_read),
              created_at: n.created_at || new Date().toISOString(),
            }));
          }
        }

        if (notifs.length === 0) {
          notifs = store.getNotifications();
        }

        setNotifications(notifs);
      } catch (err) {
        console.warn('Notifications load note:', err);
        setNotifications(store.getNotifications());
      } finally {
        setIsLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
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
    notifications.forEach((n) => store.markNotificationAsRead(n.id));

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
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppLayout title="Notifications | Blue Sky Property" headerTitle="Notifications">
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '24px 16px 60px 16px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              color: 'var(--color-navy-dark)',
              backgroundColor: 'var(--color-white)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
            Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
          </h1>

          {unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Mark all read
            </button>
          ) : (
            <div style={{ width: 60 }} />
          )}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Loader2 size={32} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto 10px auto' }} />
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading notification updates...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              borderRadius: 'var(--radius-2xl)',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Bell size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-navy-dark)' }}>No notifications yet</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              You will receive automated updates here regarding your applications, listings, and messages.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map((n) => {
              const isExpiration = n.type.includes('expir');
              const isSuccess = n.type.includes('approv') || n.type.includes('success');

              return (
                <Link
                  key={n.id}
                  href={n.link_url || '#'}
                  onClick={() => handleMarkAsRead(n.id)}
                  className="card"
                  style={{
                    margin: 0,
                    display: 'flex',
                    gap: 16,
                    padding: 18,
                    borderRadius: 'var(--radius-xl)',
                    backgroundColor: n.is_read ? 'var(--color-white)' : '#F0F9FF',
                    border: n.is_read ? '1px solid var(--color-border)' : '1px solid #BAE6FD',
                    boxShadow: n.is_read ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 14px rgba(14, 165, 233, 0.1)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: isExpiration ? '#FEF3C7' : isSuccess ? '#DCFCE7' : 'var(--color-primary-tint)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isExpiration ? (
                      <AlertTriangle size={20} color="#D97706" />
                    ) : isSuccess ? (
                      <CheckCircle2 size={20} color="#16A34A" />
                    ) : (
                      <Info size={20} color="var(--color-primary)" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div className="flex-between">
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                        {n.title}
                      </div>
                      {!n.is_read && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.45 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
                      {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
