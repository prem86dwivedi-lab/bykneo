import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BACKEND_URL } from '../../context/SocketContext';
import {
  MapPin,
  Navigation,
  Bike,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Crosshair,
  ArrowUpDown,
  Search,
  Loader2,
  X,
  User,
  Percent,
  Clock,
  Edit2,
  Shield,
  Fuel,
  Activity,
  Train,
  Utensils,
  ShoppingBag,
  GraduationCap,
  Landmark,
  Compass
} from 'lucide-react';

// Real View Vehicle Icons (Compact Size Matching User Reference)
const VehicleIcon = ({ id, category }) => {
  const imageMap = {
    bike_lite: '/vehicles/bike_lite.png',
    bike: '/vehicles/bike.png',
    auto_lite: '/vehicles/auto_lite.png',
    auto: '/vehicles/auto.png',
    cab_economy: '/vehicles/cab_economy.png',
    cab_premium: '/vehicles/cab_premium.png'
  };

  const src = imageMap[id] || '/vehicles/bike.png';
  const isLite = id.includes('lite');
  const isPremium = id === 'cab_premium';

  return (
    <div className="relative w-11 h-7 flex items-center justify-center shrink-0">
      <img
        src={src}
        alt={id}
        className="max-h-6 max-w-full object-contain filter drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.6)]"
      />
      {isLite && (
        <span className="absolute -top-1 -right-1 bg-emerald-500 text-gray-950 text-[6.5px] font-black px-0.8 py-0.1 rounded-full shadow">
          %
        </span>
      )}
      {isPremium && (
        <span className="absolute -top-1 -right-1 bg-amber-400 text-gray-950 text-[7px] font-black px-0.8 py-0.1 rounded-full shadow">
          ✨
        </span>
      )}
    </div>
  );
};

const POPULAR_LOCATIONS = [
  { name: 'Connaught Place Inner Circle, Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'India Gate, Rajpath, Delhi', lat: 28.6129, lng: 77.2295 },
  { name: 'Hauz Khas Social, Delhi', lat: 28.5494, lng: 77.1932 }
];

const CITY_POPULAR_PRESETS = {
  Bhopal: [
    { name: 'Patel Nagar, Bhopal', lat: 23.2557, lng: 77.5021 },
    { name: 'Ratnagiri Tiraha / Bypass, Bhopal', lat: 23.2514, lng: 77.4245 },
    { name: 'MP Nagar Zone 1, Bhopal', lat: 23.2335, lng: 77.4326 },
    { name: 'New Market, TT Nagar, Bhopal', lat: 23.2352, lng: 77.4003 },
    { name: 'Rani Kamalapati Railway Station', lat: 23.2213, lng: 77.4384 },
    { name: 'Bhopal Junction Railway Station', lat: 23.2663, lng: 77.4125 },
    { name: 'Ayodhya Bypass Chauraha, Bhopal', lat: 23.2965, lng: 77.4359 },
    { name: 'Kolar Road, Bhopal', lat: 23.2131, lng: 77.4193 }
  ],
  Sidhi: [
    { name: 'Samrat Chowk, Sidhi', lat: 24.2120, lng: 81.7010 },
    { name: 'Old Bus Stand, Sidhi', lat: 24.2105, lng: 81.6980 },
    { name: 'Hospital Chauraha, Sidhi', lat: 24.2080, lng: 81.6950 },
    { name: 'Collectorate Road, Sidhi', lat: 24.2150, lng: 81.7050 }
  ],
  Satna: [
    { name: 'Satna Junction Railway Station', lat: 24.5800, lng: 80.8300 },
    { name: 'Panna Naka, Satna', lat: 24.5750, lng: 80.8250 },
    { name: 'Rewa Road Chauraha, Satna', lat: 24.5850, lng: 80.8400 },
    { name: 'Bus Stand, Satna', lat: 24.5780, lng: 80.8320 }
  ]
};

export const BookRideScreen = ({
  pickup,
  drop,
  setPickup,
  setDrop,
  onStartSearchMode,
  onRequestRide,
  estimatedFare,
  setEstimatedFare,
  zoneStatus = null,
  activeCity = null,
  activeCities = [],
  selectedVehicleId: externalSelectedVehicleId = null,
  setSelectedVehicleId: externalSetSelectedVehicleId = null
}) => {
  const { user } = useAuth();
  const [paymentMode, setPaymentMode] = useState('UPI'); // 'UPI' | 'CASH' | 'WALLET'
  const [internalSelectedVehicleId, setInternalSelectedVehicleId] = useState('bike');

  const selectedVehicleId = externalSelectedVehicleId || internalSelectedVehicleId;
  const setSelectedVehicleId = externalSetSelectedVehicleId || setInternalSelectedVehicleId;
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  // Manual Text Search States
  const [pickupQuery, setPickupQuery] = useState(pickup?.name || '');
  const [dropQuery, setDropQuery] = useState(drop?.name || '');
  const [activeInput, setActiveInput] = useState(null); // 'pickup' | 'drop' | null
  const [suggestions, setSuggestions] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const debounceTimerRef = useRef(null);
  const searchSeqRef = useRef(0);

  // Calculate distance in KM
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Determine current active city name & popular chips
  const currentCity = activeCity || (activeCities && activeCities[0]) || null;
  const currentCityName = currentCity?.name?.split(',')[0]?.trim() || 'Bhopal';
  const currentCityRadius = Number(currentCity?.radius_km || 40);

  const matchedCityPresetKey = Object.keys(CITY_POPULAR_PRESETS).find(
    (k) =>
      currentCity?.name?.toLowerCase().includes(k.toLowerCase()) ||
      pickup?.name?.toLowerCase().includes(k.toLowerCase())
  );
  const popularLocationsList = matchedCityPresetKey
    ? CITY_POPULAR_PRESETS[matchedCityPresetKey]
    : currentCity
    ? [{ name: `${currentCity.name} Center`, lat: Number(currentCity.lat), lng: Number(currentCity.lng) }]
    : POPULAR_LOCATIONS;

  // Sync text inputs when external pickup/drop coordinates change (e.g. from map click)
  useEffect(() => {
    if (pickup?.name) setPickupQuery(pickup.name);
  }, [pickup]);

  useEffect(() => {
    if (drop?.name) setDropQuery(drop.name);
  }, [drop]);

  // Recalculate Fare Estimate
  useEffect(() => {
    if (pickup?.lat && drop?.lat) {
      setLoadingEstimate(true);
      fetch(`${BACKEND_URL}/api/rides/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          drop_lat: drop.lat,
          drop_lng: drop.lng
        })
      })
        .then((res) => res.json())
        .then((data) => {
          setEstimatedFare(data);
          setLoadingEstimate(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingEstimate(false);
        });
    }
  }, [pickup, drop]);

// Global POI Category Map for Worldwide Locality & Sub-Area Search
const POI_CATEGORY_MAP = [
  {
    type: 'gate',
    label: 'Gate / Entrance',
    regex: /\b(gate\s*\d+|gate\s*no\s*\d+|entry\s*gate|exit\s*gate|main\s*gate|gate)\b/i
  },
  {
    type: 'zone',
    label: 'Zone / Sector',
    regex: /\b(zone\s*\d+|zone-\d+|sector\s*[a-z0-9]+|phase\s*\d+|block\s*[a-z0-9]+)\b/i
  },
  {
    type: 'police',
    label: 'Police Station',
    regex: /\b(police\s*station|police\s*thana|police\s*chowki|police\s*post|police|thana|chowki|kotwali)\b/i
  },
  {
    type: 'fuel',
    label: 'Petrol Pump / Fuel',
    regex: /\b(petrol\s*pump|gas\s*station|petrol\s*station|fuel\s*station|petrol|diesel|cng|fuel|charging\s*station|ev\s*charging)\b/i
  },
  {
    type: 'hospital',
    label: 'Hospital / Medical',
    regex: /\b(hospital|clinic|nursing\s*home|dispensary|pharmacy|chemist|medical|doctor)\b/i
  },
  {
    type: 'station',
    label: 'Station / Metro / Bus',
    regex: /\b(railway\s*station|train\s*station|metro\s*station|metro|subway|bus\s*stand|bus\s*stop|bus\s*depot|airport|terminal|isbt)\b/i
  },
  {
    type: 'junction',
    label: 'Chauraha / Square',
    regex: /\b(chauraha|tiraha|square|circle|roundabout|junction|crossing|flyover|bypass)\b/i
  },
  {
    type: 'food',
    label: 'Restaurant / Cafe',
    regex: /\b(restaurant|hotel|dhaba|cafe|bhojanalaya|food\s*court|bakery|sweets|mess|bar)\b/i
  },
  {
    type: 'mall',
    label: 'Mall / Market',
    regex: /\b(mall|bazaar|market|supermarket|mart|store|plaza|shopping\s*center)\b/i
  },
  {
    type: 'bank',
    label: 'Bank / ATM',
    regex: /\b(bank|atm|sbi|hdfc|icici|axis|pnb|branch)\b/i
  },
  {
    type: 'education',
    label: 'College / School',
    regex: /\b(college|school|university|campus|institute|vidyalaya|coaching)\b/i
  },
  {
    type: 'religious',
    label: 'Temple / Mosque / Church',
    regex: /\b(temple|mandir|masjid|mosque|church|gurudwara|ashram)\b/i
  }
];

const renderPlaceIcon = (type) => {
  switch (type) {
    case 'gate':
      return <Compass className="w-3 h-3 text-cyan-400" />;
    case 'zone':
      return <MapPin className="w-3 h-3 text-indigo-400" />;
    case 'police':
      return <Shield className="w-3 h-3 text-blue-400" />;
    case 'fuel':
      return <Fuel className="w-3 h-3 text-amber-400" />;
    case 'hospital':
    case 'medical':
      return <Activity className="w-3 h-3 text-red-400" />;
    case 'station':
    case 'metro':
    case 'bus':
      return <Train className="w-3 h-3 text-purple-400" />;
    case 'food':
    case 'restaurant':
      return <Utensils className="w-3 h-3 text-orange-400" />;
    case 'mall':
    case 'shop':
      return <ShoppingBag className="w-3 h-3 text-pink-400" />;
    case 'bank':
    case 'atm':
      return <CreditCard className="w-3 h-3 text-emerald-400" />;
    case 'education':
    case 'college':
    case 'school':
      return <GraduationCap className="w-3 h-3 text-indigo-400" />;
    case 'religious':
      return <Landmark className="w-3 h-3 text-yellow-400" />;
    case 'junction':
      return <Compass className="w-3 h-3 text-cyan-400" />;
    default:
      return <MapPin className="w-3 h-3 text-brand-yellow" />;
  }
};

// Phonetic & Common Spelling Normalizer
const SPELL_NORMALIZATION_MAP = [
  { pattern: /\bnager\b/gi, replace: 'nagar' },
  { pattern: /\b(colny|colney)\b/gi, replace: 'colony' },
  { pattern: /\b(chok|chokw|chouk)\b/gi, replace: 'chowk' },
  { pattern: /\b(chouraha|chowraha|choraaha)\b/gi, replace: 'chauraha' },
  { pattern: /\b(raod|rod)\b/gi, replace: 'road' },
  { pattern: /\bbazar\b/gi, replace: 'bazaar' },
  { pattern: /\b(marcket|markit)\b/gi, replace: 'market' },
  { pattern: /\b(staton|stesion|stn)\b/gi, replace: 'station' },
  { pattern: /\b(hosptal|hospitl|hosp)\b/gi, replace: 'hospital' },
  { pattern: /\b(colege|colg|clg)\b/gi, replace: 'college' },
  { pattern: /\b(danis|danish)\b/gi, replace: 'danish' }
];

const normalizeSpelling = (query) => {
  let q = query || '';
  for (const item of SPELL_NORMALIZATION_MAP) {
    q = q.replace(item.pattern, item.replace);
  }
  return q;
};

// Safe JSON fetch wrapper with guaranteed timeout & no throwing
const safeFetchJson = async (url, options = {}, timeoutMs = 4000) => {
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    const res = await fetch(url, {
      ...options,
      signal: controller ? controller.signal : undefined
    });
    if (timeoutId) clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
};

  // Worldwide Smart Locality & Sub-Area Compound Search Engine with Deep Fallback
  const handleSearchAddress = (query, type) => {
    if (type === 'pickup') setPickupQuery(query);
    else setDropQuery(query);

    setActiveInput(type);

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setSearchingAddress(false);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      const currentSeq = ++searchSeqRef.current;
      setSearchingAddress(true);

      const combined = [];
      const seenKeys = new Set();

      const cityName = currentCityName;
      const cityLat = Number(currentCity?.lat || pickup?.lat || 23.2599);
      const cityLng = Number(currentCity?.lng || pickup?.lng || 77.4126);
      const radiusKm = currentCityRadius;

      const addResult = (title, subtitle, fullName, lat, lng, typeTag, isSynthesized = false) => {
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;
        const distFromCity = calculateDistance(cityLat, cityLng, lat, lng);

        // Geofence check (Operational zone + 50% buffer)
        if (distFromCity > radiusKm * 1.5) return;

        const titleKey = (title || '').toLowerCase().trim();
        const coordKey = `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
        const uniqueKey = `${titleKey}@${coordKey}`;
        if (seenKeys.has(uniqueKey)) return;
        seenKeys.add(uniqueKey);

        const distFromPickup = pickup?.lat
          ? calculateDistance(pickup.lat, pickup.lng, lat, lng)
          : distFromCity;
        combined.push({
          title: title || 'Location',
          subtitle: subtitle || `${cityName} (${distFromPickup.toFixed(1)} km away)`,
          full_name: fullName || title,
          lat: Number(lat),
          lng: Number(lng),
          type: typeTag || 'locality',
          distanceKm: Number(distFromPickup.toFixed(1)),
          isSynthesized
        });
      };

      try {
        const qClean = query.trim();
        const qNormalized = normalizeSpelling(qClean);

        // 1. Detect Category & Landmark Keyword Pattern
        let detectedCategory = null;
        let localityCandidate = qNormalized;
        let landmarkCandidate = '';

        for (const cat of POI_CATEGORY_MAP) {
          const match = qNormalized.match(cat.regex);
          if (match) {
            detectedCategory = cat;
            landmarkCandidate = match[0];
            localityCandidate = qNormalized.replace(cat.regex, ' ').replace(/\s+/g, ' ').trim();
            break;
          }
        }

        // Multi-query variation set (e.g. "bhel gate", "bhel gate Bhopal", "bhel Bhopal", "bhel")
        const queriesToRun = new Set();
        queriesToRun.add(qClean);
        queriesToRun.add(qNormalized);
        queriesToRun.add(`${qNormalized} ${cityName}`);
        if (localityCandidate && localityCandidate.length >= 2) {
          queriesToRun.add(localityCandidate);
          queriesToRun.add(`${localityCandidate} ${cityName}`);
        }

        // First token fallback for multi-word queries (e.g. "bhel" from "bhel gate")
        const words = qClean.split(/\s+/).filter(Boolean);
        if (words.length > 1 && words[0].length >= 3) {
          queriesToRun.add(words[0]);
          queriesToRun.add(`${words[0]} ${cityName}`);
        }

        const promises = [];

        // 2. Multi-variant Photon Proximity Queries
        for (const q of queriesToRun) {
          promises.push(
            safeFetchJson(
              `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${cityLat}&lon=${cityLng}&limit=12`
            ).then((data) => {
              if (data && data.features) {
                data.features.forEach((f) => {
                  const p = f.properties;
                  const [lng, lat] = f.geometry.coordinates;
                  const sub = [p.district || p.city, p.state].filter(Boolean).join(', ');

                  // Synthesize High-Confidence Specific Landmark Entry
                  if (
                    detectedCategory &&
                    localityCandidate &&
                    p.name &&
                    p.name.toLowerCase().includes(localityCandidate.toLowerCase())
                  ) {
                    const formattedPoiTitle = `${p.name} (${landmarkCandidate ? landmarkCandidate.toUpperCase() : detectedCategory.label})`;
                    addResult(
                      formattedPoiTitle,
                      `Near ${landmarkCandidate || detectedCategory.label} • ${sub || cityName}`,
                      `${p.name}, ${landmarkCandidate}, ${sub || cityName}`,
                      lat,
                      lng,
                      detectedCategory.type,
                      true
                    );
                  }

                  addResult(
                    p.name,
                    sub || cityName,
                    p.name + (sub ? ', ' + sub : ''),
                    lat,
                    lng,
                    p.osm_value || 'locality'
                  );
                });
              }
            })
          );
        }

        // 3. Broad Amenity Discovery for Generic Queries (e.g. "petrol pump", "hospital", "atm")
        if (detectedCategory && localityCandidate.length < 2) {
          const catKeywords = {
            fuel: ['petrol pump', 'Indian Oil', 'Bharat Petroleum', 'HP Petrol', 'fuel'],
            hospital: ['hospital', 'clinic', 'medical', 'care hospital'],
            bank: ['atm', 'bank', 'SBI ATM', 'HDFC Bank', 'ICICI Bank'],
            station: ['railway station', 'metro station', 'bus stand', 'isbt']
          };

          const kws = catKeywords[detectedCategory.type] || [detectedCategory.label];
          kws.forEach((kw) => {
            promises.push(
              safeFetchJson(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(kw)}&lat=${cityLat}&lon=${cityLng}&limit=12`
              ).then((data) => {
                if (data && data.features) {
                  data.features.forEach((f) => {
                    const p = f.properties;
                    const [lng, lat] = f.geometry.coordinates;
                    addResult(
                      p.name,
                      [p.district || p.city, p.state].filter(Boolean).join(', '),
                      p.name,
                      lat,
                      lng,
                      detectedCategory.type
                    );
                  });
                }
              })
            );
          });
        }

        // 4. OpenStreetMap Nominatim with Proximity Bounding Box
        const minLon = cityLng - 0.45;
        const maxLon = cityLng + 0.45;
        const minLat = cityLat - 0.45;
        const maxLat = cityLat + 0.45;
        const nomQueries = [qNormalized, localityCandidate].filter(Boolean);

        for (const nq of nomQueries) {
          promises.push(
            safeFetchJson(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                `${nq} ${cityName}`
              )}&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=1&limit=8`
            ).then((data) => {
              if (Array.isArray(data)) {
                data.forEach((item) => {
                  const parts = item.display_name.split(',');
                  const mainName = parts[0]?.trim();
                  const subName = parts.slice(1, 3).join(', ').trim();

                  if (
                    detectedCategory &&
                    localityCandidate &&
                    mainName &&
                    mainName.toLowerCase().includes(localityCandidate.toLowerCase())
                  ) {
                    const formattedPoiTitle = `${mainName} (${landmarkCandidate ? landmarkCandidate.toUpperCase() : detectedCategory.label})`;
                    addResult(
                      formattedPoiTitle,
                      `Near ${landmarkCandidate || detectedCategory.label} • ${subName}`,
                      item.display_name,
                      Number(item.lat),
                      Number(item.lon),
                      detectedCategory.type,
                      true
                    );
                  }

                  addResult(
                    mainName,
                    subName,
                    item.display_name,
                    Number(item.lat),
                    Number(item.lon),
                    item.type || 'locality'
                  );
                });
              }
            })
          );
        }

        await Promise.allSettled(promises);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (currentSeq === searchSeqRef.current) {
          // Smart Lexical & Proximity Sorting:
          const locLower = (normalizeSpelling(query) || '').toLowerCase().trim();
          const qCleanLower = query.toLowerCase().trim();

          combined.sort((a, b) => {
            // 1. Synthesized / Category matched high relevance
            if (a.isSynthesized && !b.isSynthesized) return -1;
            if (!a.isSynthesized && b.isSynthesized) return 1;

            const aTitle = (a.title || '').toLowerCase();
            const aSub = (a.subtitle || '').toLowerCase();
            const bTitle = (b.title || '').toLowerCase();
            const bSub = (b.subtitle || '').toLowerCase();

            // 2. Direct query match
            const aFullMatch = aTitle.includes(qCleanLower) || aTitle.includes(locLower);
            const bFullMatch = bTitle.includes(qCleanLower) || bTitle.includes(locLower);
            if (aFullMatch && !bFullMatch) return -1;
            if (!aFullMatch && bFullMatch) return 1;

            // 3. Subtitle / Area match
            const aSubMatch = aSub.includes(locLower);
            const bSubMatch = bSub.includes(locLower);
            if (aSubMatch && !bSubMatch) return -1;
            if (!aSubMatch && bSubMatch) return 1;

            // 4. Proximity distance sort
            return a.distanceKm - b.distanceKm;
          });

          setSuggestions(combined);
          setSearchingAddress(false);
        }
      }
    }, 250);
  };

  const handleSelectSuggestion = (item, type) => {
    const loc = {
      name: `${item.title}${item.subtitle ? ', ' + item.subtitle.split(',')[0] : ''}`,
      lat: Number(item.lat),
      lng: Number(item.lng)
    };

    if (type === 'pickup') {
      setPickup(loc);
      setPickupQuery(loc.name);
    } else {
      setDrop(loc);
      setDropQuery(loc.name);
    }
    setSuggestions([]);
    setActiveInput(null);
  };

  // Auto detect current GPS with instant non-blocking reverse geocoding
  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      // Step 1: Fast cached / network fix immediately (< 100ms)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          setPickup({ name: 'Current GPS Location', lat, lng });
          setPickupQuery('Current GPS Location');
          setSuggestions([]);
          setActiveInput(null);

          // Background reverse geocoding
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en,hi' }, signal: AbortSignal.timeout(3000) }
          )
            .then((res) => res.json())
            .then((data) => {
              if (data && data.display_name) {
                const locName = data.display_name.split(',').slice(0, 3).join(', ');
                setPickup((prev) => ({ ...prev, name: locName, lat, lng }));
                setPickupQuery(locName);
              }
            })
            .catch(() => {});
        },
        null,
        { enableHighAccuracy: false, timeout: 2500, maximumAge: 60000 }
      );

      // Step 2: High precision GPS fix
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          setPickup((prev) => ({ ...prev, lat, lng }));

          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en,hi' }, signal: AbortSignal.timeout(3000) }
          )
            .then((res) => res.json())
            .then((data) => {
              if (data && data.display_name) {
                const locName = data.display_name.split(',').slice(0, 3).join(', ');
                setPickup({ name: locName, lat, lng });
                setPickupQuery(locName);
              }
            })
            .catch(() => {});
        },
        (err) => {
          console.warn('GPS location error:', err);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  };

  // Swap pickup & drop
  const handleSwap = () => {
    const temp = pickup;
    setPickup(drop);
    setDrop(temp);
  };

  const allVehiclesList = estimatedFare?.vehicles || [
    {
      id: 'bike',
      category: 'BIKE',
      name: 'Bykneo Bike',
      tagline: 'Fastest solo ride through traffic',
      capacity: 1,
      eta_mins: 2,
      drop_time: `Drop in ~${estimatedFare?.duration_mins || 5} mins`,
      fare: estimatedFare?.fare || 25,
      original_fare: Math.round((estimatedFare?.fare || 25) * 1.2),
      badge: 'FASTEST'
    }
  ];

  const vehiclesToDisplay = showAllVehicles ? allVehiclesList : allVehiclesList.slice(0, 3);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 px-2 sm:px-3 pb-2 sm:pb-3 pb-[env(safe-area-inset-bottom,12px)] pointer-events-none">
      <div className="max-w-md mx-auto bg-gray-900/98 backdrop-blur-2xl border border-gray-800 rounded-2xl p-3 shadow-2xl pointer-events-auto space-y-2 max-h-[50vh] sm:max-h-[52vh] flex flex-col justify-between overflow-hidden">
        {/* Mobile Top Drag Handle Bar */}
        <div className="w-8 h-1 bg-gray-700 rounded-full mx-auto shrink-0 opacity-70"></div>

        {/* Compact 2-Line Route Summary Bar when route is active & not editing */}
        {estimatedFare && pickup?.name && drop?.name && !isEditingAddress && !activeInput ? (
          <div className="bg-gray-850/90 px-3 py-1.5 rounded-xl border border-gray-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10.5px] truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                <span className="text-gray-300 font-medium truncate">{pickup.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                <span className="text-white font-bold truncate">{drop.name}</span>
              </div>
            </div>
            <button
              onClick={() => setIsEditingAddress(true)}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-750 text-brand-yellow shrink-0 flex items-center gap-1 text-[10px] font-bold transition active:scale-95"
              title="Change Route"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>
        ) : (
          /* Full Pickup & Destination Input Form */
          <div className="bg-gray-850 p-2.5 rounded-2xl border border-gray-800 space-y-2 relative shrink-0">
            {/* Pickup Input */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              </div>
              <div className="flex-1 relative">
                <span className="text-[9px] uppercase font-bold text-emerald-400 block leading-none mb-0.5">
                  Pickup Point
                </span>
                <input
                  type="text"
                  value={pickupQuery}
                  onChange={(e) => handleSearchAddress(e.target.value, 'pickup')}
                  onFocus={() => setActiveInput('pickup')}
                  placeholder="Search pickup area, metro, street..."
                  className="w-full bg-transparent text-[11px] font-semibold text-white placeholder-gray-500 focus:outline-none focus:text-emerald-300 transition"
                />
              </div>

              {/* Quick Locate Me Icon */}
              <button
                onClick={handleUseCurrentLocation}
                className="p-1 rounded-lg bg-gray-800 hover:bg-gray-750 text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition active:scale-95"
                title="Use Current Device GPS"
              >
                <Crosshair className="w-3 h-3" />
                <span className="text-[9px] hidden sm:inline">GPS</span>
              </button>
            </div>

            {/* Divider with Swap Button */}
            <div className="relative flex items-center justify-center">
              <div className="h-[1px] bg-gray-800 w-full ml-7 mr-7"></div>
              <button
                onClick={handleSwap}
                className="absolute right-1 p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-brand-yellow transition"
                title="Swap Pickup and Drop"
              >
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>

            {/* Drop Input */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center shrink-0">
                <MapPin className="w-3 h-3 text-red-400" />
              </div>
              <div className="flex-1">
                <span className="text-[9px] uppercase font-bold text-red-400 block leading-none mb-0.5">
                  Drop Destination
                </span>
                <input
                  type="text"
                  value={dropQuery}
                  onChange={(e) => handleSearchAddress(e.target.value, 'drop')}
                  onFocus={() => setActiveInput('drop')}
                  placeholder="Search destination, mall, office, city..."
                  className="w-full bg-transparent text-[11px] font-semibold text-white placeholder-gray-500 focus:outline-none focus:text-red-300 transition"
                />
              </div>

              {pickup?.name && drop?.name && isEditingAddress && (
                <button
                  onClick={() => setIsEditingAddress(false)}
                  className="text-[10px] font-bold text-gray-400 hover:text-white px-1.5 py-0.5 rounded bg-gray-800"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}

        {/* Live Address Search Autocomplete Dropdown */}
        {activeInput && (
          <div className="bg-gray-850 border border-brand-yellow/40 rounded-2xl p-2 max-h-48 overflow-y-auto space-y-1 shadow-2xl animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between px-2 py-1 text-[9.5px] font-bold text-brand-yellow uppercase tracking-wider border-b border-gray-800 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>
                  {currentCityName} ({suggestions.length} places)
                </span>
              </div>
              <button
                onClick={() => {
                  setSuggestions([]);
                  setActiveInput(null);
                }}
                className="text-gray-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {searchingAddress && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-yellow" />
                <span className="text-[10px]">Searching {currentCityName}...</span>
              </div>
            )}

            {!searchingAddress && suggestions.length === 0 && (
              <div className="py-2.5 text-center text-[10px] text-gray-400 px-2 leading-relaxed">
                No places found in {currentCityName}. Please check spelling or enter a nearby landmark.
              </div>
            )}

            {!searchingAddress &&
              suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleSelectSuggestion(item, activeInput);
                    setIsEditingAddress(false);
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-gray-800 text-[11px] text-gray-200 hover:text-white flex items-start gap-2 transition group border border-transparent hover:border-brand-yellow/30"
                >
                  <div className="p-1 rounded-lg bg-gray-800 group-hover:bg-brand-yellow/20 text-brand-yellow shrink-0 mt-0.5 transition">
                    {renderPlaceIcon(item.type)}
                  </div>
                  <div className="truncate flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-white truncate text-[11px]">{item.title}</span>
                      <span className="text-[9px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1 py-0.2 rounded font-bold shrink-0">
                        {item.distanceKm ? `${item.distanceKm} km` : 'Local'}
                      </span>
                    </div>
                    {item.subtitle && (
                      <div className="text-[9px] text-gray-400 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              ))}
          </div>
        )}

        {/* Quick Popular Location Chips */}
        {!activeInput && !estimatedFare && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none shrink-0">
            {popularLocationsList.map((loc, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (!pickup) setPickup(loc);
                  else setDrop(loc);
                }}
                className="shrink-0 bg-gray-850 hover:bg-gray-800 border border-gray-700/60 px-2.5 py-1 rounded-xl text-[10px] font-medium text-gray-300 hover:text-white transition flex items-center gap-1"
              >
                <Zap className="w-2.5 h-2.5 text-brand-yellow" />
                {loc.name.split(',')[0]}
              </button>
            ))}
          </div>
        )}

        {/* Geofence Out-of-Service Alert */}
        {((estimatedFare && estimatedFare.is_serviceable === false) || (zoneStatus && zoneStatus.isServiceable === false) || !activeCities?.length) && (
          <div className="bg-red-500/15 border border-red-500/30 p-2.5 rounded-xl space-y-1 animate-in fade-in-50 shrink-0">
            <div className="flex items-center gap-1.5 text-red-400 font-bold text-[11px]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Bykneo is launching soon in this area!</span>
            </div>
            <p className="text-[10px] text-gray-300">
              Our fleet is currently offline or not operating in this zone. Driver availability is turned OFF.
            </p>
            {activeCities && activeCities.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                <span className="text-[9px] text-gray-400 font-medium">Active Zones:</span>
                {activeCities.map((c, i) => (
                  <span key={i} className="text-[9px] bg-gray-800 text-brand-yellow px-1.5 py-0.2 rounded font-bold">
                    📍 {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rapido-Style Half-Screen Multi-Vehicle Selector (Only visible when zone is Active & Serviceable) */}
        {zoneStatus?.isServiceable !== false && activeCities?.length > 0 && estimatedFare && estimatedFare.is_serviceable !== false && Array.isArray(estimatedFare.vehicles) && estimatedFare.vehicles.length > 0 && (
          <div className="space-y-1.5 flex-1 min-h-0 overflow-hidden flex flex-col justify-between">
            {/* Serving Zone Tag & Stats */}
            <div className="flex items-center justify-between px-1 text-[10px] shrink-0">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {estimatedFare.matched_city ? `Serving ${estimatedFare.matched_city}` : 'Available Rides'}
              </span>
              <span className="text-gray-400 font-semibold">
                {estimatedFare.distance_km} km • ~{estimatedFare.duration_mins} mins
              </span>
            </div>

            {/* Vehicle Cards Scrollable List */}
            <div className={`space-y-1.5 overflow-y-auto pr-0.5 scrollbar-thin ${showAllVehicles ? 'max-h-[175px]' : 'max-h-[145px]'}`}>
              {vehiclesToDisplay.map((v) => {
                const isSelected = selectedVehicleId === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`w-full text-left p-2 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-brand-yellow/15 border-brand-yellow shadow-md shadow-brand-yellow/10'
                        : 'bg-gray-850/70 border-gray-800/80 hover:border-gray-700 hover:bg-gray-800/80'
                    }`}
                  >
                    {/* Left: Compact Vehicle Vector Render */}
                    <VehicleIcon id={v.id} category={v.category} />

                    {/* Middle: Name, Tagline & ETA */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold text-white truncate">{v.name}</span>
                        {v.badge && (
                          <span
                            className={`text-[7.5px] font-black px-1 py-0.1 rounded ${
                              v.badge === 'FASTEST'
                                ? 'bg-brand-yellow text-gray-950'
                                : v.badge === 'POPULAR'
                                ? 'bg-purple-500 text-white'
                                : v.badge === 'AC CAB'
                                ? 'bg-blue-500 text-white'
                                : v.badge === 'PREMIUM'
                                ? 'bg-amber-400 text-gray-950'
                                : 'bg-emerald-500 text-gray-950'
                            }`}
                          >
                            {v.badge}
                          </span>
                        )}
                        {v.discount_percent && (
                          <span className="text-[7.5px] font-bold bg-emerald-500/20 text-emerald-400 px-1 py-0.1 rounded">
                            {v.discount_percent}
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-gray-400 truncate leading-tight mt-0.5">{v.tagline}</div>
                      <div className="text-[8.5px] text-gray-300 flex items-center gap-1 mt-0.5">
                        <span className="font-semibold text-brand-yellow">
                          {v.eta_mins}m away
                        </span>
                        <span className="text-gray-600">•</span>
                        <span>{v.drop_time}</span>
                        <span className="text-gray-600">•</span>
                        <span className="flex items-center gap-0.5 text-gray-400">
                          <User className="w-2 h-2" />
                          {v.capacity}
                        </span>
                      </div>
                    </div>

                    {/* Right: Price */}
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-brand-yellow">
                        ₹{v.fare}
                      </div>
                      {v.original_fare && (
                        <div className="text-[9px] text-gray-400 line-through leading-none">
                          ₹{v.original_fare}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View More / View Less Toggle Button */}
            {allVehiclesList.length > 3 && (
              <button
                onClick={() => setShowAllVehicles(!showAllVehicles)}
                className="w-full py-0.5 text-center text-[10px] font-bold text-gray-400 hover:text-brand-yellow flex items-center justify-center gap-1 transition shrink-0"
              >
                <span>
                  {showAllVehicles
                    ? 'Show Fewer Options'
                    : `View More (${allVehiclesList.length - 3} Cabs & Autos)`}
                </span>
                {showAllVehicles ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {/* Bottom Payment & Offers Bar */}
            <div className="bg-gray-850/80 px-2.5 py-1.5 rounded-xl border border-gray-800 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 text-[10px] font-medium">Payment:</span>
                <div className="flex items-center gap-1">
                  {['UPI', 'CASH', 'WALLET'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMode(m)}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition ${
                        paymentMode === m
                          ? 'bg-brand-yellow text-gray-950'
                          : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                <Percent className="w-2.5 h-2.5" />
                <span>Offer Applied</span>
              </div>
            </div>
          </div>
        )}

        {/* Book Button */}
        <button
          onClick={() => {
            const chosen = (estimatedFare?.vehicles || []).find((v) => v.id === selectedVehicleId) ||
              estimatedFare?.vehicles?.[0] || {
                id: 'bike',
                name: 'Bykneo Bike',
                category: 'BIKE',
                fare: estimatedFare?.fare
              };
            onRequestRide(paymentMode, chosen);
          }}
          disabled={!pickup || !drop || loadingEstimate || zoneStatus?.isServiceable === false || estimatedFare?.is_serviceable === false || !activeCities?.length || !estimatedFare?.vehicles?.length}
          className="w-full bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-brand-yellow/15 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Zap className="w-4 h-4 fill-current" />
          {loadingEstimate
            ? 'Calculating Route & Fares...'
            : (zoneStatus?.isServiceable === false || estimatedFare?.is_serviceable === false || !activeCities?.length)
            ? 'Service Unavailable in this Area (No Drivers)'
            : !pickup
            ? 'Enter Pickup Location'
            : !drop
            ? 'Enter Drop Destination'
            : `Book ${
                (estimatedFare?.vehicles || []).find((v) => v.id === selectedVehicleId)?.name ||
                'Bykneo Ride'
              } (₹${
                (estimatedFare?.vehicles || []).find((v) => v.id === selectedVehicleId)?.fare ||
                estimatedFare?.fare ||
                '--'
              })`}
        </button>
      </div>
    </div>
  );
};
