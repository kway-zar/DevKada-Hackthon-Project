import { useState } from 'react';
import { MapPin, Navigation, Phone, Clock, Star, Building2 } from 'lucide-react';

interface FacilityFinderProps {
  triageData: any;
  onFacilitySelect: (facility: any) => void;
}

export function FacilityFinder({ triageData, onFacilitySelect }: FacilityFinderProps) {
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [userLocation, setUserLocation] = useState('Boston, MA');

  const facilities = [
    {
      id: 1,
      name: 'Massachusetts General Hospital',
      type: 'Hospital',
      distance: '1.2 miles',
      waitTime: '15 min',
      rating: 4.8,
      address: '55 Fruit Street, Boston, MA 02114',
      phone: '(617) 726-2000',
      emergencyHotline: '(617) 726-2911',
      capabilities: ['Emergency Room', 'Trauma Center', 'ICU', 'Surgery'],
      acceptsP1: true,
      acceptsP2: true,
      acceptsP3: true,
    },
    {
      id: 2,
      name: 'Brigham and Women\'s Hospital',
      type: 'Hospital',
      distance: '1.8 miles',
      waitTime: '20 min',
      rating: 4.7,
      address: '75 Francis Street, Boston, MA 02115',
      phone: '(617) 732-5500',
      emergencyHotline: '(617) 732-5636',
      capabilities: ['Emergency Room', 'Cardiology', 'Oncology', 'Surgery'],
      acceptsP1: true,
      acceptsP2: true,
      acceptsP3: true,
    },
    {
      id: 3,
      name: 'Boston Medical Center',
      type: 'Hospital',
      distance: '2.3 miles',
      waitTime: '25 min',
      rating: 4.5,
      address: '1 Boston Medical Center Pl, Boston, MA 02118',
      phone: '(617) 638-8000',
      emergencyHotline: '(617) 638-7575',
      capabilities: ['Emergency Room', 'Trauma Center', 'Pediatrics'],
      acceptsP1: true,
      acceptsP2: true,
      acceptsP3: true,
    },
    {
      id: 4,
      name: 'Boston Community Clinic',
      type: 'Clinic',
      distance: '0.8 miles',
      waitTime: '30 min',
      rating: 4.6,
      address: '123 Main Street, Boston, MA 02116',
      phone: '(617) 555-0100',
      emergencyHotline: null,
      capabilities: ['Primary Care', 'Urgent Care', 'Lab Services'],
      acceptsP1: false,
      acceptsP2: true,
      acceptsP3: true,
    },
    {
      id: 5,
      name: 'Cambridge Urgent Care',
      type: 'Clinic',
      distance: '3.1 miles',
      waitTime: '45 min',
      rating: 4.4,
      address: '789 Cambridge St, Cambridge, MA 02141',
      phone: '(617) 555-0200',
      emergencyHotline: null,
      capabilities: ['Urgent Care', 'X-Ray', 'Minor Procedures'],
      acceptsP1: false,
      acceptsP2: true,
      acceptsP3: true,
    },
  ];

  const filteredFacilities = facilities.filter(facility => {
    if (!triageData) return true;

    if (triageData.priority === 'P1') {
      return facility.acceptsP1 && facility.type === 'Hospital';
    } else if (triageData.priority === 'P2') {
      return facility.acceptsP2;
    } else {
      return facility.acceptsP3;
    }
  }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

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
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Use GPS
          </button>
        </div>
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
                  href={`tel:${facility.phone}`}
                  className="sm:flex-none px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:scale-98 flex items-center justify-center gap-2 transition-transform"
                >
                  <Phone className="w-4 h-4" />
                  <span className="sm:hidden">Call</span>
                </a>
                {facility.emergencyHotline && (
                  <a
                    href={`tel:${facility.emergencyHotline}`}
                    className="sm:flex-none px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-98 flex items-center justify-center gap-2 transition-transform"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="sm:hidden">Emergency</span>
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
