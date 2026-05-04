import { useState } from 'react';
import { FileText, Download, Eye, Search, Upload } from 'lucide-react';

export function MedicalRecords() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const records = [
    {
      id: 1,
      patient: 'Sarah Johnson',
      type: 'Lab Results',
      category: 'Laboratory',
      date: '2026-04-28',
      doctor: 'Dr. Smith',
      description: 'Complete Blood Count (CBC)',
      status: 'Completed',
    },
    {
      id: 2,
      patient: 'Michael Chen',
      type: 'Prescription',
      category: 'Medication',
      date: '2026-04-25',
      doctor: 'Dr. Williams',
      description: 'Metformin 500mg - 90 day supply',
      status: 'Active',
    },
    {
      id: 3,
      patient: 'Emma Davis',
      type: 'Imaging',
      category: 'Radiology',
      date: '2026-05-01',
      doctor: 'Dr. Brown',
      description: 'Chest X-Ray',
      status: 'Completed',
    },
    {
      id: 4,
      patient: 'James Wilson',
      type: 'Consultation Notes',
      category: 'Clinical',
      date: '2026-04-30',
      doctor: 'Dr. Garcia',
      description: 'Arthritis follow-up consultation',
      status: 'Completed',
    },
    {
      id: 5,
      patient: 'Sarah Johnson',
      type: 'Vaccination Record',
      category: 'Immunization',
      date: '2026-04-15',
      doctor: 'Dr. Smith',
      description: 'Annual Flu Vaccine',
      status: 'Completed',
    },
    {
      id: 6,
      patient: 'Michael Chen',
      type: 'Lab Results',
      category: 'Laboratory',
      date: '2026-04-20',
      doctor: 'Dr. Williams',
      description: 'HbA1c Test',
      status: 'Completed',
    },
  ];

  const categories = ['all', 'Laboratory', 'Medication', 'Radiology', 'Clinical', 'Immunization'];

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || record.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const statusColors = {
    Completed: 'bg-green-100 text-green-700',
    Active: 'bg-blue-100 text-blue-700',
    Pending: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Medical Records</h2>
          <p className="text-gray-500">Access and manage patient medical records</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Upload className="w-5 h-5" />
          Upload Record
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search records by patient, type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All Records' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{record.type}</h3>
                  <p className="text-sm text-gray-500">{record.patient}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  statusColors[record.status as keyof typeof statusColors]
                }`}
              >
                {record.status}
              </span>
            </div>

            <p className="text-gray-700 mb-4">{record.description}</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-4">
                <span>{record.doctor}</span>
                <span>•</span>
                <span>{new Date(record.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
              <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                {record.category}
              </span>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Eye className="w-4 h-4" />
                View
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No records found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
