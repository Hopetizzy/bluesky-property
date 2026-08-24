import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { store } from '../store';
import { Property, PropertyUnit, PropertyImage } from '../types';

export const propertiesDb = {
  // 1. Get all approved active properties visible publicly
  async getPublicProperties(): Promise<Property[]> {
    if (!isSupabaseConfigured()) {
      return store.getPublicActiveProperties();
    }

    try {
      const { data, error } = await supabase
        .from('v_public_active_properties')
        .select(`
          id,
          title,
          slug,
          description,
          property_type,
          country_code,
          country_name,
          state_province,
          city,
          neighborhood,
          street_address,
          postal_code,
          latitude,
          longitude,
          featured,
          published_at,
          is_admin_direct,
          provider_id,
          provider_display_name,
          property_images (id, storage_path, caption, is_primary, sort_order),
          property_units (id, unit_number_or_name, unit_type, bedrooms, bathrooms, square_feet, rent_amount, currency_code, security_deposit, rent_period, available_quantity, status),
          property_amenities (amenity:amenities (name))
        `)
        .order('featured', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        images: row.property_images || [],
        units: row.property_units || [],
        amenities: (row.property_amenities || []).map((pa: any) => pa.amenity?.name).filter(Boolean),
        status: 'approved',
      }));
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local store:', err);
      return store.getPublicActiveProperties();
    }
  },

  // 2. Get property by Slug or ID
  async getPropertyBySlug(slug: string): Promise<Property | null> {
    return this.getPropertyById(slug);
  },

  // 2b. Get property by ID or Slug with full relations
  async getPropertyById(idOrSlug: string): Promise<Property | null> {
    if (!isSupabaseConfigured()) {
      return store.getProperties().find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
    }

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      let query = supabase
        .from('properties')
        .select(`
          *,
          property_images (*),
          property_units (*),
          property_amenities (amenity:amenities (name))
        `);

      if (isUuid) {
        query = query.eq('id', idOrSlug);
      } else {
        query = query.eq('slug', idOrSlug);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (!data) {
        return store.getProperties().find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
      }

      return {
        ...data,
        images: data.property_images || [],
        units: data.property_units || [],
        amenities: (data.property_amenities || []).map((pa: any) => pa.amenity?.name).filter(Boolean),
      };
    } catch (err) {
      console.warn('Supabase getPropertyById error, using local fallback:', err);
      return store.getProperties().find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
    }
  },

  // 3. Save / Upsert Property with units and images
  async saveProperty(property: Property): Promise<Property> {
    store.saveProperty(property);

    if (isSupabaseConfigured()) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(property.id);
        const propId = isUuid ? property.id : undefined;

        const propPayload: any = {
          title: property.title,
          slug: property.slug,
          description: property.description,
          property_type: property.property_type,
          country_code: property.country_code,
          country_name: property.country_name,
          state_province: property.state_province,
          city: property.city,
          neighborhood: property.neighborhood,
          street_address: property.street_address,
          postal_code: property.postal_code,
          status: property.status,
          featured: property.featured || false,
        };

        if (propId) {
          propPayload.id = propId;
        }
        if (property.provider_id) {
          const isProvUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(property.provider_id);
          if (isProvUuid) {
            propPayload.provider_id = property.provider_id;
          }
        }
        propPayload.is_admin_direct = property.is_admin_direct || false;

        const { data: savedProp, error } = await supabase
          .from('properties')
          .upsert(propPayload)
          .select()
          .single();

        if (error) {
          console.error('Supabase property upsert error:', error);
        } else if (savedProp) {
          const insertedId = savedProp.id;

          // Insert / upsert units
          if (property.units && property.units.length > 0) {
            const unitsPayload = property.units.map((u) => {
              const uIsUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.id);
              const uPayload: any = {
                property_id: insertedId,
                unit_number_or_name: u.unit_number_or_name,
                unit_type: u.unit_type || 'one_bedroom',
                bedrooms: u.bedrooms || 1,
                bathrooms: u.bathrooms || 1,
                square_feet: u.square_feet || null,
                rent_amount: u.rent_amount || 0,
                currency_code: u.currency_code || 'USD',
                security_deposit: u.security_deposit || null,
                rent_period: u.rent_period || 'monthly',
                available_quantity: u.available_quantity || 1,
                status: u.status || 'available',
                description: u.description || null,
              };
              if (uIsUuid) uPayload.id = u.id;
              return uPayload;
            });

            await supabase.from('property_units').upsert(unitsPayload);
          }

          // Insert images
          if (property.images && property.images.length > 0) {
            const imagesPayload = property.images.map((img, idx) => ({
              property_id: insertedId,
              storage_path: img.storage_path,
              caption: img.caption || '',
              is_primary: idx === 0,
              sort_order: idx + 1,
            }));

            await supabase.from('property_images').upsert(imagesPayload);
          }
        }
      } catch (err) {
        console.error('Supabase save error:', err);
      }
    }

    return property;
  },

  // 4. Update Property Verification Status (Admin Approve / Reject)
  async setPropertyStatus(id: string, status: Property['status'], notes?: string): Promise<void> {
    const properties = store.getProperties();
    const target = properties.find((p) => p.id === id);
    if (target) {
      target.status = status;
      if (notes) target.verification_notes = notes;
      if (status === 'approved') target.published_at = new Date().toISOString();
      store.saveProperty(target);
    }

    if (isSupabaseConfigured()) {
      await supabase
        .from('properties')
        .update({
          status: status,
          verification_notes: notes || null,
          verified_at: status === 'approved' ? new Date().toISOString() : null,
          published_at: status === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', id);
    }
  },

  // 5. Toggle Featured Status (Admin)
  async toggleFeatured(id: string, featured: boolean): Promise<void> {
    const properties = store.getProperties();
    const target = properties.find((p) => p.id === id);
    if (target) {
      target.featured = featured;
      store.saveProperty(target);
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('properties')
          .update({ featured: featured })
          .eq('id', id);
      } catch (err) {
        console.error('Supabase toggleFeatured error:', err);
      }
    }
  },

  // 6. Get all properties owned by a specific provider
  async getPropertiesByProvider(providerId: string): Promise<Property[]> {
    if (!isSupabaseConfigured()) {
      return store.getProperties().filter((p) => p.provider_id === providerId);
    }

    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (id, storage_path, caption, is_primary, sort_order),
          property_units (id, unit_number_or_name, unit_type, bedrooms, bathrooms, square_feet, rent_amount, currency_code, security_deposit, rent_period, available_quantity, status),
          property_amenities (amenity:amenities (name))
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        images: row.property_images || [],
        units: row.property_units || [],
        amenities: (row.property_amenities || []).map((pa: any) => pa.amenity?.name).filter(Boolean),
      }));
    } catch (err) {
      console.warn('Supabase provider properties fetch failed, falling back to local store:', err);
      return store.getProperties().filter((p) => p.provider_id === providerId);
    }
  },
};
