import React, { useState, useEffect } from 'react';
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
  Save,
  Eye,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { propertiesDb } from '@/lib/db/properties';
import { store } from '@/lib/store';
import { Property, PropertyUnit, PropertyType, UnitType } from '@/lib/types';

interface UnitFormItem {
  id?: string;
  unit_number_or_name: string;
  unit_type: UnitType;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  rent_amount: number;
  currency_code: string;
  security_deposit: number;
  available_quantity: number;
  status: 'available' | 'under_application' | 'leased' | 'unavailable';
}

interface ImageFormItem {
  id?: string;
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

export default function AdminEditPropertyPage() {
  const router = useRouter();
  const { id } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Original Property State
  const [property, setProperty] = useState<Property | null>(null);

  // 1. General Info
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<'approved' | 'pending_verification' | 'draft' | 'rejected'>('approved');

  // 2. Location
  const [countryCode, setCountryCode] = useState('USA');
  const [stateProvince, setStateProvince] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // 3. Images Management
  const [images, setImages] = useState<ImageFormItem[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // 4. Units Management
  const [units, setUnits] = useState<UnitFormItem[]>([]);

  // 5. Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const loadPropertyData = async () => {
      setIsLoading(true);
      try {
        const prop = await propertiesDb.getPropertyById(id);
        if (prop) {
          setProperty(prop);
          setTitle(prop.title || '');
          setPropertyType(prop.property_type || 'apartment');
          setDescription(prop.description || '');
          setFeatured(Boolean(prop.featured));
          setStatus((prop.status as any) || 'approved');
          setCountryCode(prop.country_code || 'USA');
          setStateProvince(prop.state_province || '');
          setCity(prop.city || '');
          setNeighborhood(prop.neighborhood || '');
          setStreetAddress(prop.street_address || '');
          setPostalCode(prop.postal_code || '');

          if (prop.images && prop.images.length > 0) {
            setImages(
              prop.images.map((img, idx) => ({
                id: img.id,
                storage_path: img.storage_path,
                caption: img.caption || 'Property Photo',
                is_primary: img.is_primary ?? idx === 0,
              }))
            );
          } else {
            setImages([
              {
                storage_path: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
                caption: 'Building Exterior',
                is_primary: true,
              },
            ]);
          }

          if (prop.units && prop.units.length > 0) {
            setUnits(
              prop.units.map((u) => ({
                id: u.id,
                unit_number_or_name: u.unit_number_or_name,
                unit_type: u.unit_type || 'one_bedroom',
                bedrooms: u.bedrooms || 1,
                bathrooms: u.bathrooms || 1,
                square_feet: u.square_feet || 800,
                rent_amount: u.rent_amount || 2000,
                currency_code: u.currency_code || 'USD',
                security_deposit: u.security_deposit || 2000,
                available_quantity: u.available_quantity || 1,
                status: u.status || 'available',
              }))
            );
          } else {
            setUnits([
              {
                unit_number_or_name: 'Main Residence',
                unit_type: 'one_bedroom',
                bedrooms: 1,
                bathrooms: 1,
                square_feet: 800,
                rent_amount: 2000,
                currency_code: 'USD',
                security_deposit: 2000,
                available_quantity: 1,
                status: 'available',
              },
            ]);
          }

          setSelectedAmenities(prop.amenities || ['Parking', 'Security Concierge', 'Central A/C']);
        } else {
          setErrorMessage('Property record not found in database.');
        }
      } catch (err: any) {
        console.error('Error fetching property to edit:', err);
        setErrorMessage(err.message || 'Failed to load property details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPropertyData();
  }, [id]);

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
        status: 'available',
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

  const handleSaveChanges = async (e: React.FormEvent) => {
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

    const countryNames: Record<string, string> = {
      USA: 'United States',
      CAN: 'Canada',
      GBR: 'United Kingdom',
      AUS: 'Australia',
      EUR: 'Europe',
    };

    const targetPropId = property?.id || (id as string);
    const targetSlug = property?.slug || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${(city || 'city').toLowerCase()}`;

    const updatedProperty: Property = {
      ...property,
      id: targetPropId,
      is_admin_direct: property?.is_admin_direct ?? true,
      provider_id: property?.provider_id,
      provider_name: property?.provider_name || 'Blue Sky Direct Property',
      title: title.trim(),
      slug: targetSlug,
      description: description.trim() || 'Property listed on Blue Sky.',
      property_type: propertyType,
      country_code: countryCode,
      country_name: countryNames[countryCode] || countryCode,
      state_province: stateProvince.trim() || 'California',
      city: city.trim() || 'Los Angeles',
      neighborhood: neighborhood.trim() || undefined,
      street_address: streetAddress.trim() || '1000 Wilshire Blvd',
      postal_code: postalCode.trim() || '90017',
      status: status,
      published_at: status === 'approved' ? (property?.published_at || new Date().toISOString()) : undefined,
      featured: featured,
      images: images.map((img, idx) => ({
        id: img.id || `img-${Date.now()}-${idx}`,
        property_id: targetPropId,
        storage_path: img.storage_path,
        caption: img.caption || 'Property Photo',
        is_primary: img.is_primary,
        sort_order: idx + 1,
      })),
      units: units.map((u, idx) => ({
        id: u.id || `unit-${Date.now()}-${idx}`,
        property_id: targetPropId,
        unit_number_or_name: u.unit_number_or_name,
        unit_type: u.unit_type,
        bedrooms: Number(u.bedrooms) || 1,
        bathrooms: Number(u.bathrooms) || 1,
        square_feet: u.square_feet ? Number(u.square_feet) : undefined,
        rent_amount: Number(u.rent_amount) || 0,
        currency_code: u.currency_code || 'USD',
        security_deposit: u.security_deposit ? Number(u.security_deposit) : undefined,
        rent_period: 'monthly' as const,
        available_quantity: Number(u.available_quantity) || 1,
        status: u.status || 'available',
      })),
      amenities: selectedAmenities,
      created_at: property?.created_at || new Date().toISOString(),
    };

    try {
      await propertiesDb.saveProperty(updatedProperty);
      setSuccessMessage('Property updated successfully!');
      setTimeout(() => {
        router.push('/admin/properties');
      }, 900);
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMessage(err.message || 'Failed to update property in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Loading Property... | Blue Sky Admin">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
          <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Loading property configuration from database...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Edit Property: ${title || 'Listing'} | Blue Sky Admin`} headerTitle="Edit Property Listing">
      <div style={{ padding: '24px 16px 80px 16px', maxWidth: 840, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex-between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => router.push('/admin/properties')}
              style={{
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-navy-dark)',
                width: 36,
                height: 36,
              }}
              title="Return to Properties Registry"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                Edit Property Listing
              </h1>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Update title, pricing, unit plans, photo gallery, and verification status
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              href={`/properties/${property?.slug || id}`}
              target="_blank"
              className="btn btn-outline-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <Eye size={14} /> Preview Live Page
            </Link>
          </div>
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

        <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                    <option value="single_family_house">Single Family House</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="condo">Condo</option>
                    <option value="duplex">Duplex</option>
                    <option value="studio">Studio</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Publication Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="approved">Live & Verified (Approved)</option>
                    <option value="pending_verification">Pending Review</option>
                    <option value="draft">Draft (Unpublished)</option>
                    <option value="rejected">Suspended / Rejected</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Featured Badge</label>
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
                  placeholder="Detailed description of layout, amenities, transport..."
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
              Add photos via web URL or upload files from device. Click &quot;Make Primary&quot; to set the main thumbnail.
            </p>

            {/* Add Image Controls */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flex: 1, minWidth: 260, gap: 6 }}>
                <input
                  type="url"
                  placeholder="Paste direct image URL (https://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="form-input"
                  style={{ fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="btn btn-outline"
                  style={{ padding: '0 14px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  <Plus size={14} /> Add URL
                </button>
              </div>

              <label
                className="btn btn-outline-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                <Upload size={14} /> Upload Device Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Image Preview Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: 12,
              }}
            >
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    border: img.is_primary ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-subtle)',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'relative', height: 115, backgroundColor: '#0F172A' }}>
                    <img
                      src={img.storage_path}
                      alt={img.caption || 'Property'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {img.is_primary && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          left: 6,
                          backgroundColor: 'var(--color-primary)',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Primary Photo
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      type="text"
                      placeholder="Caption (e.g. Master Bedroom)"
                      value={img.caption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setImages((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, caption: val } : item))
                        );
                      }}
                      style={{
                        width: '100%',
                        fontSize: 11,
                        padding: '4px 6px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 4,
                        outline: 'none',
                      }}
                    />
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(idx)}
                        style={{
                          background: 'none',
                          border: '1px solid var(--color-border)',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          cursor: 'pointer',
                          padding: '3px 0',
                          width: '100%',
                        }}
                      >
                        Make Primary
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Global Location */}
          <div className="card" style={{ padding: 20, borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} color="var(--color-primary)" /> Property Location
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Country Scope *</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="form-select"
                  >
                    <option value="USA">United States (USA)</option>
                    <option value="CAN">Canada (CAN)</option>
                    <option value="GBR">United Kingdom (GBR)</option>
                    <option value="AUS">Australia (AUS)</option>
                    <option value="EUR">European Union (EUR)</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">State / Province / Region *</label>
                  <input
                    type="text"
                    placeholder="e.g. California, Ontario, London, NSW"
                    value={stateProvince}
                    onChange={(e) => setStateProvince(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Los Angeles, Toronto, London"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Neighborhood (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Downtown, Mayfair, Yorkville"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Street Address *</label>
                  <input
                    type="text"
                    placeholder="e.g. 1000 Wilshire Boulevard"
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
                    placeholder="e.g. 90017, M5V 2T6"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Units & Pricing Configuration */}
          <div className="card" style={{ padding: 20, borderRadius: 'var(--radius-xl)' }}>
            <div className="flex-between" style={{ marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={18} color="var(--color-primary)" /> Configured Units & Pricing ({units.length})
                </h2>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Define rental rates, bedrooms, bathrooms, and security deposits
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddUnit}
                className="btn btn-outline-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
              >
                <Plus size={14} /> Add Unit
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {units.map((unit, idx) => (
                <div
                  key={unit.id || idx}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div className="flex-between">
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                      Unit Configuration #{idx + 1}
                    </span>
                    {units.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveUnit(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={13} /> Remove Unit
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                        Unit Identifier / Name *
                      </label>
                      <input
                        type="text"
                        value={unit.unit_number_or_name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUnits((prev) =>
                            prev.map((u, i) => (i === idx ? { ...u, unit_number_or_name: val } : u))
                          );
                        }}
                        className="form-input"
                        style={{ fontSize: 12 }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                        Unit Type
                      </label>
                      <select
                        value={unit.unit_type}
                        onChange={(e) => {
                          const val = e.target.value as UnitType;
                          setUnits((prev) =>
                            prev.map((u, i) => (i === idx ? { ...u, unit_type: val } : u))
                          );
                        }}
                        className="form-select"
                        style={{ fontSize: 12 }}
                      >
                        <option value="studio">Studio</option>
                        <option value="one_bedroom">1 Bedroom</option>
                        <option value="two_bedroom">2 Bedrooms</option>
                        <option value="three_bedroom">3 Bedrooms</option>
                        <option value="four_plus_bedroom">4+ Bedrooms</option>
                        <option value="penthouse">Penthouse</option>
                        <option value="entire_house">Entire House</option>
                        <option value="room">Private Room</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                        Monthly Rent Amount *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={unit.rent_amount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setUnits((prev) =>
                              prev.map((u, i) => (i === idx ? { ...u, rent_amount: val } : u))
                            );
                          }}
                          className="form-input"
                          style={{ fontSize: 12, paddingLeft: 22 }}
                          required
                        />
                        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          $
                        </span>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                        Security Deposit
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={unit.security_deposit}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setUnits((prev) =>
                              prev.map((u, i) => (i === idx ? { ...u, security_deposit: val } : u))
                            );
                          }}
                          className="form-input"
                          style={{ fontSize: 12, paddingLeft: 22 }}
                        />
                        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          $
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={unit.bedrooms}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setUnits((prev) =>
                            prev.map((u, i) => (i === idx ? { ...u, bedrooms: val } : u))
                          );
                        }}
                        className="form-input"
                        style={{ fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                        Bathrooms
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={unit.bathrooms}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1;
                          setUnits((prev) =>
                            prev.map((u, i) => (i === idx ? { ...u, bathrooms: val } : u))
                          );
                        }}
                        className="form-input"
                        style={{ fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                        Square Footage
                      </label>
                      <input
                        type="number"
                        min="100"
                        step="25"
                        value={unit.square_feet}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setUnits((prev) =>
                            prev.map((u, i) => (i === idx ? { ...u, square_feet: val } : u))
                          );
                        }}
                        className="form-input"
                        style={{ fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                        Inventory Count
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={unit.available_quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setUnits((prev) =>
                            prev.map((u, i) => (i === idx ? { ...u, available_quantity: val } : u))
                          );
                        }}
                        className="form-input"
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: Amenities Selector */}
          <div className="card" style={{ padding: 20, borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--color-primary)" /> Property Amenities & Highlights
            </h2>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
              Select all building amenities and unit features included with this rental listing.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 8,
              }}
            >
              {COMMON_AMENITIES.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleToggleAmenity(amenity)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'rgba(0, 102, 255, 0.08)' : 'var(--color-white)',
                      color: isSelected ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: isSelected ? 'none' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              paddingTop: 12,
            }}
          >
            <Link
              href="/admin/properties"
              className="btn btn-outline"
              style={{ padding: '10px 20px', textDecoration: 'none', fontWeight: 600 }}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                padding: '10px 28px',
                fontSize: 14,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(0, 102, 255, 0.25)',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save size={16} /> Save & Update Property
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
