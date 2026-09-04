import { supabase, isSupabaseConfigured } from './supabaseClient';
import { store } from './store';
import { NotificationItem } from './types';

export interface CreateNotificationParams {
  id?: string;
  profile_id?: string;
  user_id?: string;
  role?: 'admin' | 'provider' | 'applicant' | 'all';
  type?: 'application' | 'payment' | 'property' | 'system' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  link_url?: string;
  is_read?: boolean;
}

/**
 * Core dispatch function to create a notification in DB and local store
 */
export async function createNotification(params: CreateNotificationParams): Promise<NotificationItem> {
  const id = params.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const item: NotificationItem = {
    id,
    profile_id: params.profile_id,
    user_id: params.user_id || params.profile_id || 'system',
    role: params.role || 'all',
    type: params.type || 'info',
    title: params.title,
    message: params.message,
    link_url: params.link_url,
    is_read: params.is_read || false,
    created_at: now,
  };

  // 1. Sync to local store immediately for instant UI availability
  try {
    store.addNotification(item);
  } catch (err) {
    console.warn('Local store addNotification warning:', err);
  }

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('notifications').insert({
        id: item.id,
        profile_id: item.profile_id || null,
        type: item.type,
        title: item.title,
        message: item.message,
        link_url: item.link_url || null,
        is_read: false,
        created_at: now,
      });
    } catch (err) {
      console.warn('Supabase notification insert warning:', err);
    }
  }

  return item;
}

// -------------------------------------------------------------
// EVENT DISPATCHERS
// -------------------------------------------------------------

/**
 * Triggered when a tenant completes and submits a rental application
 */
export async function notifyNewApplication(params: {
  applicationId: string;
  propertyId?: string;
  propertyTitle: string;
  providerId?: string;
  tenantName: string;
  tenantEmail: string;
}) {
  // 1. Notify Provider (Landlord)
  await createNotification({
    profile_id: params.providerId || 'provider-main',
    role: 'provider',
    type: 'application',
    title: 'New Rental Application Received',
    message: `${params.tenantName} (${params.tenantEmail}) submitted an application for "${params.propertyTitle}".`,
    link_url: `/provider/properties`,
  });

  // 2. Notify Admin
  await createNotification({
    role: 'admin',
    type: 'application',
    title: 'New Application Submitted',
    message: `Application submitted by ${params.tenantName} for "${params.propertyTitle}". Requires review.`,
    link_url: `/admin/applications`,
  });
}

/**
 * Triggered when Admin/Provider approves or rejects a tenant's application
 */
export async function notifyApplicationDecision(params: {
  applicationId: string;
  propertyTitle: string;
  tenantId?: string;
  tenantEmail?: string;
  status: 'approved' | 'rejected' | 'under_review';
  notes?: string;
}) {
  const isApproved = params.status === 'approved';
  const isRejected = params.status === 'rejected';

  let title = `Application Status Update: ${params.propertyTitle}`;
  let message = `Your application for "${params.propertyTitle}" is currently under review.`;

  if (isApproved) {
    title = `Application Approved: ${params.propertyTitle}`;
    message = `Congratulations! Your rental application for "${params.propertyTitle}" has been approved.`;
  } else if (isRejected) {
    title = `Application Decision: ${params.propertyTitle}`;
    message = `Your application for "${params.propertyTitle}" was not approved.${params.notes ? ` Reason: ${params.notes}` : ''}`;
  }

  await createNotification({
    profile_id: params.tenantId || params.tenantEmail,
    role: 'applicant',
    type: isApproved ? 'success' : isRejected ? 'warning' : 'info',
    title,
    message,
    link_url: `/applicant/applications`,
  });
}

/**
 * Triggered when a tenant or provider uploads a payment proof
 */
export async function notifyPaymentUploaded(params: {
  paymentId: string;
  userType: 'provider' | 'applicant';
  userEmail?: string;
  userId?: string;
  planOrPropertyTitle?: string;
  amount: number;
  currency: string;
}) {
  const isProvider = params.userType === 'provider';

  // 1. Notify Admin that a payment proof needs verification
  await createNotification({
    role: 'admin',
    type: 'payment',
    title: isProvider ? 'New Provider Plan Payment' : 'New Tenant Application Fee Payment',
    message: `${params.userEmail || 'A user'} uploaded payment proof (${params.currency} ${params.amount}) for ${params.planOrPropertyTitle || 'verification'}.`,
    link_url: isProvider ? `/admin/plans` : `/admin/payments`,
  });

  // 2. Notify the user confirming receipt
  await createNotification({
    profile_id: params.userId || params.userEmail,
    role: params.userType,
    type: 'info',
    title: 'Payment Proof Received',
    message: `Your payment proof of ${params.currency} ${params.amount} has been uploaded and is pending administrative verification.`,
    link_url: isProvider ? `/provider/payments` : `/applicant/applications`,
  });
}

/**
 * Triggered when Admin verifies or rejects a payment
 */
export async function notifyPaymentDecision(params: {
  paymentId: string;
  userType: 'provider' | 'applicant';
  userEmail?: string;
  userId?: string;
  status: 'verified' | 'rejected';
  planOrPropertyTitle?: string;
  notes?: string;
}) {
  const isVerified = params.status === 'verified';
  const isProvider = params.userType === 'provider';

  let title = isVerified ? 'Payment Verified & Confirmed' : 'Payment Verification Issue';
  let message = isVerified
    ? `Your payment for ${params.planOrPropertyTitle || 'access'} has been verified successfully. Your listing access is active.`
    : `Your payment proof for ${params.planOrPropertyTitle || 'access'} could not be verified.${params.notes ? ` Details: ${params.notes}` : ' Please submit a valid receipt.'}`;

  if (!isProvider) {
    message = isVerified
      ? `Your application verification fee has been verified by the administration team.`
      : `Your application fee payment proof was rejected.${params.notes ? ` Details: ${params.notes}` : ''}`;
  }

  await createNotification({
    profile_id: params.userId || params.userEmail,
    role: params.userType,
    type: isVerified ? 'success' : 'warning',
    title,
    message,
    link_url: isProvider ? `/provider/payments` : `/applicant/applications`,
  });
}

/**
 * Triggered when a provider creates a new property listing
 */
export async function notifyPropertyCreated(params: {
  propertyId: string;
  propertyTitle: string;
  providerId?: string;
  providerEmail?: string;
}) {
  // Notify Admin for moderation
  await createNotification({
    role: 'admin',
    type: 'property',
    title: 'New Property Listing Submitted',
    message: `"${params.propertyTitle}" was posted by provider ${params.providerEmail || ''} and is pending review.`,
    link_url: `/admin/properties`,
  });
}

/**
 * Triggered when an admin moderates a property listing
 */
export async function notifyPropertyModerated(params: {
  propertyId: string;
  propertyTitle: string;
  providerId?: string;
  status: 'verified' | 'rejected' | 'pending';
  notes?: string;
}) {
  const isVerified = params.status === 'verified';
  const isRejected = params.status === 'rejected';

  await createNotification({
    profile_id: params.providerId,
    role: 'provider',
    type: isVerified ? 'success' : isRejected ? 'warning' : 'info',
    title: isVerified ? 'Property Listing Verified' : isRejected ? 'Property Needs Revision' : 'Property Under Review',
    message: isVerified
      ? `"${params.propertyTitle}" has been verified and is live for tenant discovery.`
      : `"${params.propertyTitle}" status updated to ${params.status}.${params.notes ? ` Feedback: ${params.notes}` : ''}`,
    link_url: `/provider/properties`,
  });
}
