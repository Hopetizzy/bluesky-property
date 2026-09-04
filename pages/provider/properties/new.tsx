import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  Building2,
  MapPin,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { propertiesDb } from '@/lib/db/properties';
import { listingPlansDb } from '@/lib/db/listingPlans';
import { notifyPropertyCreated } from '@/lib/notificationService';
import { Property, PropertyUnit, PropertyType, ProviderListingPeriod, ProviderProfile } from '@/lib/types';
import { SUPPORTED_REGIONS, getStatesForCountry } from '@/lib/constants';

export default function AddPropertyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Provider Context
  const [providerId, setProviderId] = useState<string>('prov-1');
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [listingPeriod, setListingPeriod] = useState<ProviderListingPeriod | null>(null);
  const [hasActiveAccess, setHasActiveAccess] = useState<boolean>(true);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [description, setDescription] = useState('');

  // Step 2: Location (Worldwide)
  const [countryCode, setCountryCode] = useState('USA');
  const [stateProvince, setStateProvince] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Step 3: Units & Pricing
  const [units, setUnits] = useState<PropertyUnit[]>([
    {
      id: `unit-temp-1`,
      property_id: '',
      unit_number_or_name: 'Unit #101',
      unit_type: 'two_bedroom',
      bedrooms: 2,
      bathrooms: 2,
      square_feet: 950,
      rent_amount: 2400,
      currency_code: 'USD',
      security_deposit: 2400,
      rent_period: 'monthly',
      available_quantity: 1,
      status: 'available',
      description: 'Primary luxury rental unit with open layout and modern fixtures.',
    },
  ]);

  // Step 4: Amenities
  const allAmenities = [
    'Parking',
    'Security Concierge',
    'Swimming Pool',
    'Fitness Center',
    'In-unit Laundry',
    'Central A/C',
    'Pet Friendly',
    'Balcony',
    'Private Garden',
    'High-speed Internet',
    'Elevator',
    'EV Charging',
    'Doorman',
    'Rooftop Deck',
    'Storage Unit',
    'Wheelchair Accessible',
  ];
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Parking',
    'In-unit Laundry',
    'Central A/C',
    'High-speed Internet',
  ]);

  // Step 5: Images
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  ]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    async function checkProviderAuth() {
      setIsLoadingAuth(true);
      try {
        if (isSupabaseConfigured()) {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
              .maybeSingle();

            if (profile?.id) {
              const { data: provProf } = await supabase
                .from('provider_profiles')
                .select('*')
                .eq('profile_id', profile.id)
                .maybeSingle();

              if (provProf?.id) {
                setProviderId(provProf.id);
                setProviderProfile(provProf);

                // Fetch listing period
                const period = await listingPlansDb.getProviderActivePeriod(provProf.id);
                setListingPeriod(period);

                const now = new Date().getTime();
                const expiresAt = period ? new Date(period.expires_at).getTime() : 0;
                const graceWindow = (period?.grace_period_hours || 48) * 3600 * 1000;
                const isActive = period ? expiresAt + graceWindow > now && period.status === 'active' : false;
                setHasActiveAccess(isActive);
              }
            }
          }
        } else {
          // Local fallback
          const periods = store.getListingPeriods();
          if (periods.length > 0) {
            setListingPeriod(periods[0]);
            setHasActiveAccess(true);
          }
        }
      } catch (err) {
        console.warn('Provider check note:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    }

    checkProviderAuth();
  }, []);

  // Sync currency with country selection
  useEffect(() => {
    const defaultCurrency =
      countryCode === 'CAN'
        ? 'CAD'
        : countryCode === 'GBR'
        ? 'GBP'
        : countryCode === 'AUS'
        ? 'AUD'
        : countryCode === 'EUR'
        ? 'EUR'
        : 'USD';

    setUnits((prev) =>
      prev.map((u) => ({
        ...u,
        currency_code: defaultCurrency,
      }))
    );
  }, [countryCode]);

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleAddUnit = () => {
    const currency = countryCode === 'CAN' ? 'CAD' : countryCode === 'GBR' ? 'GBP' : 'USD';
    const newUnit: PropertyUnit = {
      id: `unit-temp-${Date.now()}`,
      property_id: '',
      unit_number_or_name: `Unit #${units.length + 1}`,
      unit_type: 'one_bedroom',
      bedrooms: 1,
      bathrooms: 1,
      square_feet: 750,
      rent_amount: 1850,
      currency_code: currency,
      security_deposit: 1850,
      rent_period: 'monthly',
      available_quantity: 1,
      status: 'available',
    };
    setUnits([...units, newUnit]);
  };

  const handleRemoveUnit = (id: string) => {
    if (units.length > 1) {
      setUnits(units.filter((u) => u.id !== id));
    }
  };

  // Image upload handler with client-side canvas compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    const fileArray = Array.from(files);
    let processedCount = 0;
    const newImgs: string[] = [];

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const rawResult = uploadEvent.target?.result as string;
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 1000;
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              newImgs.push(canvas.toDataURL('image/jpeg', 0.75));
            } else {
              newImgs.push(rawResult);
            }
          } catch {
            newImgs.push(rawResult);
          }

          processedCount++;
          if (processedCount === fileArray.length) {
            setImages((prev) => [...prev, ...newImgs]);
            setIsUploadingImage(false);
          }
        };
        img.onerror = () => {
          processedCount++;
          if (processedCount === fileArray.length) {
            if (newImgs.length > 0) setImages((prev) => [...prev, ...newImgs]);
            setIsUploadingImage(false);
          }
        };
        img.src = rawResult;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddCustomUrl = () => {
    if (customImageUrl.trim() && customImageUrl.startsWith('http')) {
      setImages([...images, customImageUrl.trim()]);
      setCustomImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    if (images.length > 1) {
      setImages(images.filter((_, i) => i !== index));
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    const selected = images[index];
    const rest = images.filter((_, i) => i !== index);
    setImages([selected, ...rest]);
  };

  // Submit property to database
  const handleFinish = async () => {
    if (!title.trim() || !city.trim() || !streetAddress.trim()) {
      alert('Please fill in the property title, city, and street address before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newPropertyId = `prop-${Date.now()}`;
      const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

      const newProperty: Property = {
        id: newPropertyId,
        provider_id: providerId,
        provider_name: providerProfile?.company_name || 'Verified Property Partner',
        is_admin_direct: false,
        title: title.trim(),
        slug: slug,
        description: description.trim() || 'Modern residential property with top-tier finishes and amenities.',
        property_type: propertyType,
        country_code: countryCode,
        country_name:
          countryCode === 'USA'
            ? 'United States'
            : countryCode === 'CAN'
            ? 'Canada'
            : countryCode === 'GBR'
            ? 'United Kingdom'
            : countryCode === 'AUS'
            ? 'Australia'
            : 'European Union',
        state_province: stateProvince.trim() || 'State/Province',
        city: city.trim(),
        neighborhood: neighborhood.trim() || undefined,
        street_address: streetAddress.trim(),
        postal_code: postalCode.trim() || undefined,
        status: 'pending_verification',
        featured: false,
        images: images.map((url, i) => ({
          id: `img-${Date.now()}-${i}`,
          property_id: newPropertyId,
          storage_path: url,
          caption: i === 0 ? 'Primary Image' : `Interior Photo ${i}`,
          is_primary: i === 0,
          sort_order: i + 1,
        })),
        units: units.map((u, idx) => ({
          ...u,
          id: `unit-${Date.now()}-${idx}`,
          property_id: newPropertyId,
        })),
        amenities: selectedAmenities,
        created_at: new Date().toISOString(),
      };

      await propertiesDb.saveProperty(newProperty);

      try {
        await notifyPropertyCreated({
          propertyId: newProperty.id,
          propertyTitle: newProperty.title,
          providerId: newProperty.provider_id,
        });
      } catch (notifErr) {
        console.warn('Property created notification note:', notifErr);
      }

      router.push(`/provider/properties/${newProperty.id}/status`);
    } catch (err) {
      console.error('Error creating property:', err);
      alert('An error occurred while saving the property. Please try again.');
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Identity' },
    { num: 2, label: 'Location' },
    { num: 3, label: 'Units' },
    { num: 4, label: 'Amenities' },
    { num: 5, label: 'Photos' },
    { num: 6, label: 'Review' },
  ];

  return (
    <AppLayout title="Add New Property | Blue Sky Provider" hideNav={true} hideHeader={true}>
      {/* Wizard Header Bar */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-white)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex-between" style={{ maxWidth: 840, margin: '0 auto 16px auto' }}>
          <button
            onClick={() => {
              if (currentStep > 1) setCurrentStep(currentStep - 1);
              else router.push('/provider/properties');
            }}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--color-navy-dark)',
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={18} />
            <span>{currentStep === 1 ? 'Cancel' : 'Previous Step'}</span>
          </button>

          <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            List New Rental Property
          </h1>

          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Step {currentStep} of 6
          </div>
        </div>

        {/* Stepper Progress Indicator */}
        <div style={{ maxWidth: 840, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 14, left: 24, right: 24, height: 2, backgroundColor: '#E2E8F0', zIndex: 1 }} />
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 24,
              width: `${((currentStep - 1) / 5) * 88}%`,
              height: 2,
              backgroundColor: 'var(--color-primary)',
              zIndex: 2,
              transition: 'width 0.25s ease',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {steps.map((s) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 3 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isDone) setCurrentStep(s.num);
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: isDone ? 'var(--color-success)' : isCurrent ? 'var(--color-primary)' : 'var(--color-white)',
                      border: isDone || isCurrent ? 'none' : '2px solid #CBD5E1',
                      color: isDone || isCurrent ? 'white' : 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: isDone ? 'pointer' : 'default',
                      boxShadow: isCurrent ? '0 0 0 3px rgba(14, 116, 144, 0.2)' : 'none',
                    }}
                  >
                    {isDone ? <Check size={14} /> : s.num}
                  </button>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent ? 'var(--color-primary)' : isDone ? 'var(--color-navy-dark)' : 'var(--color-text-muted)',
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <div style={{ padding: '24px 16px 80px 16px', maxWidth: 760, margin: '0 auto' }}>
        {/* Listing Access Warning Banner if not active */}
        {!hasActiveAccess && (
          <div
            style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: 'var(--radius-lg)',
              padding: 14,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={20} color="#D97706" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>No Active Listing Access Plan</div>
                <div style={{ fontSize: 12, color: '#B45309' }}>
                  You can prepare your draft, but you will need an active listing plan to publish properties globally.
                </div>
              </div>
            </div>
            <Link href="/provider/plans" className="btn btn-primary btn-sm" style={{ height: 36 }}>
              <CreditCard size={14} /> Get Access Plan
            </Link>
          </div>
        )}

        {/* STEP 1: Basic Identity */}
        {currentStep === 1 && (
          <div className="card" style={{ padding: 24, margin: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 4 }}>
              Property Identity & Type
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Provide the commercial title, category, and descriptive summary of this listing.
            </p>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                Property Title <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                placeholder="e.g. Skyline Luxury Suites at Grand Avenue"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                Property Category
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="form-select"
              >
                <option value="apartment">Apartment / Flat</option>
                <option value="house">House / Single Family Detached</option>
                <option value="townhouse">Townhouse / Rowhouse</option>
                <option value="duplex">Duplex / Multi-Family</option>
                <option value="studio">Studio Apartment</option>
                <option value="commercial">Commercial Space</option>
                <option value="other">Other Residential</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Public Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                rows={5}
                placeholder="Highlight architectural details, neighborhood conveniences, public transit access, appliances, and community features..."
              />
            </div>
          </div>
        )}

        {/* STEP 2: Location */}
        {currentStep === 2 && (
          <div className="card" style={{ padding: 24, margin: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 4 }}>
              Worldwide Location & Address
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Enter accurate geographic details. Our team audits addresses to ensure marketplace trust.
            </p>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                Country
              </label>
              <select
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  setStateProvince('');
                }}
                className="form-select"
                style={{ fontWeight: 600 }}
              >
                {SUPPORTED_REGIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  State / Province <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <select
                  value={stateProvince}
                  onChange={(e) => setStateProvince(e.target.value)}
                  className="form-select"
                  required
                  style={{ fontWeight: 600 }}
                >
                  <option value="">Select State / Province</option>
                  {getStatesForCountry(countryCode).map((s) => (
                    <option key={s.code} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  City <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Atlanta / Charlotte / Toronto"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                Street Address <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="form-input"
                placeholder="e.g. 888 S Olive Street"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Neighborhood / District
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Downtown / South Park"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="form-input"
                  placeholder="e.g. 90014 / M5V 2T6"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Units & Pricing */}
        {currentStep === 3 && (
          <div className="card" style={{ padding: 24, margin: 0 }}>
            <div className="flex-between" style={{ marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                Rental Units & Pricing Inventory
              </h2>
              <button
                type="button"
                onClick={handleAddUnit}
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> + Add Another Unit
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Configure unit types, floor space, monthly rent, and security deposit requirements.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {units.map((unit, index) => (
                <div
                  key={unit.id}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 16,
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {index + 1}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                        Unit Configuration #{index + 1}
                      </span>
                    </div>

                    {units.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveUnit(unit.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-danger)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                        }}
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
                        Unit Number / Name
                      </label>
                      <input
                        type="text"
                        value={unit.unit_number_or_name}
                        onChange={(e) => {
                          const updated = [...units];
                          updated[index].unit_number_or_name = e.target.value;
                          setUnits(updated);
                        }}
                        className="form-input"
                        placeholder="e.g. Apt 4B / Penthouse Suite"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
                        Unit Layout Type
                      </label>
                      <select
                        value={unit.unit_type}
                        onChange={(e) => {
                          const updated = [...units];
                          updated[index].unit_type = e.target.value as any;
                          setUnits(updated);
                        }}
                        className="form-select"
                      >
                        <option value="studio">Studio</option>
                        <option value="one_bedroom">1 Bedroom</option>
                        <option value="two_bedroom">2 Bedrooms</option>
                        <option value="three_bedroom">3 Bedrooms</option>
                        <option value="four_plus_bedroom">4+ Bedrooms</option>
                        <option value="entire_house">Entire House</option>
                        <option value="penthouse">Penthouse</option>
                        <option value="room">Private Room</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={unit.bedrooms}
                        onChange={(e) => {
                          const updated = [...units];
                          updated[index].bedrooms = parseInt(e.target.value, 10) || 0;
                          setUnits(updated);
                        }}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
                        Bathrooms
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        value={unit.bathrooms}
                        onChange={(e) => {
                          const updated = [...units];
                          updated[index].bathrooms = parseFloat(e.target.value) || 1;
                          setUnits(updated);
                        }}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
                        Sq Footage (sq ft)
                      </label>
                      <input
                        type="number"
                        min="100"
                        value={unit.square_feet || ''}
                        onChange={(e) => {
                          const updated = [...units];
                          updated[index].square_feet = parseInt(e.target.value, 10) || undefined;
                          setUnits(updated);
                        }}
                        className="form-input"
                        placeholder="e.g. 950"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
                        Monthly Rent ({unit.currency_code})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={unit.rent_amount}
                        onChange={(e) => {
                          const updated = [...units];
                          updated[index].rent_amount = parseFloat(e.target.value) || 0;
                          setUnits(updated);
                        }}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Amenities */}
        {currentStep === 4 && (
          <div className="card" style={{ padding: 24, margin: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 4 }}>
              Included Property Amenities
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Select all building amenities and unit conveniences available to tenants.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {allAmenities.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-full)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary-tint)' : 'var(--color-white)',
                      color: isSelected ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                      fontSize: 13,
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    {isSelected ? <Check size={16} /> : <Plus size={14} color="var(--color-text-muted)" />}
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Images & Media */}
        {currentStep === 5 && (
          <div className="card" style={{ padding: 24, margin: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 4 }}>
              Property Photos & Visual Assets
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Upload high-resolution exterior and interior photos. The first image will be used as the primary listing hero.
            </p>

            {/* Photo Upload Zone */}
            <div
              style={{
                border: '2px dashed #BAE6FD',
                backgroundColor: '#F0F9FF',
                borderRadius: 'var(--radius-xl)',
                padding: '30px 20px',
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              <Upload size={36} color="var(--color-primary)" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 4 }}>
                Upload Photos from Device
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', maxWidth: 400, margin: '0 auto 16px auto' }}>
                PNG, JPG, or WebP format. High-resolution photos generate up to 300% more tenant applications.
              </p>

              <label className="btn btn-primary btn-sm" style={{ display: 'inline-flex', cursor: 'pointer', gap: 6 }}>
                <ImageIcon size={16} /> Choose Image Files
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {isUploadingImage && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, fontSize: 12, color: 'var(--color-primary)' }}>
                  <Loader2 className="animate-spin" size={14} /> Processing photo upload...
                </div>
              )}
            </div>

            {/* Direct Image URL Input */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input
                type="url"
                placeholder="Or paste an image URL (https://...)"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAddCustomUrl}
                disabled={!customImageUrl.trim()}
                className="btn btn-outline btn-sm"
                style={{ height: 42 }}
              >
                + Add URL
              </button>
            </div>

            {/* Photo Previews Gallery Grid */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 10 }}>
                Current Gallery ({images.length} Photos)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                {images.map((imgUrl, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      height: 110,
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: i === 0 ? '3px solid var(--color-primary)' : '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <img src={imgUrl} alt={`Upload ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                    {i === 0 ? (
                      <span
                        style={{
                          position: 'absolute',
                          top: 6,
                          left: 6,
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        PRIMARY
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(i)}
                        style={{
                          position: 'absolute',
                          bottom: 6,
                          left: 6,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          border: 'none',
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        Set Primary
                      </button>
                    )}

                    {images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title="Remove photo"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Review & Final Submission */}
        {currentStep === 6 && (
          <div>
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 12 }}>
                Review Property Summary
              </h2>

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 }}>
                <img
                  src={images[0]}
                  alt="Review hero"
                  style={{ width: 110, height: 90, borderRadius: 'var(--radius-lg)', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <Badge variant="pending">READY FOR SUBMISSION</Badge>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-navy-dark)', margin: '6px 0 4px 0' }}>
                    {title || 'Untitled Property'}
                  </h3>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} />
                    <span>
                      {streetAddress}, {city}, {stateProvince} ({countryCode})
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 8 }}>
                  Configured Rental Units ({units.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {units.map((u, idx) => (
                    <div
                      key={idx}
                      className="flex-between"
                      style={{ fontSize: 12, padding: '6px 10px', backgroundColor: '#F8FAFC', borderRadius: 6 }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {u.unit_number_or_name} ({u.bedrooms} Bed, {u.bathrooms} Bath)
                      </span>
                      <strong style={{ color: 'var(--color-primary)' }}>
                        {u.currency_code} ${u.rent_amount.toLocaleString()}/mo
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                {selectedAmenities.length} Amenities Selected • {images.length} High-Res Photos Uploaded
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                fontSize: 13,
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <CheckCircle2 size={20} color="#16A34A" style={{ flexShrink: 0 }} />
              <div>
                Upon submission, your listing will be routed to Blue Sky verification compliance. Once verified, it will be published to renters worldwide.
              </div>
            </div>
          </div>
        )}

        {/* Wizard Action Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginTop: 24 }}>
          <button
            type="button"
            onClick={() => {
              if (currentStep > 1) setCurrentStep(currentStep - 1);
              else router.push('/provider/properties');
            }}
            className="btn btn-secondary"
            style={{ height: 48 }}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              if (currentStep < 6) {
                if (currentStep === 1 && !title.trim()) {
                  alert('Please enter a property title before continuing.');
                  return;
                }
                if (currentStep === 2 && (!city.trim() || !streetAddress.trim())) {
                  alert('Please enter both City and Street Address before continuing.');
                  return;
                }
                setCurrentStep(currentStep + 1);
              } else {
                handleFinish();
              }
            }}
            className="btn btn-primary"
            style={{
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 15,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Submitting Property...
              </>
            ) : currentStep === 6 ? (
              <>
                <CheckCircle2 size={18} /> Submit for Verification
              </>
            ) : (
              'Continue to Next Step'
            )}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
