import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { Property, PropertyType, UnitType } from '@/lib/types';
import { randomUUID } from 'crypto';

const isUuid = (str?: string) =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isServerSupabaseConfigured()) {
    return res.status(200).json({ success: false, message: 'Supabase server key not configured', data: [] });
  }

  // GET: Fetch all properties for admin verification and management
  if (req.method === 'GET') {
    try {
      // 1. Fetch all properties from DB
      const { data: propsData, error: propsErr } = await supabaseServer
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (propsErr) throw propsErr;

      if (!propsData || propsData.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }

      // 2. Fetch images, units, amenities, and provider details in parallel
      const [imagesRes, unitsRes, propAmenitiesRes, amenitiesRes, providersRes, profilesRes] = await Promise.all([
        supabaseServer.from('property_images').select('*').order('sort_order', { ascending: true }),
        supabaseServer.from('property_units').select('*'),
        supabaseServer.from('property_amenities').select('*'),
        supabaseServer.from('amenities').select('id, name'),
        supabaseServer.from('provider_profiles').select('id, profile_id, company_name, business_phone'),
        supabaseServer.from('profiles').select('id, full_name, email, phone'),
      ]);

      const imagesByProp = new Map<string, any[]>();
      (imagesRes.data || []).forEach((img: any) => {
        const list = imagesByProp.get(img.property_id) || [];
        list.push(img);
        imagesByProp.set(img.property_id, list);
      });

      const unitsByProp = new Map<string, any[]>();
      (unitsRes.data || []).forEach((u: any) => {
        const list = unitsByProp.get(u.property_id) || [];
        list.push(u);
        unitsByProp.set(u.property_id, list);
      });

      const amenitiesNameMap = new Map((amenitiesRes.data || []).map((a: any) => [a.id, a.name]));
      const amenitiesByProp = new Map<string, string[]>();
      (propAmenitiesRes.data || []).forEach((pa: any) => {
        const name = amenitiesNameMap.get(pa.amenity_id);
        if (name) {
          const list = amenitiesByProp.get(pa.property_id) || [];
          list.push(name);
          amenitiesByProp.set(pa.property_id, list);
        }
      });

      const providersMap = new Map((providersRes.data || []).map((prov: any) => [prov.id, prov]));
      const profilesMap = new Map((profilesRes.data || []).map((prof: any) => [prof.id, prof]));

      const formatted: Property[] = propsData.map((p: any) => {
        let providerName = p.is_admin_direct ? 'Blue Sky Direct Property' : 'Property Provider Partner';
        if (p.provider_id) {
          const prov = providersMap.get(p.provider_id) || (providersRes.data || []).find((pr: any) => pr.profile_id === p.provider_id);
          const prof = prov?.profile_id ? profilesMap.get(prov.profile_id) : profilesMap.get(p.provider_id);
          providerName = prov?.company_name || prof?.full_name || prof?.email || providerName;
        }

        return {
          id: p.id,
          provider_id: p.provider_id,
          provider_name: providerName,
          is_admin_direct: p.is_admin_direct || false,
          title: p.title,
          slug: p.slug,
          description: p.description,
          property_type: p.property_type,
          country_code: p.country_code || 'USA',
          country_name: p.country_name || 'United States',
          state_province: p.state_province,
          city: p.city,
          neighborhood: p.neighborhood,
          street_address: p.street_address,
          postal_code: p.postal_code,
          latitude: p.latitude ? Number(p.latitude) : undefined,
          longitude: p.longitude ? Number(p.longitude) : undefined,
          status: p.status,
          verification_notes: p.verification_notes,
          verified_at: p.verified_at,
          published_at: p.published_at,
          featured: Boolean(p.featured),
          created_at: p.created_at,
          updated_at: p.updated_at,
          images: imagesByProp.get(p.id) || [],
          units: unitsByProp.get(p.id) || [],
          amenities: amenitiesByProp.get(p.id) || [],
        };
      });

      return res.status(200).json({ success: true, data: formatted });
    } catch (err: any) {
      console.error('API /api/admin/properties GET error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST: Create or Save Property
  if (req.method === 'POST') {
    try {
      const body = req.body as Property;
      if (!body.title) {
        return res.status(400).json({ success: false, error: 'Missing title' });
      }

      const generatedSlug = body.slug?.trim() || `${body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${(body.city || 'city').toLowerCase()}-${Date.now().toString().slice(-4)}`;
      const propId = isUuid(body.id) ? body.id : randomUUID();

      let propStatus = body.status || (body.is_admin_direct ? 'approved' : 'pending_verification');
      if ((propStatus as string) === 'pending') propStatus = 'pending_verification';

      const propPayload: any = {
        id: propId,
        title: body.title.trim(),
        slug: generatedSlug,
        description: body.description?.trim() || 'Property listed on Blue Sky.',
        property_type: body.property_type || 'apartment',
        country_code: body.country_code || 'USA',
        country_name: body.country_name || 'United States',
        state_province: body.state_province?.trim() || 'Georgia',
        city: body.city?.trim() || 'Atlanta',
        neighborhood: body.neighborhood?.trim() || null,
        street_address: body.street_address?.trim() || '100 Wilshire Blvd',
        postal_code: body.postal_code?.trim() || '90001',
        status: propStatus,
        featured: Boolean(body.featured),
        published_at: body.published_at || (propStatus === 'approved' ? new Date().toISOString() : null),
        updated_at: new Date().toISOString(),
      };

      if (body.provider_id && isUuid(body.provider_id)) {
        const { data: provProf } = await supabaseServer
          .from('provider_profiles')
          .select('id')
          .or(`id.eq.${body.provider_id},profile_id.eq.${body.provider_id}`)
          .maybeSingle();

        if (provProf?.id) {
          propPayload.provider_id = provProf.id;
          propPayload.is_admin_direct = body.is_admin_direct ?? false;
        } else {
          propPayload.provider_id = body.provider_id;
          propPayload.is_admin_direct = body.is_admin_direct ?? false;
        }
      } else if (body.is_admin_direct === false) {
        const { data: defaultProv } = await supabaseServer.from('provider_profiles').select('id').limit(1).maybeSingle();
        if (defaultProv?.id) {
          propPayload.provider_id = defaultProv.id;
          propPayload.is_admin_direct = false;
        } else {
          propPayload.provider_id = null;
          propPayload.is_admin_direct = true;
        }
      } else {
        propPayload.provider_id = null;
        propPayload.is_admin_direct = true;
      }

      const { data: savedProp, error: propErr } = await supabaseServer
        .from('properties')
        .upsert(propPayload)
        .select()
        .single();

      if (propErr) {
        console.error('Supabase property insert error:', propErr);
        throw propErr;
      }

      const insertedPropId = savedProp.id;

      // 1. Upsert Units
      if (body.units && body.units.length > 0) {
        const unitsPayload = body.units.map((u) => ({
          id: isUuid(u.id) ? u.id : randomUUID(),
          property_id: insertedPropId,
          unit_number_or_name: u.unit_number_or_name || 'Unit 1',
          unit_type: u.unit_type || 'one_bedroom',
          bedrooms: Number(u.bedrooms) || 1,
          bathrooms: Number(u.bathrooms) || 1,
          square_feet: u.square_feet ? Number(u.square_feet) : null,
          rent_amount: Number(u.rent_amount) || 0,
          currency_code: u.currency_code || 'USD',
          security_deposit: u.security_deposit ? Number(u.security_deposit) : null,
          rent_period: u.rent_period || 'monthly',
          available_quantity: Number(u.available_quantity) || 1,
          status: u.status || 'available',
          description: u.description || null,
        }));

        const { error: unitsErr } = await supabaseServer.from('property_units').upsert(unitsPayload);
        if (unitsErr) console.error('Property units insert note:', unitsErr);
      }

      // 2. Upsert Images
      if (body.images && body.images.length > 0) {
        const processedImages = await Promise.all(
          body.images.map(async (img, idx) => {
            let storagePath = img.storage_path || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

            // If image is a data URL (base64) and storage is available, upload to storage bucket
            if (storagePath.startsWith('data:image/')) {
              try {
                const matches = storagePath.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                  const contentType = matches[1];
                  const buffer = Buffer.from(matches[2], 'base64');
                  const ext = contentType.split('/')[1] || 'jpg';
                  const fileName = `property_${insertedPropId}_${Date.now()}_${idx}.${ext}`;

                  const { data: uploadData, error: uploadErr } = await supabaseServer.storage
                    .from('property-images')
                    .upload(fileName, buffer, { contentType, upsert: true });

                  if (!uploadErr && uploadData?.path) {
                    const { data: pubUrlData } = supabaseServer.storage
                      .from('property-images')
                      .getPublicUrl(uploadData.path);
                    if (pubUrlData?.publicUrl) {
                      storagePath = pubUrlData.publicUrl;
                    }
                  }
                }
              } catch (uploadErr) {
                console.warn('Storage upload note for property image:', uploadErr);
              }
            }

            return {
              id: isUuid(img.id) ? img.id : randomUUID(),
              property_id: insertedPropId,
              storage_path: storagePath,
              caption: img.caption || 'Property Photo',
              is_primary: img.is_primary ?? (idx === 0),
              sort_order: img.sort_order || (idx + 1),
            };
          })
        );

        const { error: imgErr } = await supabaseServer.from('property_images').upsert(processedImages);
        if (imgErr) console.warn('Property images upsert note:', imgErr);
      }

      // 3. Upsert Amenities
      if (body.amenities && body.amenities.length > 0) {
        try {
          const { data: existingAmenities } = await supabaseServer.from('amenities').select('id, name');
          const existingMap = new Map((existingAmenities || []).map((a: any) => [a.name.toLowerCase(), a.id]));

          const amenityLinks: any[] = [];
          for (const amenityName of body.amenities) {
            let amenityId = existingMap.get(amenityName.toLowerCase());
            if (!amenityId) {
              const { data: newAmenity } = await supabaseServer
                .from('amenities')
                .insert({ name: amenityName, category: 'general' })
                .select('id')
                .maybeSingle();
              if (newAmenity?.id) amenityId = newAmenity.id;
            }

            if (amenityId) {
              amenityLinks.push({ property_id: insertedPropId, amenity_id: amenityId });
            }
          }

          if (amenityLinks.length > 0) {
            await supabaseServer.from('property_amenities').upsert(amenityLinks, { onConflict: 'property_id,amenity_id' });
          }
        } catch (amenityErr) {
          console.warn('Amenity linking note:', amenityErr);
        }
      }

      return res.status(200).json({ success: true, data: { ...body, id: insertedPropId, slug: generatedSlug } });
    } catch (err: any) {
      console.error('API /api/admin/properties POST error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PATCH: Update Property Status or Featured toggle
  if (req.method === 'PATCH') {
    try {
      const { id, status, verification_notes, featured } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Property ID required' });
      }

      const updatePayload: any = { updated_at: new Date().toISOString() };

      if (status) {
        updatePayload.status = status;
        if (status === 'approved') {
          updatePayload.verified_at = new Date().toISOString();
          updatePayload.published_at = new Date().toISOString();
        }
      }

      if (verification_notes !== undefined) {
        updatePayload.verification_notes = verification_notes;
      }

      if (featured !== undefined) {
        updatePayload.featured = Boolean(featured);
      }

      let query = supabaseServer.from('properties').update(updatePayload);
      if (isUuid(id)) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }

      const { error } = await query;
      if (error) throw error;

      return res.status(200).json({ success: true, message: 'Property updated successfully' });
    } catch (err: any) {
      console.error('API /api/admin/properties PATCH error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};
