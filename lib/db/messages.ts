import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { store } from '../store';
import { Message, Conversation, FAQ, NotificationItem } from '../types';

export const messagesDb = {
  // Conversations
  async getConversations(): Promise<Conversation[]> {
    if (!isSupabaseConfigured()) {
      return store.getConversations();
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch {
      return store.getConversations();
    }
  },

  // Messages
  async getMessages(conversationId: string): Promise<Message[]> {
    if (!isSupabaseConfigured()) {
      return store.getMessages(conversationId);
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch {
      return store.getMessages(conversationId);
    }
  },

  async sendMessage(msg: Message): Promise<Message> {
    store.addMessage(msg);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('messages').insert({
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_id: msg.sender_id || null,
          is_admin: msg.is_admin,
          is_automated: msg.is_automated,
          message_body: msg.message_body,
        });
      } catch (err) {
        console.error('Supabase message send error:', err);
      }
    }

    return msg;
  },

  // FAQs
  async getFAQs(): Promise<FAQ[]> {
    if (!isSupabaseConfigured()) {
      return store.getFAQs();
    }

    try {
      const { data, error } = await supabase
        .from('faqs')
        .select(`
          *,
          faq_keywords (keyword)
        `)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        keywords: (row.faq_keywords || []).map((k: any) => k.keyword),
      }));
    } catch {
      return store.getFAQs();
    }
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    if (!isSupabaseConfigured()) {
      return store.getNotifications();
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch {
      return store.getNotifications();
    }
  },
};
