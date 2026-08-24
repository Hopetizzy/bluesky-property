import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Send, Bot, ArrowLeft, Shield, CheckCheck, Loader2, MessageSquare, Sparkles, Building, FileText, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { Message, Conversation } from '@/lib/types';

export default function MessagesPage() {
  const router = useRouter();
  const { propertyId, applicationId, ref: appRef, title: propTitle } = router.query;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputBody, setInputBody] = useState('');
  const [currentUserName, setCurrentUserName] = useState('Applicant');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadConversations() {
      setIsLoading(true);
      try {
        let convList: Conversation[] = [];
        let name = 'Applicant';
        let email = '';
        let userId: string | null = null;
        let profileId: string | null = null;

        if (isSupabaseConfigured()) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            userId = user.id;
            email = user.email || '';
            setCurrentUserId(userId);
            setCurrentUserEmail(email);

            const { data: profile } = await supabase
              .from('profiles')
              .select('id, full_name')
              .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
              .maybeSingle();

            if (profile?.id) profileId = profile.id;
            if (profile?.full_name) {
              name = profile.full_name;
              setCurrentUserName(name);
            } else if (user.user_metadata?.full_name) {
              name = user.user_metadata.full_name;
              setCurrentUserName(name);
            } else {
              name = email.split('@')[0] || 'Tenant';
              setCurrentUserName(name);
            }

            // Query conversations for this user only
            const query = supabase
              .from('conversations')
              .select('*')
              .order('last_message_at', { ascending: false });

            if (profileId) {
              query.eq('applicant_id', profileId);
            }

            const { data: dbConvos } = await query;
            if (dbConvos && dbConvos.length > 0) {
              convList = dbConvos;
            }
          }
        }

        // If an applicationId or propertyId was passed in query, check or create active channel
        let targetChannelId = '';

        if (applicationId || propertyId) {
          const matched = convList.find(
            (c) =>
              (applicationId && c.application_id === applicationId) ||
              (propertyId && c.property_id === propertyId)
          );

          if (matched) {
            targetChannelId = matched.id;
          } else {
            // Automatically CREATE new Active Channel for this specific application
            const newChannelRef = appRef ? `#${appRef}` : 'New Inquiry';
            const channelSubject = propTitle
              ? `Application ${newChannelRef} - ${decodeURIComponent(propTitle as string)}`
              : `Application ${newChannelRef} Review`;

            const newChannelId = `conv-${Date.now()}`;
            const newChannel: Conversation = {
              id: newChannelId,
              application_id: applicationId ? String(applicationId) : undefined,
              property_id: propertyId ? String(propertyId) : undefined,
              applicant_id: profileId || userId || 'user',
              applicant_name: name,
              subject: channelSubject,
              is_closed: false,
              last_message: `Channel opened for Application ${newChannelRef}`,
              last_message_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            };

            // Insert into Supabase if configured
            if (isSupabaseConfigured()) {
              try {
                const { data: createdDbConv } = await supabase
                  .from('conversations')
                  .insert({
                    property_id: propertyId || null,
                    application_id: applicationId || null,
                    applicant_id: profileId,
                    subject: channelSubject,
                    is_closed: false,
                  })
                  .select('id')
                  .maybeSingle();

                if (createdDbConv?.id) {
                  newChannel.id = String(createdDbConv.id);
                }

                // Insert initial welcoming message into DB
                await supabase.from('messages').insert({
                  conversation_id: newChannel.id,
                  sender_id: profileId,
                  is_admin: true,
                  is_automated: true,
                  message_body: `Hello ${name}! Welcome to your dedicated communication channel for Application ${newChannelRef}. Our verification team and property managers will communicate all status updates, lease agreements, and document requests here.`,
                });
              } catch (convErr) {
                console.warn('Channel creation DB note:', convErr);
              }
            }

            convList = [newChannel, ...convList];
            targetChannelId = newChannel.id;
          }
        }

        // Default Support Channel if no channels exist
        if (convList.length === 0) {
          const defaultChannelId = `conv-${userId || 'user-support'}`;
          const defaultChannel: Conversation = {
            id: defaultChannelId,
            applicant_id: profileId || userId || 'user',
            applicant_name: name,
            subject: 'Blue Sky General Support Desk',
            is_closed: false,
            last_message: 'Ask any questions about verified listings or applications',
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };
          convList = [defaultChannel];
          targetChannelId = defaultChannelId;
        }

        setConversations(convList);
        const activeId = targetChannelId || convList[0].id;
        setActiveConversationId(activeId);
        await loadMessagesForConv(activeId, name, email);
      } catch (err) {
        console.warn('Convos load error:', err);
        const fallbackChannel: Conversation = {
          id: 'conv-support',
          applicant_id: 'user',
          applicant_name: 'Applicant',
          subject: 'Blue Sky Support Desk',
          is_closed: false,
          last_message: 'Ask any questions about verified listings or applications',
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        setConversations([fallbackChannel]);
        setActiveConversationId('conv-support');
        setMessages([
          {
            id: 'msg-welcome',
            conversation_id: 'conv-support',
            sender_name: 'Blue Sky Support Desk',
            is_admin: true,
            is_automated: true,
            message_body: 'Hello! Welcome to Blue Sky Property Management. How can we help you today?',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    loadConversations();
  }, [propertyId, applicationId, appRef, propTitle]);

  const loadMessagesForConv = async (convId: string, name: string, email: string) => {
    if (isSupabaseConfigured()) {
      try {
        const { data: dbMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });

        if (dbMessages && dbMessages.length > 0) {
          setMessages(dbMessages);
          return;
        }
      } catch (err) {
        console.warn('Messages query note:', err);
      }
    }

    // Account-scoped local storage
    if (typeof window !== 'undefined') {
      const storageKey = email ? `bluesky_chat_${email}_${convId}` : `bluesky_chat_${convId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        } catch (e) {}
      }
    }

    // Fresh personalized welcome message for this channel
    const activeConv = conversations.find((c) => c.id === convId);
    const channelTitle = activeConv?.subject || 'Application Review';

    const welcomeMsg: Message = {
      id: `msg-welcome-${Date.now()}`,
      conversation_id: convId,
      sender_name: 'Blue Sky Review Desk',
      is_admin: true,
      is_automated: true,
      message_body: `Hello ${name}! This channel is active for ${channelTitle}. Feel free to message us with any questions or paperwork requests.`,
      created_at: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);
  };

  const handleSelectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    await loadMessagesForConv(convId, currentUserName, currentUserEmail);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBody.trim()) return;

    const userText = inputBody.trim();
    setInputBody('');

    // 1. Add User Message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: activeConversationId || 'conv-support',
      sender_id: currentUserId || undefined,
      sender_name: currentUserName,
      is_admin: false,
      is_automated: false,
      message_body: userText,
      created_at: new Date().toISOString(),
    };

    // Store in Supabase if configured
    if (isSupabaseConfigured() && activeConversationId) {
      try {
        await supabase.from('messages').insert({
          conversation_id: activeConversationId,
          sender_id: currentUserId || null,
          is_admin: false,
          is_automated: false,
          message_body: userText,
        });

        // Update conversation last message in DB
        await supabase
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
          })
          .eq('id', activeConversationId);
      } catch (err) {
        console.warn('Message db insert note:', err);
      }
    }

    const updatedList = [...messages, userMsg];
    setMessages(updatedList);

    // Save to user storage
    if (typeof window !== 'undefined' && currentUserEmail) {
      localStorage.setItem(`bluesky_chat_${currentUserEmail}_${activeConversationId}`, JSON.stringify(updatedList));
    }

    // 2. Keyword Assistant or Support Desk Response
    setTimeout(() => {
      const matchedFAQ = store.matchKeywordFAQ(userText);

      let botMsg: Message;
      if (matchedFAQ) {
        botMsg = {
          id: `msg-${Date.now() + 1}`,
          conversation_id: activeConversationId || 'conv-support',
          sender_name: 'Blue Sky Assistant',
          is_admin: true,
          is_automated: true,
          message_body: matchedFAQ.answer,
          created_at: new Date().toISOString(),
        };
      } else {
        botMsg = {
          id: `msg-${Date.now() + 2}`,
          conversation_id: activeConversationId || 'conv-support',
          sender_name: 'Blue Sky Property Manager',
          is_admin: true,
          is_automated: false,
          message_body: 'Thank you for reaching out! A verified Blue Sky property review specialist has received your message regarding this application and will assist you shortly.',
          created_at: new Date().toISOString(),
        };
      }

      const withBot = [...updatedList, botMsg];
      setMessages(withBot);

      if (typeof window !== 'undefined' && currentUserEmail) {
        localStorage.setItem(`bluesky_chat_${currentUserEmail}_${activeConversationId}`, JSON.stringify(withBot));
      }
    }, 600);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  return (
    <AppLayout title="Messages & Support Channels | Blue Sky Property" headerTitle="Messages & Support">
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '16px 16px 40px 16px',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button
            onClick={() => router.push('/applicant')}
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
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-success)', fontWeight: 700 }}>
            ● Verified Support Online
          </div>
        </div>

        {/* Main 2-Column Responsive Chat Container */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
            height: 'calc(100vh - 210px)',
            minHeight: 540,
          }}
        >
          {/* Left Column: Active Channels List */}
          <div
            className="card"
            style={{
              margin: 0,
              padding: '16px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                Active Channels ({conversations.length})
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {conversations.map((conv) => {
                const isSelected = activeConversationId === conv.id;
                const isAppChannel = Boolean(conv.application_id || conv.subject?.includes('Application'));

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: isSelected ? 'var(--color-primary-tint)' : 'var(--color-white)',
                      border: isSelected ? '1px solid #BAE6FD' : '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(0, 102, 255, 0.08)' : 'none',
                    }}
                  >
                    <div className="flex-between" style={{ marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isAppChannel ? (
                          <FileText size={16} color="var(--color-primary)" />
                        ) : (
                          <Shield size={16} color="var(--color-primary)" />
                        )}
                        <div style={{ fontSize: 13, fontWeight: isSelected ? 800 : 700, color: 'var(--color-navy-dark)' }}>
                          {conv.subject || 'Support Desk'}
                        </div>
                      </div>
                      {isSelected && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.last_message || 'Application discussion channel'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Conversation Chat Box */}
          <div
            className="card"
            style={{
              margin: 0,
              padding: 0,
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Chat Box Header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                  {activeConv?.subject || 'Blue Sky Property Support & Inquiries'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Connected as: <strong>{currentUserName}</strong>
                </div>
              </div>
            </div>

            {/* Chat Messages List */}
            <div
              style={{
                flex: 1,
                padding: '20px 16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                backgroundColor: '#F8FAFC',
              }}
            >
              {messages.map((msg) => {
                const isMe = !msg.is_admin;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--color-text-secondary)',
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {msg.is_automated && <Bot size={12} color="var(--color-primary)" />}
                      {msg.sender_name || (isMe ? currentUserName : 'Property Specialist')}
                    </div>

                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '12px 16px',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        backgroundColor: isMe ? 'var(--color-primary)' : msg.is_automated ? '#E0F2FE' : '#FFFFFF',
                        color: isMe ? '#FFFFFF' : 'var(--color-navy-dark)',
                        fontSize: 13,
                        lineHeight: 1.5,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                        border: isMe ? 'none' : '1px solid var(--color-border)',
                      }}
                    >
                      {msg.message_body}
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--color-text-muted)',
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && <CheckCheck size={12} color="var(--color-primary)" />}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Composer */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-white)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <input
                type="text"
                placeholder="Ask about this application, requested documents, or lease..."
                value={inputBody}
                onChange={(e) => setInputBody(e.target.value)}
                style={{
                  flex: 1,
                  height: 44,
                  padding: '0 16px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />

              <button
                type="submit"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(0, 102, 255, 0.3)',
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
