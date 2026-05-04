import { useState, useEffect } from 'react';
import { Clock, Users, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface PatientQueueProps {
  patientData: any;
  triageData: any;
}

export function PatientQueue({ patientData, triageData }: PatientQueueProps) {
  const [queuePosition, setQueuePosition] = useState(42);
  const [nowServing, setNowServing] = useState(39);
  const [estimatedWait, setEstimatedWait] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      if (nowServing < queuePosition) {
        setNowServing(prev => prev + 1);
        setEstimatedWait(prev => Math.max(0, prev - 4));
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [nowServing, queuePosition]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1':
        return 'text-red-600 bg-red-100';
      case 'P2':
        return 'text-yellow-600 bg-yellow-100';
      case 'P3':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const peopleAhead = queuePosition - nowServing;
  const progress = ((nowServing / queuePosition) * 100).toFixed(0);

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Virtual Queue</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Live updates - wait from anywhere
        </p>
      </div>

      {/* Main Queue Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 sm:p-8 text-white mb-4 sm:mb-6 shadow-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-blue-100 mb-2 text-sm sm:text-base">Your Queue Number</p>
          <div className="text-6xl sm:text-7xl font-bold mb-3">#{queuePosition}</div>
          <div className={`inline-block px-4 py-2 rounded-full ${getPriorityColor(triageData?.priority || 'P3')} font-semibold text-sm sm:text-base shadow-lg`}>
            {triageData?.priorityLabel || 'Standard'} Priority
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 text-center">
            <p className="text-blue-100 mb-1 sm:mb-2 text-xs sm:text-sm">Now Serving</p>
            <div className="text-2xl sm:text-4xl font-bold">#{nowServing}</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 text-center">
            <p className="text-blue-100 mb-1 sm:mb-2 text-xs sm:text-sm">People Ahead</p>
            <div className="text-2xl sm:text-4xl font-bold">{peopleAhead}</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 text-center">
            <p className="text-blue-100 mb-1 sm:mb-2 text-xs sm:text-sm">Wait Time</p>
            <div className="text-2xl sm:text-4xl font-bold">{estimatedWait}<span className="text-lg sm:text-2xl">m</span></div>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-blue-100">Queue Progress</span>
            <span className="text-sm font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Checked In</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Wait at home or in your car
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Live Updates</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                SMS and email notifications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Patient Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium text-gray-900">{patientData?.name || 'Guest'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Patient ID</p>
            <p className="font-medium text-gray-900">{patientData?.id || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Check-in Time</p>
            <p className="font-medium text-gray-900">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Priority Level</p>
            <p className="font-medium text-gray-900">{triageData?.priorityLabel || 'Standard'}</p>
          </div>
        </div>
      </div>

      {/* Facility Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Facility Information</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Massachusetts General Hospital</span>
            <span className="text-sm text-blue-600 font-medium">View Map</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">55 Fruit Street, Boston, MA</span>
            <span className="text-sm text-blue-600 font-medium">Get Directions</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Emergency Hotline</span>
            <a href="tel:617-726-2911" className="text-sm text-blue-600 font-medium">
              (617) 726-2911
            </a>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">What to Do Next</p>
            <p>
              Please arrive at the facility when there are 2-3 people ahead of you in the queue.
              We'll send you a notification 10 minutes before your turn.
            </p>
          </div>
        </div>

        {estimatedWait <= 5 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 animate-pulse">
            <TrendingUp className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-semibold mb-1">Almost Your Turn!</p>
              <p>
                Please make your way to the facility now. Only {peopleAhead} patient{peopleAhead !== 1 ? 's' : ''} ahead of you.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 active:scale-98 transition-transform">
          Cancel Appointment
        </button>
        <button className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-98 transition-transform shadow-lg">
          Contact Facility
        </button>
      </div>
    </div>
  );
}
