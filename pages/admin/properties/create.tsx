import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Upload,
  Plus,
  Trash2,
  ShieldCheck,
  Building2,
  Image as ImageIcon,
  MapPin,
  DollarSign,
  Layers,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { propertiesDb } from '@/lib/db';
import { SUPPORTED_REGIONS, getStatesForCountry } from '@/lib/constants';
import { Property, PropertyUnit, PropertyType, PropertyImage, UnitType, RentPeriod } from '@/lib/types';

interface NewUnitForm {
  unit_number_or_name: string;
  unit_type: UnitType;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  rent_amount: number;
  currency_code: string;
  security_deposit: number;
  available_quantity: number;
}

interface NewImageForm {
  storage_path: string;
  caption: string;
  is_primary: boolean;
}

const COMMON_AMENITIES = [
  'Parking',
  'Security Concierge',
  'Swimming Pool',
  'Fitness Center',
  'In-unit Laundry',
  'Central A/C',
  'Pet Friendly',
  'Balcony',
  'EV Charger',
  'Dishwasher',
  'Storage Locker',
  'Rooftop Lounge',
  'Smart Home',
  'Elevator',
];

export default function AdminCreatePropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Property General Info
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(true);

  // 2. Location
  const [countryCode, setCountryCode] = useState('USA');
  const [stateProvince, setStateProvince] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // 3. Images Management
  const [images, setImages] = useState<NewImageForm[]>([
    {
      storage_path: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      caption: 'Building Exterior',
      is_primary: true,
    },
  ]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // 4. Units Management
  const [units, setUnits] = useState<NewUnitForm[]>([
    {
      unit_number_or_name: 'Main Residence',
      unit_type: 'two_bedroom',
      bedrooms: 2,
      bathrooms: 2,
      square_feet: 1100,
      rent_amount: 3200,
      currency_code: 'USD',
      security_deposit: 3200,
      available_quantity: 1,
    },
  ]);

  // 5. Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Parking',
    'Security Concierge',
    'In-unit Laundry',
    'Central A/C',
  ]);

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        storage_path: imageUrlInput.trim(),
        caption: 'Property View',
        is_primary: prev.length === 0,
      },
    ]);
    setImageUrlInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) return;

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 1400;
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
            let optimizedResult = result;
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              optimizedResult = canvas.toDataURL('image/jpeg', 0.8);
            }

            setImages((prev) => [
              ...prev,
              {
                storage_path: optimizedResult,
                caption: file.name.replace(/\.[^/.]+$/, ''),
                is_primary: prev.length === 0,
              },
            ]);
          } catch {
            setImages((prev) => [
              ...prev,
              {
                storage_path: result,
                caption: file.name.replace(/\.[^/.]+$/, ''),
                is_primary: prev.length === 0,
              },
            ]);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        is_primary: idx === index,
      }))
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      if (updated.length > 0 && !updated.some((img) => img.is_primary)) {
        updated[0].is_primary = true;
      }
      return updated;
    });
  };

  const handleAddUnit = () => {
    setUnits((prev) => [
      ...prev,
      {
        unit_number_or_name: `Suite #${prev.length + 1}01`,
        unit_type: 'one_bedroom',
        bedrooms: 1,
        bathrooms: 1,
        square_feet: 750,
        rent_amount: 2200,
        currency_code: countryCode === 'GBR' ? 'GBP' : countryCode === 'CAN' ? 'CAD' : countryCode === 'AUS' ? 'AUD' : 'USD',
        security_deposit: 2200,
        available_quantity: 1,
      },
    ]);
  };

  const handleRemoveUnit = (index: number) => {
    if (units.length <= 1) {
      alert('A property must have at least one unit configuration.');
      return;
    }
    setUnits((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim()) {
      setErrorMessage('Please provide a property title.');
      setIsSubmitting(false);
      return;
    }

    if (images.length === 0) {
      setErrorMessage('Please provide at least 1 image for the property.');
      setIsSubmitting(false);
      return;
    }

    const propId = `prop-admin-${Date.now()}`;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${(city || 'city').toLowerCase()}-${Date.now().toString().slice(-4)}`;

    const countryNames: Record<string, string> = {
      USA: 'United States',
      CAN: 'Canada',
      GBR: 'United Kingdom',
      AUS: 'Australia',
      EUR: 'Europe',
    };

    const newProperty: Property = {
      id: propId,
      is_admin_direct: true,
      provider_name: 'Blue Sky Direct Property',
      title: title.trim(),
      slug: slug,
      description: description.trim() || 'First-party property managed by Blue Sky.',
      property_type: propertyType,
      country_code: countryCode,
      country_name: countryNames[countryCode] || countryCode,
      state_province: stateProvince.trim() || 'Georgia',
      city: city.trim() || 'Atlanta',
      neighborhood: neighborhood.trim() || undefined,
      street_address: streetAddress.trim() || '950 Peachtree St NE',
      postal_code: postalCode.trim() || '30309',
      status: 'approved',
      published_at: new Date().toISOString(),
      featured: featured,
      images: images.map((img, idx) => ({
        id: `img-${Date.now()}-${idx}`,
        property_id: propId,
        storage_path: img.storage_path,
        caption: img.caption || 'Property Photo',
        is_primary: img.is_primary,
        sort_order: idx + 1,
      })),
      units: units.map((u, idx) => ({
        id: `unit-${Date.now()}-${idx}`,
        property_id: propId,
        unit_number_or_name: u.unit_number_or_name,
        unit_type: u.unit_type,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        square_feet: u.square_feet,
        rent_amount: u.rent_amount,
        currency_code: u.currency_code,
        security_deposit: u.security_deposit,
        rent_period: 'monthly',
        available_quantity: u.available_quantity,
        status: 'available',
      })),
      amenities: selectedAmenities,
      created_at: new Date().toISOString(),
    };

    try {
      await propertiesDb.saveProperty(newProperty);
      setSuccessMessage('First-Party Property created and published live successfully!');
      setTimeout(() => {
        router.push('/admin/properties');
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save property to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout title="Add Direct Property | Blue Sky Admin" headerTitle="Add New Property">
      <div style={{ padding: '24px 16px 80px 16px', maxWidth: 840, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex-between" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => router.back()}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'var(--color-navy-dark)',
                padding: 0,
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                Publish First-Party Property
              </h1>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Direct Blue Sky inventory goes live immediately without provider fees
              </span>
            </div>
          </div>
        </div>

        {/* Informational Callout */}
        <div
          style={{
            backgroundColor: 'rgba(0, 102, 255, 0.08)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(0, 102, 255, 0.2)',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--color-navy-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <ShieldCheck size={24} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <span>
            First-party properties published by Admin are marked <strong>Live & Verified</strong> automatically and syndicated worldwide.
          </span>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid #FECACA',
              color: 'var(--color-danger-text)',
              fontSize: 13,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} color="var(--color-danger)" style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-success-bg)',
              border: '1px solid #86EFAC',
              color: 'var(--color-success-text)',
              fontSize: 13,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* SECTION 1: General Details */}
          <div className="card" style={{ padding: 20, borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={18} color="var(--color-primary)" /> General Information
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Property Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 2 Bedroom Luxury Waterfront Apartment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    className="form-select"
                  >
                    <option value="apartment">Apartment</option>
                    <option value="house">House / Single Family</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="duplex">Duplex</option>
                    <option value="studio">Studio</option>
                    <option value="commercial">Commercial</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Featured on Home Page</label>
                  <select
                    value={featured ? 'yes' : 'no'}
                    onChange={(e) => setFeatured(e.target.value === 'yes')}
                    className="form-select"
                  >
                    <option value="yes">Yes (Featured Badge)</option>
                    <option value="no">Standard Listing</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Property Description</label>
                <textarea
                  placeholder="Detailed description of building architecture, layout, views, and neighborhood highlights..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  style={{ minHeight: 90, padding: 12 }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Property Images Management */}
          <div className="card" style={{ padding: 20, borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ImageIcon size={18} color="var(--color-primary)" /> Property Gallery & Images ({images.length})
            </h2>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
              Upload local photos or paste high-resolution URLs. Set one image as the primary cover photo.
            </p>

            {/* Upload or Add URL Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 16 }}>
              <input
                type="url"
                placeholder="Paste image URL (https://images.unsplash.com/...)"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="form-input"
                style={{ height: 42, fontSize: 13 }}
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <Plus size={16} /> Add URL
              </button>
            </div>

            {/* Local File Upload Button */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px dashed var(--color-border)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <Upload size={18} />
                <span>Upload Photos from Device (JPG, PNG, WebP)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Image Preview Gallery */}
            {images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      border: img.is_primary ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: '#000',
                      height: 140,
                    }}
                  >
                    <img
                      src={img.storage_path}
                      alt={`Photo ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Primary Badge */}
                    {img.is_primary && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontSize: 10,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Star size={10} fill="white" /> Primary Cover
                      </div>
                    )}

                    {/* Controls Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        insetInline: 0,
                        padding: '6px 8px',
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      {!img.is_primary ? (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            cursor: 'pointer',
                          }}
                        >
                          Set Primary
                        </button>
                      ) : <span />}

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.8)',
                          border: 'none',
                          color: 'white',
                          padding: 4,
                          borderRadius: 4,
                          cursor: 'pointer',
                          display: 'flex',
                        }}
                        title="Remove Photo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: Location & Address */}
          <div className="card" style={{ padding: 20, borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} color="var(--color-primary)" /> Property Location
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Country</label>
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

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">State / Province</label>
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

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Atlanta, Charlotte, Toronto..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 888 S Olive Street"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Postal / ZIP Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 90014"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Units & Rent Pricing */}
          <div className="card" style={{ padding: 20, borderRadius: 'var(--radius-xl)' }}>
            <div className="flex-between" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={18} color="var(--color-primary)" /> Units & Rent Pricing ({units.length})
              </h2>
              <button
                type="button"
                onClick={handleAddUnit}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
              >
                <Plus size={14} /> Add Another Unit
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {units.map((unit, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-subtle)',
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                      Unit #{idx + 1} Configuration
                    </span>
                    {units.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveUnit(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 11, marginBottom: 2 }}>Unit Name / Suite #</label>
                      <input
                        type="text"
                        value={unit.unit_number_or_name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, unit_number_or_name: val } : u)));
                        }}
                        className="form-input"
                        style={{ height: 38, fontSize: 12 }}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11, marginBottom: 2 }}>Unit Type</label>
                      <select
                        value={unit.unit_type}
                        onChange={(e) => {
                          const val = e.target.value as UnitType;
                          setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, unit_type: val } : u)));
                        }}
                        className="form-select"
                        style={{ height: 38, fontSize: 12 }}
                      >
                        <option value="studio">Studio</option>
                        <option value="one_bedroom">1 Bedroom</option>
                        <option value="two_bedroom">2 Bedroom</option>
                        <option value="three_bedroom">3 Bedroom</option>
                        <option value="penthouse">Penthouse</option>
                        <option value="entire_house">Entire House</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11, marginBottom: 2 }}>Bedrooms</label>
                      <input
                        type="number"
                        min="0"
                        value={unit.bedrooms}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, bedrooms: val } : u)));
                        }}
                        className="form-input"
                        style={{ height: 38, fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11, marginBottom: 2 }}>Bathrooms</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        value={unit.bathrooms}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1;
                          setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, bathrooms: val } : u)));
                        }}
                        className="form-input"
                        style={{ height: 38, fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11, marginBottom: 2 }}>Monthly Rent ({unit.currency_code})</label>
                      <input
                        type="number"
                        min="1"
                        value={unit.rent_amount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, rent_amount: val } : u)));
                        }}
                        className="form-input"
                        style={{ height: 38, fontSize: 12, fontWeight: 700 }}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11, marginBottom: 2 }}>Security Deposit</label>
                      <input
                        type="number"
                        min="0"
                        value={unit.security_deposit}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, security_deposit: val } : u)));
                        }}
                        className="form-input"
                        style={{ height: 38, fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: Amenities */}
          <div className="card" style={{ padding: 20, borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color="var(--color-primary)" /> Features & Amenities
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {COMMON_AMENITIES.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    type="button"
                    key={amenity}
                    onClick={() => handleToggleAmenity(amenity)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'rgba(0, 102, 255, 0.08)' : 'var(--color-white)',
                      color: isSelected ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && <Check size={12} />}
                    </div>
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', height: 48, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Publishing to Database...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} /> Publish Property Live
              </>
            )}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
