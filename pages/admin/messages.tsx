import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  Search,
  Send,
  User,
  Building,
  FileText,
  Clock,
  Shield,
  Bot,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Phone,
  Mail,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { Message, Conversation } from '@/lib/types';
import { createNotification } from '@/lib/notificationService';

export default function AdminMessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadAllConversations = async () => {
    setIsLoading(true);
    try {
      let convList: Conversation[] = [];

      if (isSupabaseConfigured()) {
        const { data: dbConvos, error } = await supabase
          .from('conversations')
          .select('*')
          .order('last_message_at', { ascending: false });

        if (!error && dbConvos && dbConvos.length > 0) {
          convList = dbConvos;
        }
      }

      if (convList.length === 0) {
        convList = store.getConversations();
      }

      setConversations(convList);
      if (convList.length > 0 && !activeConversationId) {
        setActiveConversationId(convList[0].id);
        loadMessages(convList[0].id);
      }
    } catch (err) {
      console.warn('Admin convos load note:', err);
      const fallback = store.getConversations();
      setConversations(fallback);
      if (fallback.length > 0 && !activeConversationId) {
        setActiveConversationId(fallback[0].id);
        setMessages(store.getMessages(fallback[0].id));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      if (isSupabaseConfigured()) {
        const { data: dbMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });

        if (dbMessages && dbMessages.length > 0) {
          setMessages(dbMessages);
          return;
        }
      }
      setMessages(store.getMessages(convId));
    } catch (err) {
      console.warn('Admin load messages note:', err);
      setMessages(store.getMessages(convId));
    }
  };

  useEffect(() => {
    loadAllConversations();
  }, []);

  const handleSelectConversation = (convId: string) => {
    setActiveConversationId(convId);
    loadMessages(convId);
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConversationId || isSending) return;

    setIsSending(true);
    const textToSend = replyText.trim();
    setReplyText('');

    const now = new Date().toISOString();
    const adminMsg: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: activeConversationId,
      sender_name: 'Blue Sky Administrator',
      is_admin: true,
      is_automated: false,
      message_body: textToSend,
      created_at: now,
    };

    const updated = [...messages, adminMsg];
    setMessages(updated);
    store.addMessage(adminMsg);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('messages').insert({
          conversation_id: activeConversationId,
          sender_id: null,
          sender_name: 'Blue Sky Administrator',
          is_admin: true,
          is_automated: false,
          message_body: textToSend,
          created_at: now,
        });

        await supabase
          .from('conversations')
          .update({
            last_message: textToSend,
            last_message_at: now,
          })
          .eq('id', activeConversationId);
      } catch (err) {
        console.warn('Admin reply db insert note:', err);
      }
    }

    // Notify the tenant about the administrator response
    const activeConv = conversations.find((c) => c.id === activeConversationId);
    if (activeConv?.applicant_id) {
      try {
        await createNotification({
          profile_id: activeConv.applicant_id,
          role: 'applicant',
          type: 'info',
          title: 'New Message from Support Team',
          message: `Administrator replied: "${textToSend.slice(0, 70)}${textToSend.length > 70 ? '...' : ''}"`,
          link_url: '/applicant/messages',
        });
      } catch (notifErr) {
        console.warn('Tenant notification note:', notifErr);
      }
    }

    setIsSending(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.subject?.toLowerCase().includes(q) ||
        c.applicant_name?.toLowerCase().includes(q) ||
        c.property_title?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
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
      return '';
    }
  };

  return (
    <AppLayout title="Support Messages Hub | Blue Sky Admin" headerTitle="Support Inquiries">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 80px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/admin"
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
              Admin Portal
            </Link>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={22} color="var(--color-primary-navy)" />
                Support & Application Inquiries
              </h1>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                View and manage direct tenant inquiries and automated bot assistance channels
              </p>
            </div>
          </div>

          <button
            onClick={loadAllConversations}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh Threads
          </button>
        </div>

        {/* Messaging Two-Column Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
            minHeight: 560,
            backgroundColor: 'var(--color-white, #ffffff)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }}
        >
          {/* Left Column: Channels List */}
          <div
            style={{
              borderRight: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--color-surface-subtle, #f8fafc)',
            }}
          >
            {/* Search Box */}
            <div style={{ padding: '14px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 30px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 13,
                    outline: 'none',
                    backgroundColor: '#ffffff',
                  }}
                />
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                  <Loader2 size={24} className="animate-spin" color="var(--color-primary-navy)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Loading inquiry threads...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                  <MessageSquare size={24} color="var(--color-text-secondary)" style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)', margin: '0 0 4px' }}>No messages found</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>Tenant inquiries will appear here.</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === activeConversationId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: isSelected ? '#ffffff' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--color-primary-navy)' : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 600, color: 'var(--color-text-main)' }}>
                          {conv.applicant_name || 'Tenant Inquiry'}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                          {formatTimeAgo(conv.last_message_at || conv.created_at)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary-navy)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.subject || 'Application Inquiry'}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.last_message || 'New conversation'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Chat Transcript & Reply */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
            {activeConv ? (
              <>
                {/* Channel Header Banner */}
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(15, 23, 42, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={18} color="var(--color-primary-navy)" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
                        {activeConv.applicant_name || 'Applicant'}
                      </h2>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {activeConv.subject}
                      </span>
                    </div>
                  </div>

                  {activeConv.application_id && (
                    <Link
                      href={`/admin/applications`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--color-primary-navy)',
                        textDecoration: 'none',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      View Application <ExternalLink size={12} />
                    </Link>
                  )}
                </div>

                {/* Messages Body */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 420 }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                      No messages in this inquiry thread yet.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAdminMsg = msg.is_admin && !msg.is_automated;
                      const isBotMsg = Boolean(msg.is_automated);

                      return (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: isAdminMsg ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isAdminMsg ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            {isBotMsg ? (
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#0284C7', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Bot size={13} /> {msg.sender_name || 'Bot Assistant'}
                              </span>
                            ) : isAdminMsg ? (
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary-navy)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Shield size={13} /> {msg.sender_name || 'Admin'}
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <User size={13} /> {msg.sender_name || activeConv.applicant_name || 'Tenant'}
                              </span>
                            )}
                            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                              {formatTimeAgo(msg.created_at)}
                            </span>
                          </div>

                          <div
                            style={{
                              padding: '10px 14px',
                              borderRadius: isAdminMsg ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                              backgroundColor: isAdminMsg
                                ? 'var(--color-primary-navy)'
                                : isBotMsg
                                ? 'rgba(2, 132, 199, 0.08)'
                                : 'var(--color-surface)',
                              border: isBotMsg ? '1px solid rgba(2, 132, 199, 0.2)' : '1px solid var(--color-border)',
                              color: isAdminMsg ? '#ffffff' : 'var(--color-text-main)',
                              fontSize: 13,
                              lineHeight: 1.45,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {msg.message_body}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Form */}
                <form
                  onSubmit={handleSendAdminReply}
                  style={{
                    padding: '14px 20px',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: '#ffffff',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Type official administrator response..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--color-border)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-primary-navy)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: replyText.trim() ? 'pointer' : 'default',
                      opacity: replyText.trim() ? 1 : 0.6,
                    }}
                  >
                    <Send size={14} />
                    Reply
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 40, color: 'var(--color-text-secondary)', fontSize: 14 }}>
                Select an inquiry thread from the left to view transcript
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
