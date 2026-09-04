export type UserRole = 'applicant' | 'provider' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'deactivated';

export type ProviderType = 'owner' | 'agent' | 'property_manager' | 'brokerage' | 'company';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type PropertyType =
  | 'apartment'
  | 'house'
  | 'single_family_house'
  | 'townhouse'
  | 'duplex'
  | 'studio'
  | 'commercial'
  | 'other';

export type PropertyStatus =
  | 'draft'
  | 'pending_verification'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'archived';

export type UnitType =
  | 'studio'
  | 'one_bedroom'
  | 'two_bedroom'
  | 'three_bedroom'
  | 'four_plus_bedroom'
  | 'penthouse'
  | 'entire_house'
  | 'room';

export type RentPeriod = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
export type UnitStatus = 'available' | 'under_application' | 'leased' | 'unavailable';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type DocumentType =
  | 'passport'
  | 'drivers_license'
  | 'state_id'
  | 'national_id'
  | 'proof_of_income'
  | 'employment_letter'
  | 'utility_bill_address'
  | 'tax_return'
  | 'bank_statement'
  | 'credit_report'
  | 'other';

export type DocumentStatus = 'pending' | 'verified' | 'rejected';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export type PaymentMethodType =
  | 'chime'
  | 'cash_app'
  | 'facebook_pay'
  | 'bitcoin'
  | 'interac_etransfer'
  | 'bank_wire'
  | 'paypal'
  | 'zelle'
  | 'other';

export interface Profile {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  country_code: string;
  created_at: string;
}

export interface ProviderProfile {
  id: string;
  user_id: string;
  provider_type: ProviderType;
  company_name?: string;
  license_number?: string;
  business_phone: string;
  business_address?: string;
  country_code: string;
  verification_status: VerificationStatus;
  created_at: string;
}

export interface ListingPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency_code: string;
  duration_days: number;
  is_popular: boolean;
  is_active: boolean;
  features: string[];
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  currency_code: string;
  instructions: string;
  account_name?: string; // Account Name / Beneficiary Name
  account_number?: string; // Chime Tag / $Cashtag / FB link / BTC Address / Email
  routing_or_swift?: string; // Network or Sub-Identifier (e.g. Bitcoin Network)
  bank_name?: string; // Platform / Institution
  paypal_email?: string;
  zelle_identifier?: string;
  is_active: boolean;
}

export interface ProviderPayment {
  id: string;
  provider_id: string;
  provider_name?: string;
  provider_email?: string;
  provider_phone?: string;
  listing_plan_id: string;
  listing_plan_name?: string;
  listing_plan_duration_days?: number;
  payment_method_id: string;
  payment_method_name?: string;
  payment_method_type?: string;
  amount: number;
  currency_code: string;
  proof_storage_path: string;
  status: PaymentStatus;
  rejection_reason?: string;
  submitted_at: string;
  verified_at?: string;
  verified_by?: string;
}

export interface ProviderListingPeriod {
  id: string;
  provider_id: string;
  listing_plan_id: string;
  payment_id?: string;
  starts_at: string;
  expires_at: string;
  grace_period_hours: number;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
}

export interface PropertyImage {
  id: string;
  property_id: string;
  storage_path: string;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface PropertyUnit {
  id: string;
  property_id: string;
  unit_number_or_name: string;
  unit_type: UnitType;
  bedrooms: number;
  bathrooms: number;
  square_feet?: number;
  rent_amount: number;
  currency_code: string;
  security_deposit?: number;
  rent_period: RentPeriod;
  available_quantity: number;
  status: UnitStatus;
  available_from?: string;
  description?: string;
}

export interface Property {
  id: string;
  provider_id?: string;
  provider_name?: string;
  is_admin_direct: boolean;
  title: string;
  slug: string;
  description: string;
  property_type: PropertyType;
  country_code: string;
  country_name: string;
  state_province: string;
  city: string;
  neighborhood?: string;
  street_address: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  status: PropertyStatus;
  verification_notes?: string;
  verified_at?: string;
  published_at?: string;
  featured: boolean;
  images: PropertyImage[];
  units: PropertyUnit[];
  amenities: string[];
  created_at: string;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_type: DocumentType;
  file_name: string;
  storage_path: string;
  file_size_bytes?: number;
  status: DocumentStatus;
  rejection_reason?: string;
  created_at: string;
}


export interface RentalApplication {
  id: string;
  application_ref: string;
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  applicant_dob?: string;
  applicant_nationality?: string;
  applicant_address?: string;
  applicant_employer?: string;
  applicant_occupation?: string;
  applicant_income?: number;
  applicant_ssn?: string;
  property_id: string;
  property_title: string;
  property_address: string;
  property_image?: string;
  unit_id: string;
  unit_name: string;
  unit_rent: number;
  unit_currency: string;
  unit_bedrooms?: number;
  unit_bathrooms?: number;
  status: ApplicationStatus;
  desired_move_in: string;
  lease_term_months: number;
  occupants_count: number;
  has_pets: boolean;
  pets_description?: string;
  additional_notes?: string;
  admin_notes?: string;
  documents: ApplicationDocument[];
  payment?: ApplicationPayment;
  payments?: ApplicationPayment[];
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Conversation {
  id: string;
  property_id?: string;
  property_title?: string;
  application_id?: string;
  applicant_id: string;
  applicant_name: string;
  subject?: string;
  is_closed: boolean;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id?: string;
  sender_name?: string;
  is_admin: boolean;
  is_automated: boolean;
  message_body: string;
  created_at: string;
  read_at?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  priority: number;
  is_active: boolean;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  profile_id?: string;
  role?: string; // 'admin' | 'provider' | 'applicant' | 'all'
  type: string;
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface ApplicationFeeSettings {
  is_enabled: boolean;
  amount: number;
  currency_code: string;
}

export interface ApplicationPayment {
  id: string;
  application_id: string;
  applicant_id?: string;
  payment_method_id?: string;
  payment_method_name?: string;
  amount: number;
  currency_code: string;
  proof_storage_path: string;
  proof_file_name?: string;
  status: PaymentStatus;
  rejection_reason?: string;
  submitted_at?: string;
  verified_at?: string;
  verified_by?: string;
}
