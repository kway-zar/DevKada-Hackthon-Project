import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, MapPin, Phone, RefreshCw, TrendingUp, XCircle } from 'lucide-react';
import { fetchPatientQueueStatus, type PatientQueueEntry, type QueueFacility } from '../lib/supabaseAuth';

interface PatientQueueProps {
  patientData: any;
  triageData: any;
  selectedFacility?: any;
  queueEntry?: PatientQueueEntry | null;
  onCancelQueue?: () => Promise<void> | void;
}

function formatFacilityAddress(facility?: Partial<QueueFacility> | null) {
  if (!facility) return 'Facility address unavailable';
  const line = facility.address_line1 || (facility as any).address;
  const parts = [line, facility.city, facility.state, facility.postal_code].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Facility address unavailable';
}

function normalizePhone(value?: string | null) {
  if (!value || value === 'N/A') return '';
  return String(value).replace(/[^\d+]/g, '');
}

export function PatientQueue({ patientData, triageData, selectedFacility, queueEntry, onCancelQueue }: PatientQueueProps) {
  const [currentQueue, setCurrentQueue] = useState<PatientQueueEntry | null>(queueEntry ?? null);
  const [facility, setFacility] = useState<QueueFacility | any | null>(selectedFacility ?? null);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [nowServing, setNowServing] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    setCurrentQueue(queueEntry ?? null);
  }, [queueEntry]);

  useEffect(() => {
    setFacility(selectedFacility ?? null);
  }, [selectedFacility]);

  const loadQueueStatus = async () => {
    if (!currentQueue?.id && !queueEntry?.id) return;
    const id = currentQueue?.id || queueEntry?.id;
    if (!id) return;
    if (String(id).startsWith('local-')) {
      setFacility(selectedFacility ?? facility);
      const localQueueNumber = currentQueue?.queue_number || queueEntry?.queue_number || 1;
      setPeopleAhead(0);
      setNowServing(localQueueNumber);
      return;
    }

    setLoading(true);
    setLoadError('');

    try {
      const status = await fetchPatientQueueStatus(id);
      setCurrentQueue(status.queue);
      setFacility(status.facility);
      setPeopleAhead(status.peopleAhead);
      setNowServing(status.nowServing);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to refresh queue status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQueueStatus();
    const interval = window.setInterval(() => {
      void loadQueueStatus();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [queueEntry?.id]);

  const priority = currentQueue?.priority || triageData?.priority || 'P3';
  const priorityLabel = currentQueue?.priority_label || triageData?.priorityLabel || 'Standard';
  const queueNumber = currentQueue?.queue_number ?? null;
  const estimatedWait = currentQueue?.estimated_wait_minutes ?? null;
  const checkInTime = currentQueue?.check_in_at
    ? new Date(currentQueue.check_in_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
    : 'Pending';
  const queueDate = currentQueue?.queue_date || new Date().toISOString().slice(0, 10);
  const progress = useMemo(() => {
    if (!queueNumber || queueNumber <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round(((queueNumber - peopleAhead) / queueNumber) * 100)));
  }, [peopleAhead, queueNumber]);

  const getPriorityColor = (value: string) => {
    switch (value) {
      case 'P1':
        return 'text-red-700 bg-red-100';
      case 'P2':
        return 'text-amber-700 bg-amber-100';
      case 'P3':
        return 'text-emerald-700 bg-emerald-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const primaryPhone = facility?.phone || selectedFacility?.phone || '';
  const emergencyPhone = facility?.emergency_hotline || selectedFacility?.emergencyHotline || '911';
  const phoneHref = normalizePhone(primaryPhone);
  const emergencyHref = normalizePhone(emergencyPhone) || '911';
  const handleCancel = async () => {
    if (!onCancelQueue) return;
    setCanceling(true);
    try {
      await onCancelQueue();
    } finally {
      setCanceling(false);
    }
  };

  if (!currentQueue) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-xl font-bold mb-2">No active queue yet</h2>
          <p className="text-sm">
            Select a facility after symptom triage to create your queue number for that facility.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Virtual Queue</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Queue details for {facility?.name || selectedFacility?.name || 'selected facility'}
          </p>
        </div>
        <button
          type="button"
          onClick={loadQueueStatus}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white mb-4 sm:mb-6 shadow-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-blue-100 mb-2 text-sm sm:text-base">Your Queue Number</p>
          <div className="text-6xl sm:text-7xl font-bold mb-3">#{queueNumber}</div>
          <div className={`inline-block px-4 py-2 rounded-full ${getPriorityColor(priority)} font-semibold text-sm sm:text-base shadow-lg`}>
            {priorityLabel} Priority
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
            <div className="text-2xl sm:text-4xl font-bold">
              {estimatedWait ?? '--'}<span className="text-lg sm:text-2xl">m</span>
            </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Checked In</h3>
              <p className="text-xs sm:text-sm text-gray-600">Status: {currentQueue.status.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Queue Date</h3>
              <p className="text-xs sm:text-sm text-gray-600">{queueDate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Patient Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium text-gray-900">{patientData?.name || 'Guest'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Patient ID</p>
            <p className="font-medium text-gray-900">{patientData?.patientCode || patientData?.id || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Check-in Time</p>
            <p className="font-medium text-gray-900">{checkInTime}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Priority Level</p>
            <p className="font-medium text-gray-900">{priorityLabel}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Facility Information</h3>
        <div className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-gray-900 font-medium">{facility?.name || selectedFacility?.name || 'Selected facility'}</span>
            {facility?.rating && <span className="text-sm text-blue-600 font-medium">Rating {facility.rating}</span>}
          </div>
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <span className="text-sm">{formatFacilityAddress(facility || selectedFacility)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Primary Phone</span>
            {phoneHref ? (
              <a href={`tel:${phoneHref}`} className="text-sm text-blue-600 font-medium">{primaryPhone}</a>
            ) : (
              <span className="text-sm text-gray-500">N/A</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Emergency Hotline</span>
            <a href={`tel:${emergencyHref}`} className="text-sm text-red-600 font-semibold">{emergencyPhone}</a>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">What to Do Next</p>
            <p>
              Go to {facility?.name || selectedFacility?.name || 'the selected facility'} when there are 2-3 people ahead of you.
              Refresh this page for the latest queue count.
            </p>
          </div>
        </div>

        {peopleAhead <= 2 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 animate-pulse">
            <TrendingUp className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-semibold mb-1">Almost Your Turn</p>
              <p>Please make your way to the facility now. Only {peopleAhead} patient{peopleAhead !== 1 ? 's' : ''} ahead of you.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <a
          href={phoneHref ? `tel:${phoneHref}` : `tel:${emergencyHref}`}
          className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-98 transition-transform shadow-lg text-center"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Facility
          </span>
        </a>
        {onCancelQueue && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={canceling}
            className="flex-1 py-4 rounded-xl border border-red-200 bg-white text-red-700 font-semibold hover:bg-red-50 active:scale-98 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5" />
              {canceling ? 'Cancelling...' : 'Cancel Appointment'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
