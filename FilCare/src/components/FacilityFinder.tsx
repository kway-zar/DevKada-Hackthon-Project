import { useMemo, useState } from 'react';
import { MapPin, Navigation, Phone, Clock, Star, Building2 } from 'lucide-react';

const OVERPASS_PROXY_URL =
  (import.meta.env.VITE_OVERPASS_PROXY_URL as string | undefined)?.trim() || '/api/overpass';
const OVERPASS_DIRECT_URL =
  (import.meta.env.VITE_OVERPASS_DIRECT_URL as string | undefined)?.trim() || 'https://overpass-api.de/api/interpreter';

interface FacilityFinderProps {
  triageData: any;
  onFacilitySelect: (facility: any) => void;
}

export function FacilityFinder({ triageData, onFacilitySelect }: FacilityFinderProps) {
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [userLocation, setUserLocation] = useState('Unknown location');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsSource, setGpsSource] = useState<'mock' | 'live'>('mock');
  const [facilities, setFacilities] = useState([
    {
      id: 'mock-pgh',
      name: 'Philippine General Hospital',
      type: 'Hospital',
      distance: '1.8 km',
      waitTime: '15 min',
      rating: 4.8,
      address: 'Taft Avenue, Ermita, Manila, 1000',
      phone: '(02) 8554-8400',
      secondaryPhone: '(02) 8526-0150',
      emergencyHotline: '911',
      capabilities: ['Emergency Room', 'Trauma Center', 'ICU', 'Surgery'],
      lat: 14.5775,
      lon: 120.9851,
      acceptsP1: true,
      acceptsP2: true,
      acceptsP3: true,
    },
    {
      id: 'mock-st-lukes-bgc',
      name: 'St. Luke\'s Medical Center BGC',
      type: 'Hospital',
      distance: '8.5 km',
      waitTime: '20 min',
      rating: 4.7,
      address: 'Rizal Drive, Bonifacio Global City, Taguig, 1634',
      phone: '(02) 8789-7700',
      secondaryPhone: '(02) 8789-7700',
      emergencyHotline: '911',
      capabilities: ['Emergency Room', 'Cardiology', 'Oncology', 'Surgery'],
      lat: 14.5547,
      lon: 121.0473,
      acceptsP1: true,
      acceptsP2: true,
      acceptsP3: true,
    },
    {
      id: 'mock-makati-med',
      name: 'Makati Medical Center',
      type: 'Hospital',
      distance: '6.1 km',
      waitTime: '25 min',
      rating: 4.5,
      address: '2 Amorsolo Street, Legazpi Village, Makati, 1229',
      phone: '(02) 8888-8999',
      secondaryPhone: '(02) 8888-8999',
      emergencyHotline: '911',
      capabilities: ['Emergency Room', 'Trauma Center', 'Pediatrics'],
      lat: 14.5599,
      lon: 121.0144,
      acceptsP1: true,
      acceptsP2: true,
      acceptsP3: true,
    },
    {
      id: 'mock-manila-clinic',
      name: 'Manila Community Clinic',
      type: 'Clinic',
      distance: '1.2 km',
      waitTime: '30 min',
      rating: 4.6,
      address: 'Padre Faura Street, Ermita, Manila, 1000',
      phone: '(02) 8521-0020',
      secondaryPhone: '(02) 8521-0021',
      emergencyHotline: '911',
      capabilities: ['Primary Care', 'Urgent Care', 'Lab Services'],
      lat: 14.5806,
      lon: 120.9847,
      acceptsP1: false,
      acceptsP2: true,
      acceptsP3: true,
    },
    {
      id: 'mock-quezon-urgent-care',
      name: 'Quezon City Urgent Care',
      type: 'Clinic',
      distance: '9.4 km',
      waitTime: '45 min',
      rating: 4.4,
      address: 'East Avenue, Diliman, Quezon City, 1100',
      phone: '(02) 8928-0611',
      secondaryPhone: '(02) 8928-0612',
      emergencyHotline: '911',
      capabilities: ['Urgent Care', 'X-Ray', 'Minor Procedures'],
      lat: 14.6426,
      lon: 121.0482,
      acceptsP1: false,
      acceptsP2: true,
      acceptsP3: true,
    },
  ]);

  const distanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadius = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };

  const formatAddressFromTags = (tags: any) => {
    const full = tags?.['addr:full'];
    if (full) return full;
    const parts = [
      tags?.['addr:housenumber'],
      tags?.['addr:street'],
      tags?.['addr:city'],
      tags?.['addr:state'],
      tags?.['addr:postcode'],
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Address not provided';
  };

  const deriveCapabilities = (tags: any, amenityType: 'Hospital' | 'Clinic') => {
    const joined = `${tags?.healthcare || ''} ${tags?.['healthcare:speciality'] || ''} ${tags?.name || ''}`.toLowerCase();
    if (amenityType === 'Hospital') {
      const caps = ['Emergency Room', 'General Medicine'];
      if (joined.includes('trauma')) caps.push('Trauma Center');
      if (joined.includes('surgery')) caps.push('Surgery');
      if (joined.includes('cardio')) caps.push('Cardiology');
      return caps;
    }
    const caps = ['Primary Care', 'Urgent Care'];
    if (joined.includes('pedi')) caps.push('Pediatrics');
    if (joined.includes('dental')) caps.push('Dental');
    return caps;
  };

  const filteredFacilities = useMemo(() => {
    const triageFilteredFacilities = facilities.filter((facility) => {
      if (!triageData) return true;
      if (triageData.priority === 'P1') return facility.acceptsP1 && facility.type === 'Hospital';
      if (triageData.priority === 'P2') return facility.acceptsP2;
      return facility.acceptsP3;
    });

    return [...triageFilteredFacilities]
      .map((facility) => {
        if (!userCoords) return facility;
        const computedDistanceKm = distanceInKm(userCoords.lat, userCoords.lon, facility.lat, facility.lon);
        return {
          ...facility,
          distance: `${computedDistanceKm.toFixed(1)} km`,
          distanceValueKm: computedDistanceKm,
        };
      })
      .sort((a: any, b: any) => {
        if (userCoords) return (a.distanceValueKm ?? 9999) - (b.distanceValueKm ?? 9999);
        return parseFloat(String(a.distance)) - parseFloat(String(b.distance));
      });
  }, [facilities, triageData, userCoords]);

  const fetchNearbyHospitals = async (lat: number, lon: number) => {
    const query = `
      [out:json][timeout:25];
      (
        node(around:6000,${lat},${lon})[amenity~"hospital|clinic"];
        way(around:6000,${lat},${lon})[amenity~"hospital|clinic"];
      );
      out center 25;
    `;
    
    const response = await fetch(OVERPASS_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: query,
    });
    if (!response.ok) {
      throw new Error('Failed to fetch nearby facilities');
    }

    const data = await response.json();
    const elements = Array.isArray(data?.elements) ? data.elements : [];
    if (elements.length === 0) return null;

    const mapped = elements
      .map((element: any, index: number) => {
        const latValue = element.lat ?? element.center?.lat;
        const lonValue = element.lon ?? element.center?.lon;
        if (typeof latValue !== 'number' || typeof lonValue !== 'number') return null;
        const distanceKm = distanceInKm(lat, lon, latValue, lonValue);
        const amenityType = element.tags?.amenity === 'hospital' ? 'Hospital' : 'Clinic';
        return {
          id: `osm-${element.type || 'node'}-${element.id || index + 1}`,
          name: element.tags?.name || `${amenityType} (Nearby)`,
          type: amenityType,
          distance: `${distanceKm.toFixed(1)} km`,
          distanceValueKm: distanceKm,
          waitTime: 'Call facility',
          rating: amenityType === 'Hospital' ? 4.6 : 4.4,
          address: formatAddressFromTags(element.tags),
          phone: element.tags?.phone || element.tags?.['contact:phone'] || 'N/A',
          secondaryPhone: element.tags?.['contact:phone'] || null,
          emergencyHotline:
            element.tags?.['emergency:phone'] ||
            (amenityType === 'Hospital'
              ? element.tags?.phone || element.tags?.['contact:phone'] || '911'
              : '911'),
          capabilities: deriveCapabilities(element.tags, amenityType),
          acceptsP1: amenityType === 'Hospital',
          acceptsP2: true,
          acceptsP3: true,
          lat: latValue,
          lon: lonValue,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.distanceValueKm - b.distanceValueKm)
      .slice(0, 10);

    return mapped.length > 0 ? mapped : null;
  };

  const useFallbackLocation = async (message: string) => {
    const lat = 14.5995;
    const lon = 120.9842;
    setUserCoords({ lat, lon });
    setUserLocation('Manila, Philippines');
    setGpsError(message);
    try {
      const liveFacilities = await fetchNearbyHospitals(lat, lon);
      if (liveFacilities && liveFacilities.length > 0) {
        setFacilities(liveFacilities);
        setGpsSource('live');
        return;
      }
    } catch {
      // Keep recommended facilities sorted against the fallback coordinates.
    }
    setGpsSource('mock');
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsLoading(true);
      void useFallbackLocation('Geolocation is not supported in this browser. Showing facilities near Manila instead.')
        .finally(() => setGpsLoading(false));
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserCoords({ lat, lon });
        setUserLocation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        try {
          const liveFacilities = await fetchNearbyHospitals(lat, lon);
          if (liveFacilities && liveFacilities.length > 0) {
            setFacilities(liveFacilities);
            setGpsSource('live');
          } else {
            setGpsSource('mock');
            setGpsError('No nearby facilities found from GPS. Showing recommended facilities sorted by distance.');
          }
        } catch (_error) {
          setGpsSource('mock');
          setGpsError('Live nearby facility search is unavailable. Showing recommended facilities sorted by distance.');
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          void useFallbackLocation('Location permission denied. Showing facilities near Manila instead.');
        } else {
          void useFallbackLocation('Unable to get your current location. Showing facilities near Manila instead.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectFacility = (facility: any) => {
    setSelectedFacility(facility);
    onFacilitySelect(facility);
  };

  const priorityColors = {
    P1: 'bg-red-100 border-red-300 text-red-900',
    P2: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    P3: 'bg-green-100 border-green-300 text-green-900',
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Find Facility</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Recommended based on symptoms & location
        </p>
      </div>

      {triageData && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${priorityColors[triageData.priority as keyof typeof priorityColors]}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold">
              {triageData.priority}
            </div>
            <div>
              <p className="font-semibold">{triageData.priorityLabel} Priority</p>
              <p className="text-sm">{triageData.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Location
        </label>
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={userLocation}
            onChange={(e) => setUserLocation(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleUseGps}
            disabled={gpsLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Navigation className="w-4 h-4" />
            {gpsLoading ? 'Locating...' : 'Use GPS'}
          </button>
        </div>
        {gpsError && <p className="mt-2 text-sm text-red-600">{gpsError}</p>}
        <p className="mt-2 text-xs text-gray-500">
          {gpsSource === 'live'
            ? 'Showing GPS-based nearby hospital/clinic listings.'
            : 'Showing recommended facilities. Tap Use GPS for local nearby listings.'}
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {filteredFacilities.map((facility) => (
          <div
            key={facility.id}
            className={`bg-white rounded-2xl border-2 transition-all hover:shadow-lg active:scale-[0.99] ${
              selectedFacility?.id === facility.id
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200'
            }`}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-1 leading-tight">
                      {facility.name}
                    </h3>
                    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 flex-wrap">
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                        {facility.type}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
                        <span>{facility.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">{facility.distance}</div>
                  <div className="text-xs sm:text-sm text-gray-500">away</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{facility.address}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Est. Wait: {facility.waitTime}</span>
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Primary:</span> {facility.phone || 'N/A'}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Emergency:</span> {facility.emergencyHotline || '911'}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Capabilities:</p>
                <div className="flex flex-wrap gap-2">
                  {facility.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleSelectFacility(facility)}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-98 font-medium transition-transform shadow-lg"
                >
                  Select Facility
                </button>
                <a
                  href={facility.phone !== 'N/A' ? `tel:${facility.phone}` : '#'}
                  onClick={(event) => {
                    if (facility.phone === 'N/A') event.preventDefault();
                  }}
                  className={`sm:flex-none px-4 py-3 border-2 rounded-xl active:scale-98 flex items-center justify-center gap-2 transition-transform ${
                    facility.phone === 'N/A'
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>Call</span>
                </a>
                {facility.secondaryPhone && facility.secondaryPhone !== facility.phone && (
                  <a
                    href={`tel:${facility.secondaryPhone}`}
                    className="sm:flex-none px-4 py-3 border-2 border-indigo-300 text-indigo-700 rounded-xl hover:bg-indigo-50 active:scale-98 flex items-center justify-center gap-2 transition-transform"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Other Phone</span>
                  </a>
                )}
                {(facility.emergencyHotline || '911') && (
                  <a
                    href={`tel:${facility.emergencyHotline || '911'}`}
                    className="sm:flex-none px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-98 flex items-center justify-center gap-2 transition-transform"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Emergency</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {triageData?.priority === 'P1' && (
        <div className="mt-6 bg-red-100 border-2 border-red-300 rounded-lg p-6">
          <h4 className="font-bold text-red-900 mb-2">⚠️ CRITICAL PRIORITY</h4>
          <p className="text-red-800 mb-3">
            Your symptoms indicate a medical emergency. We strongly recommend:
          </p>
          <ul className="list-disc list-inside text-red-800 mb-4 space-y-1">
            <li>Call 911 immediately if you cannot travel safely</li>
            <li>Go to the nearest Emergency Room (listed above)</li>
            <li>Do not drive yourself - have someone drive you or call an ambulance</li>
          </ul>
          <a
            href="tel:911"
            className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
          >
            Call 911 Emergency Services
          </a>
        </div>
      )}
    </div>
  );
}
