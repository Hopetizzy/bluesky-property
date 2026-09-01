import {
  Property,
  ListingPlan,
  PaymentMethod,
  ProviderPayment,
  ProviderListingPeriod,
  RentalApplication,
  Conversation,
  Message,
  FAQ,
  NotificationItem,
  UserRole,
  ApplicationFeeSettings,
  ApplicationPayment,
} from './types';

// Pre-seeded Worldwide Properties (USA, Canada, UK, Australia)
export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    is_admin_direct: false,
    provider_id: 'prov-1',
    provider_name: 'Pacific Heights Realty LLC',
    title: '2 Bedroom Modern Apartment',
    slug: '2-bedroom-modern-apartment-los-angeles',
    description:
      'Spacious 2 bedroom luxury apartment in a prime location. Features floor-to-ceiling windows, open-concept kitchen, in-unit laundry, smart thermostat, and resort-style amenities including a heated pool, fitness center, and 24/7 concierge.',
    property_type: 'apartment',
    country_code: 'USA',
    country_name: 'United States',
    state_province: 'California',
    city: 'Los Angeles',
    neighborhood: 'Downtown / South Park',
    street_address: '888 S Olive Street',
    postal_code: '90014',
    status: 'approved',
    featured: true,
    published_at: '2026-08-15T10:00:00Z',
    images: [
      {
        id: 'img-1',
        property_id: 'prop-1',
        storage_path: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        caption: 'Building Exterior',
        is_primary: true,
        sort_order: 1,
      },
      {
        id: 'img-2',
        property_id: 'prop-1',
        storage_path: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        caption: 'Living Room',
        is_primary: false,
        sort_order: 2,
      },
      {
        id: 'img-3',
        property_id: 'prop-1',
        storage_path: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
        caption: 'Modern Kitchen',
        is_primary: false,
        sort_order: 3,
      },
    ],
    units: [
      {
        id: 'unit-1',
        property_id: 'prop-1',
        unit_number_or_name: '2 Bedroom Suite #402',
        unit_type: 'two_bedroom',
        bedrooms: 2,
        bathrooms: 2,
        square_feet: 1150,
        rent_amount: 2850,
        currency_code: 'USD',
        security_deposit: 2850,
        rent_period: 'monthly',
        available_quantity: 2,
        status: 'available',
        description: 'Corner unit with panoramic skyline views, dual master suites, and walk-in closets.',
      },
      {
        id: 'unit-2',
        property_id: 'prop-1',
        unit_number_or_name: '1 Bedroom Suite #208',
        unit_type: 'one_bedroom',
        bedrooms: 1,
        bathrooms: 1,
        square_feet: 780,
        rent_amount: 2150,
        currency_code: 'USD',
        security_deposit: 2150,
        rent_period: 'monthly',
        available_quantity: 3,
        status: 'available',
        description: 'Sun-drenched layout with private balcony and premium stainless steel appliances.',
      },
    ],
    amenities: ['Parking', 'Security Concierge', 'Swimming Pool', 'Fitness Center', 'In-unit Laundry', 'Central A/C', 'Pet Friendly', 'Balcony'],
    created_at: '2026-08-10T12:00:00Z',
  },
  {
    id: 'prop-2',
    is_admin_direct: true,
    provider_name: 'Blue Sky Direct Property',
    title: 'Luxury Studio Apartment',
    slug: 'luxury-studio-apartment-toronto',
    description:
      'Chic downtown studio apartment steps away from transit, fine dining, and entertainment. Includes high-speed fiber internet, quartz countertops, designer lighting, and access to rooftop lounge.',
    property_type: 'studio',
    country_code: 'CAN',
    country_name: 'Canada',
    state_province: 'Ontario',
    city: 'Toronto',
    neighborhood: 'Entertainment District',
    street_address: '290 Adelaide St W',
    postal_code: 'M5V 1P6',
    status: 'approved',
    featured: true,
    published_at: '2026-08-12T14:00:00Z',
    images: [
      {
        id: 'img-4',
        property_id: 'prop-2',
        storage_path: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
        caption: 'Studio Interior',
        is_primary: true,
        sort_order: 1,
      },
      {
        id: 'img-5',
        property_id: 'prop-2',
        storage_path: 'https://images.unsplash.com/photo-1502005229762-ee152da92e06?auto=format&fit=crop&w=800&q=80',
        caption: 'Building Lobby',
        is_primary: false,
        sort_order: 2,
      },
    ],
    units: [
      {
        id: 'unit-3',
        property_id: 'prop-2',
        unit_number_or_name: 'Studio Loft #1105',
        unit_type: 'studio',
        bedrooms: 0,
        bathrooms: 1,
        square_feet: 520,
        rent_amount: 1950,
        currency_code: 'CAD',
        security_deposit: 1950,
        rent_period: 'monthly',
        available_quantity: 1,
        status: 'available',
        description: 'Furnished modern studio with Murphy bed and built-in workstation.',
      },
    ],
    amenities: ['Security Concierge', 'High-speed Internet', 'Rooftop Lounge', 'Gym', 'Elevator', 'Keyless Entry'],
    created_at: '2026-08-08T09:30:00Z',
  },
  {
    id: 'prop-3',
    is_admin_direct: false,
    provider_id: 'prov-2',
    provider_name: 'Kensington Residential UK',
    title: '3 Bedroom Victorian Townhouse',
    slug: '3-bedroom-victorian-townhouse-london',
    description:
      'Elegant three-bedroom Victorian home located in a quiet tree-lined street in Kensington. High ceilings, original fireplaces, private rear garden, and newly renovated chef kitchen.',
    property_type: 'townhouse',
    country_code: 'GBR',
    country_name: 'United Kingdom',
    state_province: 'Greater London',
    city: 'London',
    neighborhood: 'Kensington',
    street_address: '14 Holland Park Gardens',
    postal_code: 'W14 8DY',
    status: 'approved',
    featured: true,
    published_at: '2026-08-16T11:00:00Z',
    images: [
      {
        id: 'img-6',
        property_id: 'prop-3',
        storage_path: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        caption: 'Townhouse Exterior',
        is_primary: true,
        sort_order: 1,
      },
      {
        id: 'img-7',
        property_id: 'prop-3',
        storage_path: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=800&q=80',
        caption: 'Spacious Dining Room',
        is_primary: false,
        sort_order: 2,
      },
    ],
    units: [
      {
        id: 'unit-4',
        property_id: 'prop-3',
        unit_number_or_name: 'Whole Townhouse',
        unit_type: 'three_bedroom',
        bedrooms: 3,
        bathrooms: 2.5,
        square_feet: 1850,
        rent_amount: 3400,
        currency_code: 'GBP',
        security_deposit: 3400,
        rent_period: 'monthly',
        available_quantity: 1,
        status: 'available',
        description: 'Complete multi-level residence with garden patio and private parking.',
      },
    ],
    amenities: ['Private Garden', 'Parking', 'Fireplace', 'Dishwasher', 'Wine Cellar', 'Pet Friendly'],
    created_at: '2026-08-14T15:20:00Z',
  },
  {
    id: 'prop-4',
    is_admin_direct: false,
    provider_id: 'prov-1',
    provider_name: 'Pacific Heights Realty LLC',
    title: '1 Bedroom Waterfront Condo',
    slug: '1-bedroom-waterfront-condo-vancouver',
    description:
      'Stunning water and mountain views from this contemporary 1-bedroom condo in Coal Harbour. Includes dedicated parking space, storage locker, and bicycle room.',
    property_type: 'condo',
    country_code: 'CAN',
    country_name: 'Canada',
    state_province: 'British Columbia',
    city: 'Vancouver',
    neighborhood: 'Coal Harbour',
    street_address: '1288 W Georgia St',
    postal_code: 'V6E 4R5',
    status: 'approved',
    featured: false,
    published_at: '2026-08-18T10:00:00Z',
    images: [
      {
        id: 'img-8',
        property_id: 'prop-4',
        storage_path: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
        caption: 'Condo View',
        is_primary: true,
        sort_order: 1,
      },
    ],
    units: [
      {
        id: 'unit-5',
        property_id: 'prop-4',
        unit_number_or_name: 'Waterfront Suite #1802',
        unit_type: 'one_bedroom',
        bedrooms: 1,
        bathrooms: 1,
        square_feet: 690,
        rent_amount: 2400,
        currency_code: 'CAD',
        security_deposit: 1200,
        rent_period: 'monthly',
        available_quantity: 1,
        status: 'available',
        description: 'Bright open layout with high ceilings and floor-to-ceiling windows.',
      },
    ],
    amenities: ['Waterfront View', 'Parking', 'Concierge', 'Fitness Center', 'Sauna', 'Storage Locker'],
    created_at: '2026-08-16T12:00:00Z',
  },
  {
    id: 'prop-5',
    is_admin_direct: false,
    provider_id: 'prov-3',
    provider_name: 'Austin Premier Properties',
    title: '2 Bedroom Modern Duplex',
    slug: '2-bedroom-modern-duplex-austin',
    description:
      'Newly constructed Austin duplex with fenced yard, EV charging, polished concrete floors, and smart home automation.',
    property_type: 'duplex',
    country_code: 'USA',
    country_name: 'United States',
    state_province: 'Texas',
    city: 'Austin',
    neighborhood: 'South Congress (SoCo)',
    street_address: '1904 S Congress Ave',
    postal_code: '78704',
    status: 'pending_verification',
    featured: false,
    images: [
      {
        id: 'img-9',
        property_id: 'prop-5',
        storage_path: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
        caption: 'Duplex Front',
        is_primary: true,
        sort_order: 1,
      },
    ],
    units: [
      {
        id: 'unit-6',
        property_id: 'prop-5',
        unit_number_or_name: 'Unit A',
        unit_type: 'two_bedroom',
        bedrooms: 2,
        bathrooms: 2,
        square_feet: 1200,
        rent_amount: 2600,
        currency_code: 'USD',
        security_deposit: 2600,
        rent_period: 'monthly',
        available_quantity: 1,
        status: 'available',
      },
    ],
    amenities: ['Fenced Yard', 'EV Charger', 'Smart Home', 'Pet Friendly', 'Central A/C'],
    created_at: '2026-08-20T08:00:00Z',
  },
  {
    id: 'prop-6',
    is_admin_direct: false,
    provider_id: 'prov-2',
    provider_name: 'Kensington Residential UK',
    title: 'Luxury Sydney Harbour Penthouse',
    slug: 'luxury-sydney-harbour-penthouse',
    description:
      'Prestigious waterfront penthouse in Circular Quay with uninterrupted Sydney Harbour and Opera House views. Features floor-to-ceiling double-glazed glass, marble chef kitchen, smart climate control, and 24/7 private concierge.',
    property_type: 'penthouse',
    country_code: 'AUS',
    country_name: 'Australia',
    state_province: 'New South Wales',
    city: 'Sydney',
    neighborhood: 'Circular Quay / CBD',
    street_address: '1 Macquarie Street',
    postal_code: '2000',
    status: 'pending_verification',
    featured: false,
    images: [
      {
        id: 'img-10',
        property_id: 'prop-6',
        storage_path: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80',
        caption: 'Harbour Skyline View',
        is_primary: true,
        sort_order: 1,
      },
    ],
    units: [
      {
        id: 'unit-7',
        property_id: 'prop-6',
        unit_number_or_name: 'Penthouse #3801',
        unit_type: 'penthouse',
        bedrooms: 3,
        bathrooms: 3,
        square_feet: 2200,
        rent_amount: 5200,
        currency_code: 'AUD',
        security_deposit: 5200,
        rent_period: 'monthly',
        available_quantity: 1,
        status: 'available',
      },
    ],
    amenities: ['Harbour View', 'Concierge', 'Private Lift', 'Infinity Pool', 'Parking', 'Wine Cellar'],
    created_at: '2026-08-22T14:30:00Z',
  },
];

// Pre-seeded Admin Dynamic Listing Plans
export const INITIAL_LISTING_PLANS: ListingPlan[] = [
  {
    id: 'plan-90',
    name: '90 Days Listing Access',
    description: 'Most popular option for active landlords and property managers.',
    price: 119,
    currency_code: 'USD',
    duration_days: 90,
    is_popular: true,
    is_active: true,
    features: ['Unlimited property listings', 'Priority verification review', 'Multi-unit pricing support', 'Active for 90 days', '48-hour expiration grace window'],
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'plan-30',
    name: '30 Days Listing Access',
    description: 'Ideal for short-term vacancy fills.',
    price: 49,
    currency_code: 'USD',
    duration_days: 30,
    is_popular: false,
    is_active: true,
    features: ['Unlimited property listings', 'Standard verification', 'Active for 30 days', '48-hour expiration grace window'],
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'plan-180',
    name: '180 Days Listing Access',
    description: 'Best value for brokerages and growing portfolios.',
    price: 199,
    currency_code: 'USD',
    duration_days: 180,
    is_popular: false,
    is_active: true,
    features: ['Unlimited property listings', 'Top priority verification', 'Featured listing badges', 'Dedicated account support', 'Active for 180 days'],
    created_at: '2026-08-01T00:00:00Z',
  },
];

// Pre-seeded Payment Methods
export const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm-wire',
    name: 'Bank Wire / ACH Transfer',
    type: 'bank_wire',
    currency_code: 'USD',
    instructions: 'Send wire or ACH payment to the official Blue Sky Property Management escrow account. Upload receipt screenshot or PDF below.',
    account_name: 'BLUE SKY PROPERTY MANAGEMENT LLC',
    account_number: '9876543210',
    routing_or_swift: 'CHASUS33XXX / 122000496',
    bank_name: 'JPMorgan Chase Bank, N.A.',
    is_active: true,
  },
  {
    id: 'pm-paypal',
    name: 'PayPal Transfer',
    type: 'paypal',
    currency_code: 'USD',
    instructions: 'Send payment via PayPal to payments@blueskyproperty.com. Please include your registered Provider Email in the note.',
    paypal_email: 'payments@blueskyproperty.com',
    is_active: true,
  },
  {
    id: 'pm-zelle',
    name: 'Zelle Payment',
    type: 'zelle',
    currency_code: 'USD',
    instructions: 'Send instant payment via Zelle to billing@blueskyproperty.com. Enter your full name in the memo.',
    zelle_identifier: 'billing@blueskyproperty.com',
    is_active: true,
  },
];

// Pre-seeded Provider Payments
export const INITIAL_PROVIDER_PAYMENTS: ProviderPayment[] = [
  {
    id: 'pay-1',
    provider_id: 'prov-1',
    provider_name: 'Pacific Heights Realty LLC',
    listing_plan_id: 'plan-90',
    listing_plan_name: '90 Days Listing Access',
    payment_method_id: 'pm-wire',
    payment_method_name: 'Bank Wire / ACH Transfer',
    amount: 119,
    currency_code: 'USD',
    proof_storage_path: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1000&q=80',
    status: 'verified',
    submitted_at: '2026-08-01T10:00:00Z',
    verified_at: '2026-08-01T11:30:00Z',
    verified_by: 'Super Admin',
  },
  {
    id: 'pay-2',
    provider_id: 'prov-2',
    provider_name: 'Kensington Residential UK',
    listing_plan_id: 'plan-180',
    listing_plan_name: '180 Days Listing Access',
    payment_method_id: 'pm-wire',
    payment_method_name: 'Bank Wire / ACH Transfer',
    amount: 199,
    currency_code: 'USD',
    proof_storage_path: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1000&q=80',
    status: 'verified',
    submitted_at: '2026-08-15T09:15:00Z',
    verified_at: '2026-08-15T10:45:00Z',
    verified_by: 'Super Admin',
  },
  {
    id: 'pay-3',
    provider_id: 'prov-3',
    provider_name: 'Austin Premier Properties',
    listing_plan_id: 'plan-90',
    listing_plan_name: '90 Days Listing Access',
    payment_method_id: 'pm-zelle',
    payment_method_name: 'Zelle Payment',
    amount: 119,
    currency_code: 'USD',
    proof_storage_path: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1000&q=80',
    status: 'pending',
    submitted_at: '2026-08-28T14:20:00Z',
  },
  {
    id: 'pay-4',
    provider_id: 'prov-4',
    provider_name: 'Sydney Harbour Estates',
    listing_plan_id: 'plan-365',
    listing_plan_name: '365 Days Annual Listing Access',
    payment_method_id: 'pm-wire',
    payment_method_name: 'Bank Wire / ACH Transfer',
    amount: 349,
    currency_code: 'USD',
    proof_storage_path: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80',
    status: 'rejected',
    rejection_reason: 'Bank transfer reference code unverified on corporate ledger. Please upload clear receipt showing remittance confirmation #.',
    submitted_at: '2026-08-25T11:00:00Z',
  },
];

// Pre-seeded Provider Listing Periods
export const INITIAL_LISTING_PERIODS: ProviderListingPeriod[] = [
  {
    id: 'period-1',
    provider_id: 'prov-1',
    listing_plan_id: 'plan-90',
    payment_id: 'pay-1',
    starts_at: '2026-08-01T00:00:00Z',
    expires_at: '2026-10-30T23:59:59Z',
    grace_period_hours: 48,
    status: 'active',
  },
];

// Pre-seeded Applications
export const INITIAL_APPLICATIONS: RentalApplication[] = [
  {
    id: 'app-1',
    application_ref: 'BS-10293',
    applicant_id: 'user-john',
    applicant_name: 'John Doe',
    applicant_email: 'john.doe@example.com',
    applicant_phone: '+1 (213) 555-0199',
    applicant_dob: '1992-05-14',
    applicant_nationality: 'United States',
    applicant_address: '450 Grand Ave, Apt 12B, Los Angeles, CA 90012',
    applicant_employer: 'Apex Tech Solutions',
    applicant_occupation: 'Senior Software Engineer',
    applicant_income: 9500,
    property_id: 'prop-1',
    property_title: '2 Bedroom Modern Apartment',
    property_address: '888 S Olive Street, Los Angeles, CA',
    unit_id: 'unit-1',
    unit_name: '2 Bedroom Suite #402',
    unit_rent: 2850,
    unit_currency: 'USD',
    status: 'under_review',
    desired_move_in: '2026-09-01',
    lease_term_months: 12,
    occupants_count: 2,
    has_pets: false,
    additional_notes: 'Relocating closer to work. Excellent credit and verifiable rental history.',
    documents: [
      {
        id: 'doc-1',
        application_id: 'app-1',
        document_type: 'drivers_license',
        file_name: 'california_dl_front.jpg',
        storage_path: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
        status: 'verified',
        created_at: '2026-08-19T10:35:00Z',
      },
      {
        id: 'doc-2',
        application_id: 'app-1',
        document_type: 'proof_of_income',
        file_name: 'july_paystub_apex.pdf',
        storage_path: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
        status: 'verified',
        created_at: '2026-08-19T10:36:00Z',
      },
      {
        id: 'doc-3',
        application_id: 'app-1',
        document_type: 'utility_bill_address',
        file_name: 'ladwp_utility_bill.pdf',
        storage_path: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
        status: 'pending',
        created_at: '2026-08-19T10:37:00Z',
      },
    ],
    submitted_at: '2026-08-19T10:35:00Z',
  },
  {
    id: 'app-2',
    application_ref: 'BS-10211',
    applicant_id: 'user-john',
    applicant_name: 'John Doe',
    applicant_email: 'john.doe@example.com',
    applicant_phone: '+1 (213) 555-0199',
    applicant_dob: '1992-05-14',
    applicant_nationality: 'United States',
    applicant_address: '450 Grand Ave, Apt 12B, Los Angeles, CA 90012',
    applicant_employer: 'Apex Tech Solutions',
    applicant_occupation: 'Senior Software Engineer',
    applicant_income: 9500,
    property_id: 'prop-2',
    property_title: 'Luxury Studio Apartment',
    property_address: '290 Adelaide St W, Toronto, ON',
    unit_id: 'unit-3',
    unit_name: 'Studio Loft #1105',
    unit_rent: 1950,
    unit_currency: 'CAD',
    status: 'approved',
    desired_move_in: '2026-09-15',
    lease_term_months: 12,
    occupants_count: 1,
    has_pets: false,
    documents: [
      {
        id: 'doc-4',
        application_id: 'app-2',
        document_type: 'drivers_license',
        file_name: 'passport_verified.jpg',
        storage_path: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
        status: 'verified',
        created_at: '2026-08-10T14:20:00Z',
      },
    ],
    submitted_at: '2026-08-10T14:20:00Z',
    reviewed_at: '2026-08-12T16:00:00Z',
    reviewed_by: 'Super Admin',
  },
  {
    id: 'app-3',
    application_ref: 'BS-10304',
    applicant_id: 'user-sarah',
    applicant_name: 'Sarah Jenkins',
    applicant_email: 'sarah.jenkins@meridian-capital.co.uk',
    applicant_phone: '+44 20 7946 0988',
    applicant_dob: '1988-11-23',
    applicant_nationality: 'United Kingdom',
    applicant_address: '18 Chelsea Manor Street, London SW3 5RJ',
    applicant_employer: 'Meridian Capital Partners',
    applicant_occupation: 'Portfolio Director',
    applicant_income: 14500,
    property_id: 'prop-3',
    property_title: '3 Bedroom Victorian Townhouse',
    property_address: '14 Holland Park Gardens, London W14 8DY',
    unit_id: 'unit-4',
    unit_name: 'Entire Victorian House',
    unit_rent: 4200,
    unit_currency: 'GBP',
    status: 'under_review',
    desired_move_in: '2026-10-01',
    lease_term_months: 24,
    occupants_count: 3,
    has_pets: true,
    additional_notes: 'Family relocation. Long-term corporate lease preferred. Excellent references available upon request.',
    documents: [
      {
        id: 'doc-5',
        application_id: 'app-3',
        document_type: 'drivers_license',
        file_name: 'uk_passport_scan.jpg',
        storage_path: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
        status: 'verified',
        created_at: '2026-08-28T09:00:00Z',
      },
      {
        id: 'doc-6',
        application_id: 'app-3',
        document_type: 'proof_of_income',
        file_name: 'executive_compensation_letter.pdf',
        storage_path: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
        status: 'verified',
        created_at: '2026-08-28T09:05:00Z',
      },
    ],
    submitted_at: '2026-08-28T09:00:00Z',
  },
  {
    id: 'app-4',
    application_ref: 'BS-10189',
    applicant_id: 'user-michael',
    applicant_name: 'Michael Chang',
    applicant_email: 'm.chang@freemail.net',
    applicant_phone: '+1 (512) 555-0182',
    applicant_dob: '1995-03-08',
    applicant_nationality: 'United States',
    applicant_address: '701 Brazos St, Austin, TX 78701',
    applicant_employer: 'Freelance Design',
    applicant_occupation: 'Contractor',
    applicant_income: 3100,
    property_id: 'prop-5',
    property_title: '2 Bedroom Modern Duplex',
    property_address: '1904 S Congress Ave, Austin, TX',
    unit_id: 'unit-7',
    unit_name: 'Unit A - Ground Suite',
    unit_rent: 2200,
    unit_currency: 'USD',
    status: 'rejected',
    desired_move_in: '2026-09-01',
    lease_term_months: 6,
    occupants_count: 1,
    has_pets: false,
    additional_notes: 'Looking for short term lease while on assignment.',
    documents: [],
    submitted_at: '2026-08-24T16:15:00Z',
    reviewed_at: '2026-08-25T11:00:00Z',
    reviewed_by: 'Super Admin',
  },
];

// Pre-seeded FAQs for deterministic keyword engine
export const INITIAL_FAQS: FAQ[] = [
  {
    id: 'faq-1',
    question: 'How do I apply for a rental property?',
    answer: 'Browse our verified properties, click into the details, select your preferred unit, and click "Apply Now". Follow our frictionless 6-step wizard to submit your information and verification documents.',
    keywords: ['apply', 'application', 'how to apply', 'process', 'rent a property'],
    category: 'Applications',
    priority: 1,
    is_active: true,
  },
  {
    id: 'faq-2',
    question: 'What documents are required for verification?',
    answer: 'To verify your application, please provide: 1. Government-issued photo ID (Driver\'s License, Passport, or State ID), 2. Proof of Income (recent paystubs or tax returns), and 3. Proof of Current Address (utility bill or bank statement).',
    keywords: ['documents', 'id', 'license', 'passport', 'paystub', 'proof of income', 'requirements'],
    category: 'Verification',
    priority: 2,
    is_active: true,
  },
  {
    id: 'faq-3',
    question: 'How long does application verification take?',
    answer: 'Our administrative team reviews all rental applications and documents within 24 to 48 business hours. You can track real-time status directly from your Applicant Dashboard.',
    keywords: ['how long', 'timeline', 'verification time', 'turnaround', 'status'],
    category: 'Verification',
    priority: 3,
    is_active: true,
  },
  {
    id: 'faq-4',
    question: 'How does provider listing access work?',
    answer: 'Property providers subscribe to time-bound listing access (e.g. 30, 90, 180, or 365 Days). During your active period, you can list unlimited properties. Expired listings are gracefully hidden and republish instantly upon renewal.',
    keywords: ['provider', 'listing access', 'list property', 'subscription', 'listing plans', 'owner', 'agent'],
    category: 'Providers',
    priority: 4,
    is_active: true,
  },
];

// Pre-seeded Conversations & Messages
export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    property_id: 'prop-1',
    property_title: '2 Bedroom Modern Apartment',
    applicant_id: 'user-john',
    applicant_name: 'John Doe',
    subject: 'Inquiry on Unit #402 Availability',
    is_closed: false,
    last_message: 'Your application is currently under review by our team.',
    last_message_at: '2026-08-20T10:30:00Z',
    unread_count: 1,
    created_at: '2026-08-19T09:00:00Z',
  },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-john',
    sender_name: 'John Doe',
    is_admin: false,
    is_automated: false,
    message_body: 'Hello, is this 2 bedroom apartment still available for September move-in?',
    created_at: '2026-08-19T09:00:00Z',
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    sender_name: 'Blue Sky Assistant',
    is_admin: true,
    is_automated: true,
    message_body: 'Hello John! Yes, Unit #402 is available for September. You can start your application anytime using the "Apply Now" button.',
    created_at: '2026-08-19T09:01:00Z',
  },
  {
    id: 'msg-3',
    conversation_id: 'conv-1',
    sender_name: 'Blue Sky Support',
    is_admin: true,
    is_automated: false,
    message_body: 'Your application is currently under review by our team. We will update you shortly.',
    created_at: '2026-08-20T10:30:00Z',
  },
];

// Pre-seeded Notifications
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    user_id: 'prov-1',
    type: 'listing_expiring',
    title: 'Listing Access Active',
    message: 'Your 90-Day Listing Access has 70 days remaining (Expires Oct 30, 2026).',
    link_url: '/provider/plans',
    is_read: false,
    created_at: '2026-08-20T08:00:00Z',
  },
  {
    id: 'notif-2',
    user_id: 'user-john',
    type: 'app_approved',
    title: 'Application Approved!',
    message: 'Your application for Luxury Studio Apartment (Toronto) has been approved!',
    link_url: '/applicant/applications',
    is_read: false,
    created_at: '2026-08-12T16:00:00Z',
  },
];

// Helper Storage Manager with localStorage persistence
class DataStore {
  private static instance: DataStore;
  private currentRole: UserRole = 'applicant';

  private constructor() {}

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(`bluesky_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`bluesky_${key}`, JSON.stringify(value));
    } catch (e: any) {
      console.warn(`LocalStorage write failed for bluesky_${key}:`, e?.message || e);
      try {
        // Attempt to clean heavy data URLs before retrying
        const sanitized = JSON.parse(
          JSON.stringify(value, (k, v) => {
            if (typeof v === 'string' && v.startsWith('data:') && v.length > 50000) {
              return `[data_url_truncated_${v.slice(0, 30)}...]`;
            }
            return v;
          })
        );
        localStorage.setItem(`bluesky_${key}`, JSON.stringify(sanitized));
      } catch (retryError) {
        console.warn('LocalStorage sanitized write also failed; continuing gracefully in-memory.');
      }
    }
  }

  // Active User Role & Session Management
  public getRole(): UserRole {
    return this.getItem<UserRole>('role', 'applicant');
  }

  public setRole(role: UserRole): void {
    this.setItem('role', role);
  }

  public getCurrentUser(): { id: string; email: string; full_name: string; role: UserRole } | null {
    return this.getItem<any>('current_user', null);
  }

  public setCurrentUser(user: { id: string; email: string; full_name: string; role: UserRole } | null): void {
    this.setItem('current_user', user);
    if (user) {
      this.setItem('role', user.role);
      this.setItem('is_authenticated', true);
    } else {
      this.setItem('is_authenticated', false);
    }
  }

  public isAuthenticated(): boolean {
    return this.getItem<boolean>('is_authenticated', false);
  }

  public clearSession(): void {
    this.setItem('current_user', null);
    this.setItem('is_authenticated', false);
    this.setItem('role', 'applicant');
  }

  // Properties
  public getProperties(): Property[] {
    return this.getItem<Property[]>('properties', INITIAL_PROPERTIES);
  }

  public saveProperty(property: Property): void {
    const properties = this.getProperties();
    const index = properties.findIndex((p) => p.id === property.id);
    if (index >= 0) {
      properties[index] = property;
    } else {
      properties.unshift(property);
    }
    this.setItem('properties', properties);
  }

  public getPublicActiveProperties(): Property[] {
    const properties = this.getProperties();
    const periods = this.getListingPeriods();
    const now = new Date().getTime();

    return properties.filter((p) => {
      if (p.status !== 'approved') return false;
      if (p.is_admin_direct) return true;

      // Check if provider has active listing period (including 48h grace)
      const period = periods.find((lp) => lp.provider_id === p.provider_id && lp.status === 'active');
      if (!period) return false;
      const expiry = new Date(period.expires_at).getTime() + (period.grace_period_hours || 48) * 3600 * 1000;
      return expiry > now;
    });
  }

  // Listing Plans
  public getListingPlans(): ListingPlan[] {
    return this.getItem<ListingPlan[]>('listing_plans', INITIAL_LISTING_PLANS);
  }

  public saveListingPlan(plan: ListingPlan): void {
    const plans = this.getListingPlans();
    const index = plans.findIndex((p) => p.id === plan.id);
    if (index >= 0) {
      plans[index] = plan;
    } else {
      plans.unshift(plan);
    }
    this.setItem('listing_plans', plans);
  }

  public deleteListingPlan(planId: string): void {
    const plans = this.getListingPlans().filter((p) => p.id !== planId);
    this.setItem('listing_plans', plans);
  }

  // Payment Methods
  public getPaymentMethods(): PaymentMethod[] {
    return this.getItem<PaymentMethod[]>('payment_methods', INITIAL_PAYMENT_METHODS);
  }

  public savePaymentMethod(method: PaymentMethod): void {
    const methods = this.getPaymentMethods();
    const index = methods.findIndex((m) => m.id === method.id);
    if (index >= 0) {
      methods[index] = method;
    } else {
      methods.push(method);
    }
    this.setItem('payment_methods', methods);
  }

  public deletePaymentMethod(methodId: string): void {
    const methods = this.getPaymentMethods().filter((m) => m.id !== methodId);
    this.setItem('payment_methods', methods);
  }

  // Provider Payments
  public getProviderPayments(): ProviderPayment[] {
    return this.getItem<ProviderPayment[]>('provider_payments', INITIAL_PROVIDER_PAYMENTS);
  }

  public saveProviderPayment(payment: ProviderPayment): void {
    const payments = this.getProviderPayments();
    const index = payments.findIndex((p) => p.id === payment.id);
    if (index >= 0) {
      payments[index] = payment;
    } else {
      payments.unshift(payment);
    }
    this.setItem('provider_payments', payments);
  }

  // Listing Periods
  public getListingPeriods(): ProviderListingPeriod[] {
    return this.getItem<ProviderListingPeriod[]>('listing_periods', INITIAL_LISTING_PERIODS);
  }

  public saveListingPeriod(period: ProviderListingPeriod): void {
    const periods = this.getListingPeriods();
    const index = periods.findIndex((p) => p.id === period.id);
    if (index >= 0) {
      periods[index] = period;
    } else {
      periods.unshift(period);
    }
    this.setItem('listing_periods', periods);
  }

  // Rental Applications
  public getApplications(): RentalApplication[] {
    return this.getItem<RentalApplication[]>('applications', INITIAL_APPLICATIONS);
  }

  public saveApplication(app: RentalApplication): void {
    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === app.id);
    if (index >= 0) {
      apps[index] = app;
    } else {
      apps.unshift(app);
    }
    this.setItem('applications', apps);
  }

  // FAQs & Keyword Matcher
  public getFAQs(): FAQ[] {
    return this.getItem<FAQ[]>('faqs', INITIAL_FAQS);
  }

  public matchKeywordFAQ(userText: string): FAQ | null {
    const faqs = this.getFAQs().filter((f) => f.is_active);
    const normalized = userText.toLowerCase();

    for (const faq of faqs) {
      for (const kw of faq.keywords) {
        if (normalized.includes(kw.toLowerCase())) {
          return faq;
        }
      }
    }
    return null;
  }

  // Conversations & Messages
  public getConversations(): Conversation[] {
    return this.getItem<Conversation[]>('conversations', INITIAL_CONVERSATIONS);
  }

  public getMessages(conversationId: string): Message[] {
    const all = this.getItem<Message[]>('messages', INITIAL_MESSAGES);
    return all.filter((m) => m.conversation_id === conversationId);
  }

  public addMessage(msg: Message): void {
    const all = this.getItem<Message[]>('messages', INITIAL_MESSAGES);
    all.push(msg);
    this.setItem('messages', all);

    // Update conversation snippet
    const convos = this.getConversations();
    const cIdx = convos.findIndex((c) => c.id === msg.conversation_id);
    if (cIdx >= 0) {
      convos[cIdx].last_message = msg.message_body;
      convos[cIdx].last_message_at = msg.created_at;
      this.setItem('conversations', convos);
    }
  }

  // Notifications
  public getNotifications(): NotificationItem[] {
    return this.getItem<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS);
  }

  public markNotificationAsRead(id: string): void {
    const notifs = this.getNotifications();
    const index = notifs.findIndex((n) => n.id === id);
    if (index >= 0) {
      notifs[index].is_read = true;
      this.setItem('notifications', notifs);
    }
  }

  // Application Fee Settings (Admin configurable)
  public getApplicationFeeSettings(): ApplicationFeeSettings {
    return this.getItem<ApplicationFeeSettings>('application_fee_settings', {
      is_enabled: true,
      amount: 50,
      currency_code: 'USD',
    });
  }

  public saveApplicationFeeSettings(settings: ApplicationFeeSettings): void {
    this.setItem('application_fee_settings', settings);
  }

  // Application Payments (Tenant Verification Fee Proofs)
  public getApplicationPayments(): ApplicationPayment[] {
    return this.getItem<ApplicationPayment[]>('application_payments', []);
  }

  public saveApplicationPayment(payment: ApplicationPayment): void {
    const payments = this.getApplicationPayments();
    const index = payments.findIndex((p) => p.id === payment.id);
    if (index >= 0) {
      payments[index] = payment;
    } else {
      payments.unshift(payment);
    }
    this.setItem('application_payments', payments);
  }
}

export const store = DataStore.getInstance();
