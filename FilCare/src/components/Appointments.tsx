import { useState } from 'react';
import { Calendar, Clock, User, Plus, Filter } from 'lucide-react';

export function Appointments() {
  const [selectedDate, setSelectedDate] = useState('2026-05-03');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const appointments = [
    {
      id: 1,
      patient: 'Sarah Johnson',
      doctor: 'Dr. Smith',
      date: '2026-05-03',
      time: '09:00 AM',
      duration: '30 min',
      type: 'Checkup',
      status: 'Confirmed',
    },
    {
      id: 2,
      patient: 'Michael Chen',
      doctor: 'Dr. Williams',
      date: '2026-05-03',
      time: '10:30 AM',
      duration: '45 min',
      type: 'Consultation',
      status: 'In Progress',
    },
    {
      id: 3,
      patient: 'Emma Davis',
      doctor: 'Dr. Brown',
      date: '2026-05-03',
      time: '11:00 AM',
      duration: '30 min',
      type: 'Follow-up',
      status: 'Waiting',
    },
    {
      id: 4,
      patient: 'James Wilson',
      doctor: 'Dr. Garcia',
      date: '2026-05-03',
      time: '02:00 PM',
      duration: '60 min',
      type: 'Treatment',
      status: 'Confirmed',
    },
    {
      id: 5,
      patient: 'Lisa Anderson',
      doctor: 'Dr. Smith',
      date: '2026-05-03',
      time: '03:30 PM',
      duration: '30 min',
      type: 'Checkup',
      status: 'Confirmed',
    },
    {
      id: 6,
      patient: 'Robert Taylor',
      doctor: 'Dr. Williams',
      date: '2026-05-04',
      time: '09:00 AM',
      duration: '45 min',
      type: 'Consultation',
      status: 'Confirmed',
    },
  ];

  const filteredAppointments = appointments.filter((apt) => {
    const dateMatch = apt.date === selectedDate;
    const statusMatch = filterStatus === 'all' || apt.status === filterStatus;
    return dateMatch && statusMatch;
  });

  const statusColors = {
    Confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    'In Progress': 'bg-green-100 text-green-700 border-green-200',
    Waiting: 'bg-orange-100 text-orange-700 border-orange-200',
    Cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Appointments</h2>
          <p className="text-gray-500">Schedule and manage patient appointments</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          New Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters and Calendar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Select Date</h3>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filter Status</h3>
            </div>
            <div className="space-y-2">
              {['all', 'Confirmed', 'In Progress', 'Waiting'].map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={filterStatus === status}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Today</span>
                <span className="font-semibold text-gray-900">
                  {appointments.filter((a) => a.date === selectedDate).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Confirmed</span>
                <span className="font-semibold text-blue-600">
                  {
                    appointments.filter(
                      (a) => a.date === selectedDate && a.status === 'Confirmed'
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">In Progress</span>
                <span className="font-semibold text-green-600">
                  {
                    appointments.filter(
                      (a) => a.date === selectedDate && a.status === 'In Progress'
                    ).length
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              Appointments for {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((apt) => (
                <div key={apt.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-gray-400" />
                        <p className="font-semibold text-gray-900">{apt.patient}</p>
                      </div>
                      <p className="text-sm text-gray-600 ml-8">{apt.doctor}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm border ${
                        statusColors[apt.status as keyof typeof statusColors]
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 ml-8 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{apt.time}</span>
                    </div>
                    <span>•</span>
                    <span>{apt.duration}</span>
                    <span>•</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                      {apt.type}
                    </span>
                  </div>
                  <div className="mt-4 ml-8 flex gap-2">
                    <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                      Start Appointment
                    </button>
                    <button className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                      Reschedule
                    </button>
                    <button className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No appointments found for this date</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
