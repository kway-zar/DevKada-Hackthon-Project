import { useState } from 'react';
import { ArrowLeft, Users, Clock, AlertTriangle, CheckCircle, Search, QrCode } from 'lucide-react';
import { FilCareLogo } from './FilCareLogo';

interface DoctorDashboardProps {
  onBack: () => void;
}

export function DoctorDashboard({ onBack }: DoctorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'patients' | 'analytics'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const queuePatients = [
    {
      id: 1,
      queueNumber: 42,
      name: 'Sarah Johnson',
      age: 34,
      priority: 'P1',
      priorityLabel: 'Immediate',
      symptoms: 'Chest pain, shortness of breath',
      checkinTime: '10:15 AM',
      estimatedWait: '0 min',
      status: 'Waiting',
      bloodType: 'A+',
    },
    {
      id: 2,
      queueNumber: 43,
      name: 'Michael Chen',
      age: 45,
      priority: 'P2',
      priorityLabel: 'Urgent',
      symptoms: 'High fever, persistent vomiting',
      checkinTime: '10:22 AM',
      estimatedWait: '15 min',
      status: 'Waiting',
      bloodType: 'O+',
    },
    {
      id: 3,
      queueNumber: 44,
      name: 'Emma Davis',
      age: 28,
      priority: 'P3',
      priorityLabel: 'Non-Urgent',
      symptoms: 'Cough, mild fever',
      checkinTime: '10:30 AM',
      estimatedWait: '30 min',
      status: 'Waiting',
      bloodType: 'B+',
    },
    {
      id: 4,
      queueNumber: 39,
      name: 'James Wilson',
      age: 52,
      priority: 'P2',
      priorityLabel: 'Urgent',
      symptoms: 'Severe headache, dizziness',
      checkinTime: '09:45 AM',
      estimatedWait: '0 min',
      status: 'In Progress',
      bloodType: 'AB+',
    },
    {
      id: 5,
      queueNumber: 45,
      name: 'Lisa Anderson',
      age: 41,
      priority: 'P3',
      priorityLabel: 'Non-Urgent',
      symptoms: 'Back pain, muscle ache',
      checkinTime: '10:35 AM',
      estimatedWait: '45 min',
      status: 'Waiting',
      bloodType: 'A-',
    },
  ];

  const stats = [
    { label: 'Total in Queue', value: '24', icon: Users, color: 'blue' },
    { label: 'P1 Critical', value: '3', icon: AlertTriangle, color: 'red' },
    { label: 'P2 Urgent', value: '8', icon: Clock, color: 'yellow' },
    { label: 'P3 Routine', value: '13', icon: CheckCircle, color: 'green' },
  ];

  const priorityColors = {
    P1: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900', badge: 'bg-red-500' },
    P2: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900', badge: 'bg-yellow-500' },
    P3: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900', badge: 'bg-green-500' },
  };

  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
  };

  const filteredPatients = queuePatients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.queueNumber.toString().includes(searchQuery)
  ).sort((a, b) => {
    const priorityOrder = { P1: 0, P2: 1, P3: 2 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  return (
    <div className="size-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <FilCareLogo size="sm" showText={false} />
            <div>
              <h1 className="text-base sm:text-xl font-bold text-gray-900">Provider Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Massachusetts General Hospital</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="font-medium text-gray-900 text-sm">Dr. Sarah Smith</p>
              <p className="text-xs text-gray-500">Emergency Medicine</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 overflow-x-auto">
        <div className="flex gap-4 sm:gap-6">
          {[
            { id: 'queue', label: 'Queue', fullLabel: 'Queue Management' },
            { id: 'patients', label: 'Patients', fullLabel: 'Patient Records' },
            { id: 'analytics', label: 'Analytics', fullLabel: 'Analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 sm:py-4 px-2 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="sm:hidden">{tab.label}</span>
              <span className="hidden sm:inline">{tab.fullLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {activeTab === 'queue' && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 sm:p-3 rounded-xl ${colorMap[stat.color as keyof typeof colorMap]}`}>
                        <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or queue number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Scan QR
                </button>
              </div>
            </div>

            {/* Queue List */}
            <div className="space-y-3 sm:space-y-4">
              {filteredPatients.map((patient) => {
                const colors = priorityColors[patient.priority as keyof typeof priorityColors];
                return (
                  <div
                    key={patient.id}
                    className={`bg-white rounded-2xl border-2 ${
                      patient.status === 'In Progress' ? 'border-blue-500 shadow-lg' : colors.border
                    } p-4 sm:p-6 hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`${colors.badge} w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold`}>
                          #{patient.queueNumber}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {patient.name}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            {patient.age} years old • Blood Type: {patient.bloodType}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} ${colors.text}`}>
                              {patient.priority} - {patient.priorityLabel}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              patient.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {patient.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Check-in</p>
                        <p className="font-medium text-gray-900">{patient.checkinTime}</p>
                        <p className="text-sm text-gray-500 mt-2">Wait Time</p>
                        <p className="font-medium text-gray-900">{patient.estimatedWait}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Reported Symptoms</p>
                      <p className="text-gray-900">{patient.symptoms}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-98 font-medium shadow-lg transition-transform">
                        See Patient
                      </button>
                      <button className="sm:flex-none px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:scale-98 transition-transform">
                        <span className="hidden sm:inline">View Records</span>
                        <span className="sm:hidden">Records</span>
                      </button>
                      <button className="sm:flex-none px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:scale-98 transition-transform">
                        <span className="hidden sm:inline">Mark Complete</span>
                        <span className="sm:hidden">Complete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Scan Patient QR Code</h3>
            <p className="text-gray-600 mb-6">
              Use the QR scanner to quickly access patient medical records and history
            </p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
              Open QR Scanner
            </button>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Today's Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Patients Seen</span>
                    <span className="text-2xl font-bold text-gray-900">47</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Wait Time</span>
                    <span className="text-2xl font-bold text-gray-900">23 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Critical Cases</span>
                    <span className="text-2xl font-bold text-red-600">5</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Priority Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">P1 - Critical</span>
                      <span className="text-red-600 font-semibold">12%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '12%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">P2 - Urgent</span>
                      <span className="text-yellow-600 font-semibold">33%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '33%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">P3 - Routine</span>
                      <span className="text-green-600 font-semibold">55%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '55%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
