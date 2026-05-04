import { useState } from 'react';
import { Search, Plus, Phone, Mail, MapPin } from 'lucide-react';

export function PatientList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);

  const patients = [
    {
      id: 1,
      name: 'Sarah Johnson',
      age: 34,
      gender: 'Female',
      phone: '(555) 123-4567',
      email: 'sarah.j@email.com',
      address: '123 Main St, Boston, MA',
      lastVisit: '2026-04-28',
      condition: 'Hypertension',
      bloodType: 'A+',
    },
    {
      id: 2,
      name: 'Michael Chen',
      age: 45,
      gender: 'Male',
      phone: '(555) 234-5678',
      email: 'mchen@email.com',
      address: '456 Oak Ave, Cambridge, MA',
      lastVisit: '2026-04-25',
      condition: 'Diabetes Type 2',
      bloodType: 'O+',
    },
    {
      id: 3,
      name: 'Emma Davis',
      age: 28,
      gender: 'Female',
      phone: '(555) 345-6789',
      email: 'emma.d@email.com',
      address: '789 Pine Rd, Newton, MA',
      lastVisit: '2026-05-01',
      condition: 'Asthma',
      bloodType: 'B+',
    },
    {
      id: 4,
      name: 'James Wilson',
      age: 52,
      gender: 'Male',
      phone: '(555) 456-7890',
      email: 'jwilson@email.com',
      address: '321 Elm St, Brookline, MA',
      lastVisit: '2026-04-30',
      condition: 'Arthritis',
      bloodType: 'AB+',
    },
  ];

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selected = selectedPatient ? patients.find((p) => p.id === selectedPatient) : null;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Patient Management</h2>
          <p className="text-gray-500">Manage patient records and information</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          Add Patient
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedPatient === patient.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-500">
                      {patient.age} years • {patient.gender}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">Last visit: {patient.lastVisit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Details */}
        <div className="bg-white rounded-lg border border-gray-200">
          {selected ? (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{selected.name}</h3>
                <p className="text-gray-500">
                  {selected.age} years old • {selected.gender}
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{selected.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{selected.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900">{selected.address}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Blood Type</p>
                  <p className="font-medium text-gray-900">{selected.bloodType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Visit</p>
                  <p className="font-medium text-gray-900">{selected.lastVisit}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Current Condition</p>
                  <p className="font-medium text-gray-900">{selected.condition}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Edit Patient
                </button>
                <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  View History
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>Select a patient to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
