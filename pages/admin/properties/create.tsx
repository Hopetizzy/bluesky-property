import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Check, Upload, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { store } from '@/lib/store';
import { Property, PropertyUnit, PropertyType } from '@/lib/types';

export default function AdminCreatePropertyPage() {
  const router = useRouter();

  const [title, setTitle] = useState('Blue Sky Luxury Penthouse');
  const [propertyType, setPropertyType] = useState<PropertyType>('penthouse');
  const [description, setDescription] = useState('Premier high-floor penthouse residence owned and managed directly by Blue Sky.');
  const [countryCode, setCountryCode] = useState('USA');
  const [stateProvince, setStateProvince] = useState('California');
  const [city, setCity] = useState('Los Angeles');
  const [streetAddress, setStreetAddress] = useState('1000 Wilshire Blvd, Suite 3400');
  const [postalCode, setPostalCode] = useState('90017');
  const [rentAmount, setRentAmount] = useState('4500');
  const [bedrooms, setBedrooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('3');
  const [featured, setFeatured] = useState(true);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `prop-admin-${Date.now()}`;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${city.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    const newProperty: Property = {
      id: newId,
      is_admin_direct: true,
      provider_name: 'Blue Sky Direct Property',
      title: title,
      slug: slug,
      description: description,
      property_type: propertyType,
      country_code: countryCode,
      country_name: countryCode === 'USA' ? 'United States' : 'Canada',
      state_province: stateProvince,
      city: city,
      street_address: streetAddress,
      postal_code: postalCode,
      status: 'approved',
      published_at: new Date().toISOString(),
      featured: featured,
      images: [
        {
          id: `img-${Date.now()}-1`,
          property_id: newId,
          storage_path: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
          caption: 'Penthouse View',
          is_primary: true,
          sort_order: 1,
        },
      ],
      units: [
        {
          id: `unit-${Date.now()}-1`,
          property_id: newId,
          unit_number_or_name: 'Penthouse Suite 3400',
          unit_type: 'penthouse',
          bedrooms: parseInt(bedrooms, 10) || 3,
          bathrooms: parseFloat(bathrooms) || 3,
          rent_amount: parseFloat(rentAmount) || 4500,
          currency_code: 'USD',
          security_deposit: parseFloat(rentAmount) || 4500,
          rent_period: 'monthly',
          available_quantity: 1,
          status: 'available',
        },
      ],
      amenities: ['Parking', 'Security Concierge', 'Swimming Pool', 'Fitness Center', 'Private Balcony', 'Central A/C'],
      created_at: new Date().toISOString(),
    };

    store.saveProperty(newProperty);
    alert('First-Party Property published directly to the public marketplace!');
    router.push('/admin/properties');
  };

  return (
    <AppLayout title="Direct Property Upload | Blue Sky Admin" headerTitle="Direct Property Upload">
      <div style={{ padding: '16px 16px 80px 16px' }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--color-navy-dark)',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 800 }}>Publish First-Party Property</h1>
          <div style={{ width: 20 }} />
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-primary-tint)',
            padding: 14,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #BAE6FD',
            marginBottom: 20,
            fontSize: 12,
            color: 'var(--color-navy-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <ShieldCheck size={24} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <span>
            First-party properties published by Blue Sky go <strong>live immediately</strong> without requiring provider subscription periods.
          </span>
        </div>

        <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Property Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="form-select"
              >
                <option value="penthouse">Penthouse</option>
                <option value="apartment">Apartment</option>
                <option value="studio">Studio</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Country</label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="form-select"
              >
                <option value="USA">United States</option>
                <option value="CAN">Canada</option>
                <option value="GBR">United Kingdom</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">State / Province</label>
              <input
                type="text"
                value={stateProvince}
                onChange={(e) => setStateProvince(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Street Address</label>
            <input
              type="text"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Rent ($/mo)</label>
              <input
                type="number"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Bedrooms</label>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Bathrooms</label>
              <input
                type="number"
                step="0.5"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              rows={3}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
            Publish Directly to Marketplace
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
