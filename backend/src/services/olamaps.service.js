import fetch from 'node-fetch';

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Obtain and cache Ola Maps OAuth Access Token
 */
async function getAccessToken() {
  const clientId = process.env.OLA_MAPS_CLIENT_ID;
  const clientSecret = process.env.OLA_MAPS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'openid');

    const response = await fetch('https://api.olamaps.io/auth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      timeout: 8000
    });

    if (!response.ok) {
      console.warn(`[OlaMaps] Token fetch failed with HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.access_token) {
      cachedToken = data.access_token;
      const expiresInSec = data.expires_in || 3600;
      tokenExpiresAt = now + expiresInSec * 1000;
      return cachedToken;
    }
  } catch (err) {
    console.error('[OlaMaps] Error fetching access token:', err.message);
  }
  return null;
}

/**
 * Places Autocomplete with live location biasing
 */
export async function searchPlaces({ input, location, radius = 50000 }) {
  if (!input || !input.trim()) return [];

  const token = await getAccessToken();
  const reqId = `riderxo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  if (token) {
    try {
      let url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(input.trim())}`;
      if (location) {
        url += `&location=${location}&radius=${radius}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Request-Id': reqId
        },
        timeout: 6000
      });

      if (response.ok) {
        const data = await response.json();
        if (data.predictions && Array.isArray(data.predictions) && data.predictions.length > 0) {
          return data.predictions.map((p) => {
            const sf = p.structured_formatting || {};
            return {
              id: p.place_id || p.reference || `ola-${Math.random()}`,
              name: sf.main_text || p.description?.split(',')[0]?.trim() || input,
              secondary_name: sf.secondary_text || p.description?.split(',').slice(1, 3).join(', ')?.trim() || '',
              full_address: p.description || '',
              lat: p.geometry?.location?.lat || null,
              lng: p.geometry?.location?.lng || null,
              types: p.types || [],
              source: 'olamaps'
            };
          });
        }
      }
    } catch (err) {
      console.warn('[OlaMaps] Autocomplete query failed, falling back to Nominatim:', err.message);
    }
  }

  // Fallback to OpenStreetMap Nominatim
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      input.trim()
    )}&limit=10&addressdetails=1`;
    const nomRes = await fetch(nomUrl, {
      headers: { 'User-Agent': 'RiderXO-Mobility-Platform/2.0' },
      timeout: 6000
    });
    if (nomRes.ok) {
      const data = await nomRes.json();
      if (Array.isArray(data)) {
        return data.map((item) => {
          const parts = item.display_name.split(',');
          return {
            id: `nom-${item.place_id}`,
            name: parts[0]?.trim() || input,
            secondary_name: parts.slice(1, 3).join(', ')?.trim() || '',
            full_address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            types: [item.type || 'locality'],
            source: 'osm'
          };
        });
      }
    }
  } catch (nomErr) {
    console.error('[Nominatim Fallback] Failed:', nomErr.message);
  }

  return [];
}

/**
 * Reverse Geocode (Coordinates -> Human-readable Address)
 */
export async function reverseGeocode({ lat, lng }) {
  if (!lat || !lng) return null;

  const token = await getAccessToken();
  const reqId = `riderxo-rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  if (token) {
    try {
      const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Request-Id': reqId
        },
        timeout: 6000
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const first = data.results[0];
          return {
            formatted_address: first.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            name: first.name || first.formatted_address?.split(',')[0]?.trim(),
            address_components: first.address_components || [],
            source: 'olamaps'
          };
        }
      }
    } catch (err) {
      console.warn('[OlaMaps] Reverse geocode failed, falling back:', err.message);
    }
  }

  // Fallback to Nominatim
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const nomRes = await fetch(nomUrl, {
      headers: { 'User-Agent': 'RiderXO-Mobility-Platform/2.0' },
      timeout: 6000
    });
    if (nomRes.ok) {
      const data = await nomRes.json();
      return {
        formatted_address: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        name: data.name || data.display_name?.split(',')[0]?.trim(),
        address_components: data.address || {},
        source: 'osm'
      };
    }
  } catch (nomErr) {
    console.error('[Nominatim Reverse Fallback] Failed:', nomErr.message);
  }

  return {
    formatted_address: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    source: 'coords'
  };
}
