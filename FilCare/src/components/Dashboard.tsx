import { Users, Calendar, ClipboardList, TrendingUp } from 'lucide-react';

export function Dashboard() {
  const stats = [
    { label: 'Total Patients', value: '1,247', change: '+12%', icon: Users, color: 'blue' },
    { label: 'Appointments Today', value: '32', change: '+5%', icon: Calendar, color: 'green' },
    { label: 'Pending Records', value: '8', change: '-3%', icon: ClipboardList, color: 'orange' },
    { label: 'Patient Satisfaction', value: '94%', change: '+2%', icon: TrendingUp, color: 'purple' },
  ];

  const recentAppointments = [
    { id: 1, patient: 'Sarah Johnson', doctor: 'Dr. Smith', time: '09:00 AM', status: 'Confirmed' },
    { id: 2, patient: 'Michael Chen', doctor: 'Dr. Williams', time: '10:30 AM', status: 'In Progress' },
    { id: 3, patient: 'Emma Davis', doctor: 'Dr. Brown', time: '11:00 AM', status: 'Waiting' },
    { id: 4, patient: 'James Wilson', doctor: 'Dr. Garcia', time: '02:00 PM', status: 'Confirmed' },
  ];

  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard Overview</h2>
        <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorMap[stat.color as keyof typeof colorMap]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Today's Appointments</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentAppointments.map((apt) => (
            <div key={apt.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{apt.patient}</p>
                <p className="text-sm text-gray-500">{apt.doctor}</p>
              </div>
              <div className="flex items-center gap-6">
                <p className="text-sm text-gray-600">{apt.time}</p>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    apt.status === 'Confirmed'
                      ? 'bg-blue-100 text-blue-700'
                      : apt.status === 'In Progress'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {apt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
