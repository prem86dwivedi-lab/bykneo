import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BACKEND_URL } from '../../context/SocketContext';
import { getInstantFareEstimate } from '../../utils/instantFareCalculator';
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
    <div className="relative w-8 h-5 flex items-center justify-center shrink-0">
      <img
        src={src}
        alt={id}
        className="max-h-5 max-w-full object-contain filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
      />
      {isLite && (
        <span className="absolute -top-1 -right-1 bg-emerald-500 text-gray-950 text-[5.5px] font-black px-0.5 rounded-full shadow">
          %
        </span>
      )}
      {isPremium && (
        <span className="absolute -top-1 -right-1 bg-amber-400 text-gray-950 text-[6px] font-black px-0.5 rounded-full shadow">
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

  // Recalculate Fare Estimate Instantly (0ms local calculation + background sync)
  useEffect(() => {

    if (pickup?.lat && drop?.lat) {
      // 1. Instantly generate and display all vehicle options (0ms)
      const instant = getInstantFareEstimate(pickup, drop, true);
      if (instant) {
        setEstimatedFare(instant);
      }

      // 2. Silently sync with backend in background without blocking UI (zero-cache timestamped)
      fetch(`${BACKEND_URL}/api/rides/estimate?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
        body: JSON.stringify({
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          drop_lat: drop.lat,
          drop_lng: drop.lng
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setEstimatedFare(data);
          }
        })
        .catch((err) => {
          console.warn('Backend fare sync fallback to instant local estimate:', err);
        });
    }
  }, [pickup?.lat, pickup?.lng, drop?.lat, drop?.lng, zoneStatus?.isServiceable, activeCities]);

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
      const presets = popularLocationsList.map((loc) => ({
        title: loc.name.split(',')[0],
        subtitle: loc.name.split(',').slice(1).join(', ') || `${currentCityName}, MP`,
        fullName: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        type: 'popular',
        distanceKm: pickup?.lat ? Number(calculateDistance(pickup.lat, pickup.lng, loc.lat, loc.lng).toFixed(1)) : null
      }));
      setSuggestions(presets);
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

      const addResult = (title, subtitle, fullName, lat, lng, typeTag, isHighPriority = false) => {
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

        const titleKey = (title || '').toLowerCase().trim();
        const coordKey = `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
        const uniqueKey = `${titleKey}@${coordKey}`;
        if (seenKeys.has(uniqueKey)) return;
        seenKeys.add(uniqueKey);

        const userRefLat = pickup?.lat || cityLat;
        const userRefLng = pickup?.lng || cityLng;
        const distKm = calculateDistance(userRefLat, userRefLng, Number(lat), Number(lng));

        combined.push({
          title: title || 'Location',
          subtitle: subtitle || `${distKm.toFixed(1)} km away`,
          full_name: fullName || title,
          lat: Number(lat),
          lng: Number(lng),
          type: typeTag || 'locality',
          distanceKm: Number(distKm.toFixed(1)),
          isSynthesized: isHighPriority
        });
      };

      try {
        const qClean = query.trim();
        const qNormalized = normalizeSpelling(qClean);

        const promises = [];

        // 0. Primary: Ola Maps Real-time Autocomplete (India POIs, Temples, Localities, Railway Stations)
        promises.push(
          safeFetchJson(
            `${BACKEND_URL}/api/maps/autocomplete?input=${encodeURIComponent(qClean)}&lat=${cityLat}&lng=${cityLng}&radius=${radiusKm * 1000}`
          ).then((data) => {
            if (data && data.predictions && Array.isArray(data.predictions)) {
              data.predictions.forEach((p) => {
                addResult(
                  p.name,
                  p.secondary_name || p.full_address,
                  p.full_address,
                  p.lat,
                  p.lng,
                  p.types?.[0] || 'place',
                  true
                );
              });
            }
          })
        );

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

        // First token fallback for multi-word queries
        const words = qClean.split(/\s+/).filter(Boolean);
        if (words.length > 1 && words[0].length >= 3) {
          queriesToRun.add(words[0]);
          queriesToRun.add(`${words[0]} ${cityName}`);
        }

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

  // Swap / Reverse pickup & drop locations
  const handleSwap = () => {
    const tempPickup = pickup;
    const tempPickupQuery = pickupQuery;
    setPickup(drop);
    setPickupQuery(dropQuery || drop?.name || '');
    setDrop(tempPickup);
    setDropQuery(tempPickupQuery || tempPickup?.name || '');
  };

  const allVehiclesList = estimatedFare?.vehicles || [
    {
      id: 'bike',
      category: 'BIKE',
      name: 'RiderXO Bike',
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
      <div className="max-w-md mx-auto bg-gradient-to-b from-[#FFFDF7] via-[#FFFBEB] to-[#FEF9E7] border-2 border-amber-400 rounded-2xl p-3 shadow-[0_-4px_25px_rgba(245,158,11,0.22),0_4px_15px_rgba(0,0,0,0.08)] pointer-events-auto space-y-2.5 max-h-[52vh] flex flex-col justify-between overflow-hidden">
        {/* Mobile Top Header with Drag Handle & Close/Cancel Button */}
        <div className="relative flex items-center justify-center shrink-0 min-h-[18px]">
          <div className="w-10 h-1.5 bg-amber-400 rounded-full"></div>
          {(drop || dropQuery || estimatedFare || isEditingAddress || activeInput) && (
            <button
              type="button"
              onClick={() => {
                setDrop(null);
                setDropQuery('');
                setEstimatedFare(null);
                setIsEditingAddress(false);
                setActiveInput(null);
                setSuggestions([]);
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 px-2.5 rounded bg-amber-200 hover:bg-amber-300 text-gray-950 border border-amber-400 transition active:scale-90 flex items-center gap-1 shadow-sm cursor-pointer"
              title="Close & Go to Main Screen"
            >
              <span className="text-[10px] font-black text-gray-950">Close</span>
              <X className="w-3.5 h-3.5 text-red-600 font-bold" />
            </button>
          )}
        </div>

        {/* 1. ROUTE SUMMARY (When Destination is Chosen & Fare Estimated) */}
        {estimatedFare && pickup?.name && drop?.name && !isEditingAddress && !activeInput ? (
          <div className="bg-white px-3 py-2 rounded-xl border-2 border-amber-400 flex items-center justify-between gap-2 shrink-0 shadow-sm">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-[11px] truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 shadow-sm shadow-emerald-500/50"></span>
                <span className="text-gray-800 font-bold truncate">{pickup.name}</span>
              </div>
              <div className="flex items-center gap-2 text-[11.5px] truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 shadow-sm shadow-red-500/50"></span>
                <span className="text-black font-black truncate">{drop.name}</span>
              </div>
            </div>
            <button
              onClick={() => setIsEditingAddress(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-gray-950 shrink-0 flex items-center gap-1 text-[11px] font-black transition active:scale-95 border border-amber-500 cursor-pointer shadow-sm"
              title="Change Route"
            >
              <Edit2 className="w-3.5 h-3.5 text-gray-950" />
              <span>Edit</span>
            </button>
          </div>
        ) : (
          /* 2. RAPIDO-STYLE EDITABLE PICKUP + DROP CARD WITH SWAP/REVERSE BUTTON */
          <div className="bg-amber-100/60 p-2.5 rounded-2xl border border-amber-300 space-y-2 relative shrink-0 shadow-sm">
            {/* Pickup Point Input */}
            <div className="flex items-center gap-2 bg-white px-2.5 py-2 rounded-xl border-2 border-emerald-600 focus-within:border-emerald-700 shadow-sm transition">
              <div className="w-6 h-6 rounded-full bg-emerald-600 border border-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[9.5px] uppercase font-black text-emerald-900 leading-none tracking-wider flex-1">
                    Pickup Location
                  </span>
                  {/* Pick from Map — compact, slight-rounded corners */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onStartSearchMode) onStartSearchMode('pickup');
                      setActiveInput(null);
                      setSuggestions([]);
                    }}
                    className="inline-flex items-center gap-0.5 text-[8px] font-black text-emerald-900 hover:text-emerald-950 transition active:scale-95 py-[2px] px-2 rounded bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 cursor-pointer shrink-0"
                  >
                    <MapPin className="w-2 h-2 text-emerald-700" />
                    <span>Pick from map</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={pickupQuery}
                  onChange={(e) => handleSearchAddress(e.target.value, 'pickup')}
                  onFocus={() => handleSearchAddress(pickupQuery, 'pickup')}
                  placeholder="Enter pickup location (default: GPS)"
                  className="w-full bg-transparent text-[12px] font-black text-black placeholder-gray-500 focus:outline-none focus:text-black transition"
                />
              </div>

              {pickupQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setPickupQuery('');
                    setPickup(null);
                  }}
                  className="p-1 text-gray-500 hover:text-black rounded-md shrink-0"
                  title="Clear Pickup"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Divider with Reverse / Swap Button */}
            <div className="relative flex items-center justify-center py-0.5">
              <div className="h-[1.5px] bg-amber-300 w-full ml-8 mr-14"></div>
              <button
                type="button"
                onClick={handleSwap}
                className="absolute right-2 py-[2px] px-2 rounded bg-amber-400 hover:bg-amber-500 text-gray-950 transition active:scale-90 border border-amber-500 inline-flex items-center gap-0.5 shadow-sm cursor-pointer"
                title="Swap / Reverse Pickup & Drop"
              >
                <ArrowUpDown className="w-2 h-2 text-gray-950" />
                <span className="text-[8px] font-black text-gray-950">Swap</span>
              </button>
            </div>

            {/* Destination Search Input: Rapido-style 'Enter drop destination' */}
            <div className="flex items-center gap-2 bg-white px-2.5 py-2 rounded-xl border-2 border-amber-500 focus-within:border-amber-600 shadow-sm transition">
              <div className="w-6 h-6 rounded-full bg-red-600 border border-red-700 flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[9.5px] uppercase font-black text-amber-950 block leading-none tracking-wider">
                    Drop Destination
                  </span>
                  {/* Pick from Map Option for Drop */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onStartSearchMode) onStartSearchMode('drop');
                      setActiveInput(null);
                      setSuggestions([]);
                    }}
                    className="inline-flex items-center gap-1 text-[9px] font-black text-amber-950 hover:text-black transition active:scale-95 py-0.5 px-1.5 rounded bg-amber-200 hover:bg-amber-300 border border-amber-400 cursor-pointer shrink-0"
                  >
                    <MapPin className="w-2.5 h-2.5 text-amber-800" />
                    <span>Pick from map</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={dropQuery}
                  onChange={(e) => handleSearchAddress(e.target.value, 'drop')}
                  onFocus={() => handleSearchAddress(dropQuery, 'drop')}
                  placeholder="Enter drop destination"
                  className="w-full bg-transparent text-[12px] font-black text-black placeholder-gray-500 focus:outline-none focus:text-black transition"
                />
              </div>

              {dropQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setDropQuery('');
                    setDrop(null);
                    setEstimatedFare(null);
                  }}
                  className="p-1 text-gray-500 hover:text-black rounded-md shrink-0"
                  title="Clear Destination"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* If user is editing addresses in detailed mode */}
            {isEditingAddress && (
              <div className="flex items-center justify-between pt-1 border-t border-amber-300 text-[10.5px]">
                <span className="text-gray-800 font-bold">Search and pick any landmark or locality</span>
                <button
                  onClick={() => setIsEditingAddress(false)}
                  className="px-3 py-1 rounded bg-amber-400 hover:bg-amber-500 text-gray-950 font-black border border-amber-500"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live Address Search Autocomplete Dropdown */}
        {activeInput && (
          <div className="bg-white border-2 border-amber-400 rounded-2xl p-2 max-h-56 overflow-y-auto space-y-1 shadow-xl animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-black text-amber-950 uppercase tracking-wider border-b border-amber-200 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>
                  {suggestions.length > 0 && suggestions[0]?.type === 'popular'
                    ? `⭐ Popular in ${currentCityName}`
                    : `📍 ${currentCityName} (${suggestions.length} places)`}
                </span>
              </div>
              <button
                onClick={() => {
                  setSuggestions([]);
                  setActiveInput(null);
                }}
                className="text-gray-600 hover:text-black p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {searchingAddress && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-amber-900 font-bold">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span className="text-[10.5px]">Searching {currentCityName}...</span>
              </div>
            )}

            {!searchingAddress && suggestions.length === 0 && (
              <div className="py-2.5 text-center text-[10.5px] font-bold text-gray-700 px-2 leading-relaxed">
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
                  className="w-full text-left p-2 rounded-xl hover:bg-amber-100 text-[11px] text-gray-900 hover:text-black flex items-start gap-2 transition group border border-transparent hover:border-amber-300"
                >
                  <div className="p-1 rounded-lg bg-amber-200 group-hover:bg-amber-300 text-amber-950 shrink-0 mt-0.5 transition">
                    {renderPlaceIcon(item.type)}
                  </div>
                  <div className="truncate flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-black truncate text-[11.5px]">{item.title}</span>
                      <span className="text-[9.5px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-1 py-0.2 rounded font-black shrink-0">
                        {item.distanceKm ? `${item.distanceKm} km` : 'Local'}
                      </span>
                    </div>
                    {item.subtitle && (
                      <div className="text-[9.5px] font-semibold text-gray-600 truncate mt-0.5">
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
                className="shrink-0 bg-white hover:bg-amber-100 border-2 border-amber-300 hover:border-amber-400 px-3 py-1.5 rounded-xl text-[10.5px] font-black text-gray-950 transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Zap className="w-3 h-3 text-amber-600 fill-amber-500 shrink-0" />
                <span>{loc.name.split(',')[0]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Rapido-Style Multi-Vehicle Selector (All Vehicles in Single Compact View) */}
        {estimatedFare && Array.isArray(estimatedFare.vehicles) && estimatedFare.vehicles.length > 0 && (
          <div className="space-y-1.5 flex-1 min-h-0 overflow-hidden flex flex-col justify-between">
            {/* Serving Zone Tag & Stats */}
            <div className="flex items-center justify-between px-1 text-[10px] shrink-0 font-black">
              <span className="text-emerald-950 flex items-center gap-1.5 bg-emerald-200 px-2 py-0.5 rounded-md border border-emerald-400 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                {estimatedFare.matched_city ? `Serving ${estimatedFare.matched_city}` : 'Available Rides'}
              </span>
              <span className="text-amber-950 font-black bg-white px-2 py-0.5 rounded-md border-2 border-amber-300 shadow-sm">
                {estimatedFare.distance_km} km • ~{estimatedFare.duration_mins} mins
              </span>
            </div>

            {/* Vehicle Cards Compact List (All vehicles directly displayed) */}
            <div className="space-y-1.5 overflow-y-auto pr-0.5 max-h-[185px] sm:max-h-[205px] scrollbar-thin">
              {allVehiclesList.map((v) => {
                const isSelected = selectedVehicleId === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`w-full text-left py-2 px-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-amber-100 border-2 border-amber-500 ring-2 ring-amber-400/50 shadow-md'
                        : 'bg-white hover:bg-amber-50/80 border-2 border-amber-200/90 text-gray-900 shadow-sm'
                    }`}
                  >
                    {/* Left: Compact Vehicle Icon */}
                    <VehicleIcon id={v.id} category={v.category} />

                    {/* Middle: Name, Badges & ETA */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className="text-[11.5px] font-black text-black truncate">{v.name}</span>
                        {v.badge && (
                          <span
                            className={`text-[7.5px] font-black px-1.5 py-0.5 rounded shadow-sm ${
                              v.badge === 'FASTEST'
                                ? 'bg-amber-400 text-gray-950 border border-amber-500'
                                : v.badge === 'POPULAR'
                                ? 'bg-purple-600 text-white'
                                : v.badge === 'AC CAB'
                                ? 'bg-blue-600 text-white'
                                : v.badge === 'PREMIUM'
                                ? 'bg-amber-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {v.badge}
                          </span>
                        )}
                        {v.discount_percent && (
                          <span className="text-[7.5px] font-black bg-emerald-100 text-emerald-900 border border-emerald-400 px-1 py-0.2 rounded">
                            {v.discount_percent}
                          </span>
                        )}
                      </div>
                      <div className="text-[9.5px] text-gray-700 flex items-center gap-1.5 mt-1 leading-none font-bold">
                        <span className="font-black text-amber-950">{v.eta_mins}m</span>
                        <span className="text-gray-400">•</span>
                        <span className="truncate text-gray-800">{v.drop_time}</span>
                        <span className="text-gray-400">•</span>
                        <span className="flex items-center gap-0.5 text-gray-800">
                          <User className="w-2.5 h-2.5 text-gray-700" />
                          {v.capacity}
                        </span>
                      </div>
                    </div>

                    {/* Right: Price */}
                    <div className="text-right shrink-0">
                      <div className="text-[14px] font-black text-amber-950 leading-tight">
                        ₹{v.fare}
                      </div>
                      {v.original_fare && (
                        <div className="text-[9.5px] text-gray-500 line-through leading-none mt-0.5 font-bold">
                          ₹{v.original_fare}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Payment & Offers Bar */}
            <div className="bg-white px-2.5 py-1.5 rounded-xl border-2 border-amber-300 flex items-center justify-between text-xs shrink-0 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-950 text-[10px] font-black">Payment:</span>
                <div className="flex items-center gap-1">
                  {['UPI', 'CASH', 'WALLET'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMode(m)}
                      className={`px-2.5 py-0.5 rounded-md text-[9.5px] font-black transition cursor-pointer ${
                        paymentMode === m
                          ? 'bg-amber-400 text-gray-950 border border-amber-500 shadow-sm'
                          : 'bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 text-[9.5px] font-black text-white bg-emerald-600 border border-emerald-700 px-2 py-0.5 rounded-md shadow-sm">
                <Percent className="w-2.5 h-2.5 text-white" />
                <span>Offer Applied</span>
              </div>
            </div>
          </div>
        )}

        {/* Book Button (Only visible after drop destination is chosen and vehicles are ready) */}
        {estimatedFare && pickup && drop && !isEditingAddress && !activeInput && (
          <button
            onClick={() => {
              const chosen = (estimatedFare?.vehicles || []).find((v) => v.id === selectedVehicleId) ||
                estimatedFare?.vehicles?.[0] || {
                  id: 'bike',
                  name: 'RiderXO Bike',
                  category: 'BIKE',
                  fare: estimatedFare?.fare
                };
              onRequestRide(paymentMode, chosen);
            }}
            disabled={loadingEstimate || !estimatedFare?.vehicles?.length}
            className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-gray-950 py-2.5 rounded-xl font-black text-[13.5px] flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/30 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer border-2 border-amber-500"
          >
            <Zap className="w-4 h-4 fill-current text-gray-950" />
            {loadingEstimate
              ? 'Calculating Route & Fares...'
              : `Book ${
                  (estimatedFare?.vehicles || []).find((v) => v.id === selectedVehicleId)?.name ||
                  'RiderXO Ride'
                } (₹${
                  (estimatedFare?.vehicles || []).find((v) => v.id === selectedVehicleId)?.fare ||
                  estimatedFare?.fare ||
                  '--'
                })`}
          </button>
        )}
      </div>
    </div>
  );
};
