import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Building2,
  Clock,
  AlertTriangle,
  Search,
  QrCode,
  Upload,
  Camera,
  LogOut,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Download,
  Droplets,
  FileText,
  CheckCheck,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Pill,
  Timer,
  Users,
  Stethoscope,
  Edit3,
} from 'lucide-react';
import jsQR from 'jsqr';
import { FilCareLogo } from './FilCareLogo';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
  fetchPatientByQrValue,
  fetchPatientById,
  fetchProviderQueueDashboard,
  fetchQueueEntries,
  deleteQueueEntry,
  updatePatientVitals,
  fetchPatientMedicalRecords,
  fetchDoctorIdentity,
  resolveDoctorQueueAccess,
  type ProviderQueueDashboardRow,
  type QueueEntryDashboardRow,
  type RegisteredPatientRow,
  type PatientMedicalRecordRow,
  type DoctorIdentity,
  type DoctorQueueAccess,
  type QueueFacility,
} from '../lib/supabaseAuth';

interface DoctorDashboardProps {
  onBack: () => void;
}

type Priority = 'P1' | 'P2' | 'P3';

interface Patient {
  id: string;
  queueEntryId?: string;
  patientId?: string;
  patientCode?: string;
  facilityId?: string;
  queueDate?: string;
  name: string;
  age: number;
  gender: string;
  priority: Priority;
  symptoms: string[];
  queueNumber: number;
  waitTime: string;
  location: string;
  phone: string;
  dob: string;
  bloodType: string;
  allergies: string[];
  currentVitals: {
    bp: string;
    hr: string;
    temp: string;
    spo2: string;
  };
  medicalHistory: Array<{ date: string; diagnosis: string; doctor: string }>;
  chiefComplaint: string;
  arrivalTime: string;
  status: 'waiting' | 'in-progress' | 'completed';
}

const PRIORITY_CONFIG: Record<
  Priority,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: typeof AlertCircle;
  }
> = {
  P1: {
    label: 'Immediate',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertCircle,
  },
  P2: {
    label: 'Urgent',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertTriangle,
  },
  P3: {
    label: 'Non-Urgent',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
};

type ModalType = 'see-patient' | 'view-records' | 'mark-complete' | 'edit-vitals' | null;

const COMPLETION_BONUS_PREFIX = 'filcare-doctor-completion-bonus';

function getCompletionBonusKey(queueDate: string) {
  return `${COMPLETION_BONUS_PREFIX}:${queueDate}`;
}

function readCompletionBonus(queueDate: string): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(getCompletionBonusKey(queueDate));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeCompletionBonus(queueDate: string, value: Record<string, number>) {
  window.localStorage.setItem(getCompletionBonusKey(queueDate), JSON.stringify(value));
}

function VitalChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-blue-50 rounded-xl px-4 py-3 gap-0.5">
      <span className="text-xs text-blue-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-blue-900">{value}</span>
    </div>
  );
}

function parseAllergiesText(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item)).filter(Boolean);
  } catch {
    // fall through to comma parsing
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDateTime(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateOnly(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function calculateAge(value?: string | null) {
  if (!value) return 0;
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return Math.max(0, age);
}

function mapMedicalHistory(records: PatientMedicalRecordRow[], queueVisit?: Patient['medicalHistory'][number]) {
  const history = records.map((record) => ({
    date: formatDateTime(record.created_at || record.record_date),
    diagnosis: record.description || record.title || record.category,
    doctor: [record.provider_name, record.facility_name].filter(Boolean).join(' @ ') || 'FilCare Record',
  }));

  if (queueVisit) {
    history.unshift(queueVisit);
  }

  return history;
}

function getPatientLookupKey(patient: Patient) {
  return patient.patientId || patient.patientCode || patient.id;
}

function SeePatientModal({ patient, onAction }: { patient: Patient; onAction: (type: ModalType, patient: Patient) => void }) {
  const [resolvedPatient, setResolvedPatient] = useState(patient);
  const [loadingPatient, setLoadingPatient] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoadingPatient(true);

    const loadPatient = async () => {
      const lookupId = patient.patientId;
      const lookupKey = getPatientLookupKey(patient);
      if (!lookupId && !lookupKey) {
        if (isMounted) {
          setResolvedPatient(patient);
          setLoadingPatient(false);
        }
        return;
      }

      try {
        const record = lookupId ? await fetchPatientById(lookupId) : await fetchPatientByQrValue(lookupKey);
        if (!isMounted) return;

        if (!record) {
          setResolvedPatient(patient);
          return;
        }

        setResolvedPatient({
          ...patient,
          id: record.patient_code || record.id || patient.id,
          patientId: record.id,
          patientCode: record.patient_code || patient.patientCode,
          name: record.full_name || patient.name,
          age: calculateAge(record.date_of_birth),
          gender: record.gender ? String(record.gender).replace(/^./, (c) => c.toUpperCase()) : patient.gender,
          dob: formatDateOnly(record.date_of_birth),
          bloodType: record.blood_type || patient.bloodType,
          allergies: parseAllergiesText(record.allergies),
          phone: record.phone || patient.phone,
          currentVitals: {
            bp: record.bp || patient.currentVitals.bp,
            hr: record.hr || patient.currentVitals.hr,
            temp: record.temp || patient.currentVitals.temp,
            spo2: record.spo2 || patient.currentVitals.spo2,
          },
        });
      } catch {
        if (isMounted) {
          setResolvedPatient(patient);
        }
      } finally {
        if (isMounted) {
          setLoadingPatient(false);
        }
      }
    };

    void loadPatient();
    return () => {
      isMounted = false;
    };
  }, [patient]);

  const cfg = PRIORITY_CONFIG[resolvedPatient.priority];
  const PriorityIcon = cfg.icon;

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-blue-900">
          <Stethoscope className="w-5 h-5 text-blue-600" />
          Patient Overview
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {resolvedPatient.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-blue-900 leading-tight">{resolvedPatient.name}</h3>
            <p className="text-sm text-muted-foreground">
              {loadingPatient ? 'Loading patient profile...' : `${resolvedPatient.age} y/o - ${resolvedPatient.gender} - DOB ${resolvedPatient.dob}`}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{resolvedPatient.id}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.border} border`}>
            <PriorityIcon className={`w-4 h-4 ${cfg.color}`} />
            <span className={`text-xs font-semibold ${cfg.color}`}>
              {resolvedPatient.priority} - {cfg.label}
            </span>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Chief Complaint</p>
          <p className="text-sm text-foreground leading-relaxed bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            {resolvedPatient.chiefComplaint}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Symptoms</p>
          <div className="flex flex-wrap gap-2">
            {resolvedPatient.symptoms.map((s) => (
              <span key={s} className={`text-xs px-3 py-1 rounded-full font-medium ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Vitals</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction('edit-vitals', resolvedPatient)}
              className="h-6 px-2 text-xs"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <VitalChip label="BP" value={resolvedPatient.currentVitals.bp} />
            <VitalChip label="HR" value={resolvedPatient.currentVitals.hr} />
            <VitalChip label="Temp" value={resolvedPatient.currentVitals.temp} />
            <VitalChip label="SpO2" value={resolvedPatient.currentVitals.spo2} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{resolvedPatient.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Arrived {resolvedPatient.arrivalTime}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{resolvedPatient.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <QrCode className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Queue #{resolvedPatient.queueNumber} - {resolvedPatient.waitTime}</span>
          </div>
        </div>

        {resolvedPatient.allergies.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1.5">Allergies</p>
            <div className="flex flex-wrap gap-2">
              {resolvedPatient.allergies.map((a) => (
                <span key={a} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

function ViewRecordsModal({ patient }: { patient: Patient }) {
  const [resolvedPatient, setResolvedPatient] = useState(patient);
  const [medicalHistory, setMedicalHistory] = useState<Patient['medicalHistory']>(patient.medicalHistory);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError(null);

    const loadRecords = async () => {
      const lookupId = patient.patientId;
      const lookupKey = getPatientLookupKey(patient);
      if (!lookupId && !lookupKey) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const [record, records] = await Promise.all([
          lookupId ? fetchPatientById(lookupId) : fetchPatientByQrValue(lookupKey),
          fetchPatientMedicalRecords({
            patientIdOrCode: lookupId || lookupKey,
            facilityId: patient.facilityId || null,
          }),
        ]);

        if (!isMounted) return;

        const resolvedProfile = record
          ? {
              ...patient,
              id: record.patient_code || record.id || patient.id,
              patientId: record.id,
              patientCode: record.patient_code || patient.patientCode,
              name: record.full_name || patient.name,
              age: calculateAge(record.date_of_birth),
              gender: record.gender ? String(record.gender).replace(/^./, (c) => c.toUpperCase()) : patient.gender,
              dob: formatDateOnly(record.date_of_birth),
              bloodType: record.blood_type || patient.bloodType,
              allergies: parseAllergiesText(record.allergies),
              phone: record.phone || patient.phone,
              currentVitals: {
                bp: record.bp || patient.currentVitals.bp,
                hr: record.hr || patient.currentVitals.hr,
                temp: record.temp || patient.currentVitals.temp,
                spo2: record.spo2 || patient.currentVitals.spo2,
              },
            }
          : patient;

        const queueVisit =
          resolvedProfile.queueDate || resolvedProfile.arrivalTime
            ? {
                date: `${resolvedProfile.queueDate ? formatDateOnly(resolvedProfile.queueDate) : 'Today'}${resolvedProfile.arrivalTime ? ` ${resolvedProfile.arrivalTime}` : ''}`,
                diagnosis: `Queue visit at ${resolvedProfile.location}`,
                doctor: resolvedProfile.chiefComplaint || 'Current facility visit',
              }
            : undefined;

        setResolvedPatient(resolvedProfile);
        setMedicalHistory(mapMedicalHistory(records, queueVisit));
      } catch (error) {
        if (!isMounted) return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load patient records.');
        setResolvedPatient(patient);
        setMedicalHistory(patient.medicalHistory);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadRecords();
    return () => {
      isMounted = false;
    };
  }, [patient]);

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-blue-900">
          <FileText className="w-5 h-5 text-blue-600" />
          Medical Records
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {resolvedPatient.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-blue-900 text-sm">{resolvedPatient.name}</p>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading patient history...' : `${resolvedPatient.age} y/o - ${resolvedPatient.gender} - Blood type: ${resolvedPatient.bloodType}`}
            </p>
          </div>
        </div>

        {loadError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-500 uppercase tracking-wide font-medium mb-0.5">Blood Type</p>
            <p className="text-sm font-semibold text-blue-900">{resolvedPatient.bloodType}</p>
          </div>
          <div className="bg-blue-50 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-500 uppercase tracking-wide font-medium mb-0.5">Date of Birth</p>
            <p className="text-sm font-semibold text-blue-900">{resolvedPatient.dob}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Known Allergies</p>
          <div className="flex flex-wrap gap-2">
            {resolvedPatient.allergies.length > 0 ? (
              resolvedPatient.allergies.map((a) => (
                <span key={a} className="text-xs px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full font-medium">
                  {a}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No allergies recorded.</p>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Visit History</p>
          <div className="space-y-3">
            {medicalHistory.length > 0 ? (
              medicalHistory.map((h, i) => (
                <div key={`${h.date}-${i}`} className="flex gap-3 items-start group">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                    {i < medicalHistory.length - 1 && (
                      <div className="w-px h-full bg-blue-100 flex-1" style={{ minHeight: 20 }} />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{h.diagnosis}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{h.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{h.doctor}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No visit history found for this facility yet.</p>
            )}
          </div>
        </div>

        <div className="border border-dashed border-blue-200 rounded-xl px-4 py-4 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <QrCode className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Patient QR Code</p>
            <p className="text-xs text-muted-foreground mt-0.5">Scan to verify identity and access complete record</p>
            <p className="text-xs font-mono text-blue-500 mt-1">{resolvedPatient.id}</p>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}function MarkCompleteModal({
  patient,
  onClose,
  onConfirm,
}: {
  patient: Patient;
  onClose: () => void;
  onConfirm: (queueEntryId: string) => void;
}) {
  const cfg = PRIORITY_CONFIG[patient.priority];
  const PriorityIcon = cfg.icon;

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-blue-900">
          <CheckCheck className="w-5 h-5 text-emerald-600" />
          Mark as Completed
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5">
        <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {patient.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-emerald-900">{patient.name}</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              {patient.age} y/o · Queue #{patient.queueNumber}
            </p>
            <div className={`flex items-center gap-1 mt-1.5 w-fit px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.border} border`}>
              <PriorityIcon className={`w-3 h-3 ${cfg.color}`} />
              <span className={`text-xs font-semibold ${cfg.color}`}>
                {patient.priority} · {cfg.label}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-foreground">
            Confirm that <span className="font-semibold">{patient.name}</span>&apos;s visit has been completed and their
            queue entry will be removed from Supabase.
          </p>
          <p className="text-xs text-muted-foreground">
            This will delete queue entry <span className="font-mono">{patient.queueEntryId || patient.id}</span> and remove them from the active patient list.
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            onClick={() => {
              onConfirm(patient.queueEntryId || patient.id);
              onClose();
            }}
          >
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Confirm Complete
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

function EditVitalsModal({
  patient,
  onClose,
  onSave,
}: {
  patient: Patient;
  onClose: () => void;
  onSave: (id: string, vitals: Patient['currentVitals']) => Promise<void>;
}) {
  const [vitals, setVitals] = useState(patient.currentVitals);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const formatBloodPressure = (value: string) => {
    // Allow numbers, slash, and spaces
    const cleaned = value.replace(/[^0-9/\s]/g, '');
    return cleaned;
  };

  const formatHeartRate = (value: string) => {
    // Extract numbers only and add "bpm"
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? `${numbers} bpm` : '';
  };

  const formatTemperature = (value: string) => {
    // Extract numbers and decimal point, add "°C"
    const numbers = value.replace(/[^0-9.]/g, '');
    return numbers ? `${numbers}°C` : '';
  };

  const formatOxygenSaturation = (value: string) => {
    // Extract numbers only and add "%"
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? `${numbers}%` : '';
  };

  const handleSave = () => {
    setIsSaving(true);
    setSaveError('');
    onSave(patient.id, vitals)
      .catch((error) => {
        setSaveError(error instanceof Error ? error.message : 'Unable to save vitals.');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-blue-900">
          <Stethoscope className="w-5 h-5 text-blue-600" />
          Edit Vitals - {patient.name}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {saveError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
            <input
              type="text"
              value={vitals.bp}
              onChange={(e) => setVitals({ ...vitals, bp: formatBloodPressure(e.target.value) })}
              placeholder="120/80"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate</label>
            <input
              type="text"
              value={vitals.hr}
              onChange={(e) => setVitals({ ...vitals, hr: formatHeartRate(e.target.value) })}
              placeholder="72 bpm"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <input
              type="text"
              value={vitals.temp}
              onChange={(e) => setVitals({ ...vitals, temp: formatTemperature(e.target.value) })}
              placeholder="36.5°C"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SpO₂</label>
            <input
              type="text"
              value={vitals.spo2}
              onChange={(e) => setVitals({ ...vitals, spo2: formatOxygenSaturation(e.target.value) })}
              placeholder="98%"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Vitals'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

function PatientCard({
  patient,
  onAction,
  isRemoving = false,
}: {
  patient: Patient;
  onAction: (type: ModalType, patient: Patient) => void;
  isRemoving?: boolean;
}) {
  const cfg = PRIORITY_CONFIG[patient.priority];
  const isCompleted = patient.status === 'completed';
  const isInProgress = patient.status === 'in-progress';

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isRemoving
          ? 'opacity-0 -translate-x-6 max-h-0 p-0 m-0'
          : 'opacity-100 translate-x-0 max-h-[1500px]'
      }`}
    >
      <div
        className={`bg-white rounded-xl border-2 ${
          isInProgress ? 'border-blue-500 shadow-lg' : cfg.border
        } p-4 hover:shadow-lg active:scale-[0.99] transition-all sm:p-5 ${
          !isCompleted ? 'cursor-pointer' : 'opacity-50'
        }`}
      >
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div
            className={`${cfg.bg} flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white sm:h-16 sm:w-16 sm:text-xl`}
            style={{
              backgroundColor:
                patient.priority === 'P1'
                  ? '#ef4444'
                  : patient.priority === 'P2'
                    ? '#f59e0b'
                    : '#10b981',
            }}
          >
            #{patient.queueNumber}
          </div>
          <div className="min-w-0">
            <h3 className="mb-1 truncate text-lg font-semibold text-gray-900 sm:text-xl">{patient.name}</h3>
            <p className="mb-2 text-sm text-gray-600 sm:text-base">
              {patient.age} years old · Blood Type: {patient.bloodType}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.color}`}>
                {patient.priority} - {cfg.label}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  isInProgress ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {patient.status === 'completed' ? 'Completed' : patient.status === 'in-progress' ? 'In Progress' : 'Waiting'}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-left sm:block sm:bg-transparent sm:p-0 sm:text-right">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500 sm:text-sm sm:normal-case">Check-in</p>
            <p className="font-medium text-gray-900">{patient.arrivalTime}</p>
          </div>
          <div className="sm:mt-2">
            <p className="text-xs font-medium uppercase text-gray-500 sm:text-sm sm:normal-case">Wait Time</p>
            <p className="font-medium text-gray-900">{patient.waitTime}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
        <div>
          <p className="mb-1 font-medium text-gray-500">Facility</p>
          <p className="font-semibold text-gray-900">{patient.location}</p>
        </div>
        <div>
          <p className="mb-1 font-medium text-gray-500">Reported Symptoms</p>
          <p className="text-gray-900">{patient.symptoms.join(', ')}</p>
        </div>
      </div>

      {!isCompleted && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            onClick={() => onAction('see-patient', patient)}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-98 font-medium shadow-lg transition-transform"
          >
            See Patient
          </button>
          <button
            onClick={() => onAction('view-records', patient)}
            className="sm:flex-none px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:scale-98 transition-transform"
          >
            <span className="hidden sm:inline">View Records</span>
            <span className="sm:hidden">Records</span>
          </button>
          <button
            onClick={() => onAction('mark-complete', patient)}
            className="sm:flex-none px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:scale-98 transition-transform"
          >
            <span className="hidden sm:inline">Mark Complete</span>
            <span className="sm:hidden">Complete</span>
          </button>
        </div>
      )}
      </div>
    </div>
  );
}


export function DoctorDashboard({ onBack }: DoctorDashboardProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [removingPatientIds, setRemovingPatientIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'patients' | 'analytics'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('Waiting to start scanner.');
  const [scannerError, setScannerError] = useState('');
  const [scannedPayload, setScannedPayload] = useState<any>(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [queueDate, setQueueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [doctorAccess, setDoctorAccess] = useState<DoctorQueueAccess | null>(null);
  const [doctorIdentity, setDoctorIdentity] = useState<DoctorIdentity | null>(null);
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [completionBonusByFacility, setCompletionBonusByFacility] = useState<Record<string, number>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scannerIntervalRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setCompletionBonusByFacility(readCompletionBonus(queueDate));
  }, [queueDate]);

  const fetchPatients = useCallback(async () => {
    setLoadingPatients(true);
    setFetchError(null);

    try {
      const access = await resolveDoctorQueueAccess();
      setDoctorAccess(access);

      const formatArrivalTime = (checkInAt: string | null) => {
        if (!checkInAt) return 'N/A';
        const date = new Date(checkInAt);
        if (Number.isNaN(date.getTime())) return 'N/A';
        return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
      };

      const mapStatus = (status: string): Patient['status'] => {
        if (status === 'completed') return 'completed';
        if (status === 'called' || status === 'in-progress' || status === 'in_consultation') return 'in-progress';
        return 'waiting';
      };

      const parseSymptoms = (symptomsText: string | null) => {
        if (!symptomsText) return ['No symptoms recorded'];
        return symptomsText
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 8);
      };

      const parseAllergies = (value: string | null | undefined) => {
        if (!value) return [];
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed.map((item) => String(item));
        } catch {
          return value.split(',').map((item) => item.trim()).filter(Boolean);
        }
        return [];
      };

      const formatAge = (dateOfBirth?: string | null) => {
        if (!dateOfBirth) return 0;
        const dob = new Date(dateOfBirth);
        if (Number.isNaN(dob.getTime())) return 0;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
        return age;
      };

      const formatDate = (dateOfBirth?: string | null) => {
        if (!dateOfBirth) return 'N/A';
        const date = new Date(dateOfBirth);
        if (Number.isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      };

      const toQueuePatient = (row: QueueEntryDashboardRow): Patient => {
        const patient = row.patients;
        const triage = row.symptom_triage_assessments;
        const waitTime =
          row.status === 'completed'
            ? 'Completed'
            : row.estimated_wait_minutes === null
              ? 'Pending'
              : row.estimated_wait_minutes <= 0
                ? 'Now'
                : `~${row.estimated_wait_minutes} min`;

        return {
          id: patient?.patient_code || row.id,
          queueEntryId: row.id,
          patientId: row.patient_id || patient?.id || undefined,
          patientCode: patient?.patient_code || undefined,
          facilityId: row.facility_id,
          queueDate: row.queue_date,
          name: patient?.full_name || 'Unknown Patient',
          age: formatAge(patient?.date_of_birth),
          gender: patient?.gender ? String(patient.gender).replace(/^./, (c) => c.toUpperCase()) : 'Unknown',
          priority: row.priority,
          symptoms: parseSymptoms(triage?.symptoms_text || null),
          queueNumber: row.queue_number,
          waitTime,
          location: row.facilities?.name || 'Facility not set',
          phone: patient?.phone || 'N/A',
          dob: formatDate(patient?.date_of_birth),
          bloodType: patient?.blood_type || 'N/A',
          allergies: parseAllergies(patient?.allergies),
          currentVitals: {
            bp: patient?.bp || 'N/A',
            hr: patient?.hr || 'N/A',
            temp: patient?.temp || 'N/A',
            spo2: patient?.spo2 || 'N/A',
          },
          medicalHistory: [],
          chiefComplaint: triage?.recommendation || triage?.symptoms_text || 'No complaint registered',
          arrivalTime: formatArrivalTime(row.check_in_at),
          status: mapStatus(row.status),
        };
      };

      const toViewPatient = (row: ProviderQueueDashboardRow): Patient => {
        const waitTime =
          row.status === 'completed'
            ? 'Completed'
            : row.estimated_wait_minutes === null
              ? 'Pending'
              : row.estimated_wait_minutes <= 0
                ? 'Now'
                : `~${row.estimated_wait_minutes} min`;

        return {
          id: row.patient_code || row.id,
          queueEntryId: row.id,
          patientCode: row.patient_code || undefined,
          queueDate: row.queue_date,
          name: row.patient_name || 'Unknown Patient',
          age: 0,
          gender: row.gender ? String(row.gender).replace(/^./, (c) => c.toUpperCase()) : 'Unknown',
          priority: row.priority,
          symptoms: parseSymptoms(row.symptoms_text),
          queueNumber: row.queue_number,
          waitTime,
          location: row.facility_name || 'Facility not set',
          phone: 'N/A',
          dob: 'N/A',
          bloodType: row.blood_type || 'N/A',
          allergies: [],
          currentVitals: {
            bp: 'N/A',
            hr: 'N/A',
            temp: 'N/A',
            spo2: 'N/A',
          },
          medicalHistory: [],
          chiefComplaint: row.recommendation || row.symptoms_text || 'No complaint registered',
          arrivalTime: formatArrivalTime(row.check_in_at),
          status: mapStatus(row.status),
        };
      };

      const enrichPatientDetails = async (patient: Patient): Promise<Patient> => {
        const lookupId = patient.patientId;
        const lookupKey = patient.patientCode || patient.id;

        try {
          const record = lookupId ? await fetchPatientById(lookupId) : await fetchPatientByQrValue(lookupKey);
          if (!record) return patient;

          return {
            ...patient,
            id: record.patient_code || record.id || patient.id,
            patientId: record.id || patient.patientId,
            patientCode: record.patient_code || patient.patientCode,
            name: record.full_name || patient.name,
            age: calculateAge(record.date_of_birth),
            gender: record.gender ? String(record.gender).replace(/^./, (c) => c.toUpperCase()) : patient.gender,
            dob: formatDate(record.date_of_birth),
            bloodType: record.blood_type || patient.bloodType,
            allergies: parseAllergies(record.allergies),
            phone: record.phone || patient.phone,
          };
        } catch {
          return patient;
        }
      };

      const facilityId = access.scope === 'facility'
        ? access.facilityId
        : facilityFilter !== 'all'
          ? facilityFilter
          : null;
      const selectedFacility = facilityId
        ? access.availableFacilities.find((facility) => facility.id === facilityId) || null
        : null;

      try {
        const queueRows = await fetchQueueEntries({
          queueDate,
          ...(facilityId ? { facilityId } : {}),
        });
        const queuePatients = await Promise.all(queueRows.map(async (row) => enrichPatientDetails(toQueuePatient(row))));
        setPatients(queuePatients);
      } catch (_directQueueError) {
        const viewRows = await fetchProviderQueueDashboard(queueDate);
        const filteredRows =
          access.scope === 'facility' && selectedFacility
            ? viewRows.filter((row) => row.facility_name === selectedFacility.name)
            : facilityId
              ? viewRows.filter((row) => row.facility_name === selectedFacility?.name)
              : viewRows;

        const viewPatients = await Promise.all(filteredRows.map(async (row) => enrichPatientDetails(toViewPatient(row))));
        setPatients(viewPatients);
      }
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : 'Unable to load queue entries.'
      );
    } finally {
      setLoadingPatients(false);
    }
  }, [queueDate, facilityFilter]);

  useEffect(() => {
    fetchPatients();
    const handleWindowFocus = () => fetchPatients();
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [fetchPatients]);

  useEffect(() => {
    if (doctorAccess?.scope === 'facility' && doctorAccess.facilityId) {
      setFacilityFilter(doctorAccess.facilityId);
    } else if (doctorAccess?.scope === 'all' && facilityFilter !== 'all') {
      const stillAvailable = doctorAccess.availableFacilities.some((facility) => facility.id === facilityFilter);
      if (!stillAvailable) {
        setFacilityFilter('all');
      }
    }
  }, [doctorAccess, facilityFilter]);

  useEffect(() => {
    let isMounted = true;
    void fetchDoctorIdentity().then((identity) => {
      if (isMounted) {
        setDoctorIdentity(identity);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAction = (type: ModalType, patient: Patient) => {
    setSelectedPatient(patient);
    setActiveModal(type);
  };

  const handleMarkComplete = async (queueEntryId: string) => {
    const patient = patients.find((p) => p.queueEntryId === queueEntryId);
    if (!patient) {
      setActionError('Could not find that queue entry in the current list.');
      closeModal();
      return;
    }

    if (!patient.queueEntryId) {
      setActionError('This patient does not have a queue entry to update.');
      closeModal();
      return;
    }

    setActionError(null);
    try {
      await deleteQueueEntry(patient.queueEntryId);
      const bonusKey = patient.facilityId || facilityFilter || 'all';
      setCompletionBonusByFacility((prev) => {
        const next = {
          ...prev,
          [bonusKey]: (prev[bonusKey] || 0) + 1,
        };
        writeCompletionBonus(queueDate, next);
        return next;
      });
      setRemovingPatientIds((prev) => [...prev, patient.id]);
      window.setTimeout(() => {
        setPatients((prev) => prev.filter((p) => p.queueEntryId !== queueEntryId));
        setRemovingPatientIds((prev) => prev.filter((patientId) => patientId !== patient.id));
      }, 280);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete queue entry.');
    } finally {
      closeModal();
    }
  };

  const handleSaveVitals = async (id: string, vitals: Patient['currentVitals']) => {
    setActionError(null);
    await updatePatientVitals({
      patientId: id,
      vitals,
    });

    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, currentVitals: vitals } : p))
    );

    setSelectedPatient((current) =>
      current && current.id === id
        ? {
            ...current,
            currentVitals: vitals,
          }
        : current
    );
    setActiveModal('see-patient');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedPatient(null);
  };

  const formatField = (value: unknown) => {
    if (value === null || value === undefined || String(value).trim() === '') return 'N/A';
    return String(value);
  };

  const initialsFromName = (name: unknown) => {
    const formattedName = formatField(name);
    if (formattedName === 'N/A') return 'PT';
    return formattedName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const scannedRecordField = (
    label: string,
    value: unknown,
    Icon: typeof QrCode,
    options: { span?: boolean; emphasis?: boolean; alert?: boolean } = {}
  ) => (
    <div
      className={`rounded-lg border bg-white px-4 py-3 ${
        options.alert
          ? 'border-red-100 bg-red-50'
          : options.emphasis
            ? 'border-blue-100 bg-blue-50'
            : 'border-slate-200'
      } ${options.span ? 'sm:col-span-2' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            options.alert
              ? 'bg-red-100 text-red-700'
              : options.emphasis
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
          <p className={`mt-1 break-words text-sm ${options.alert ? 'font-semibold text-red-800' : 'font-medium text-slate-900'}`}>
            {formatField(value)}
          </p>
        </div>
      </div>
    </div>
  );

  const normalizeScannedPayload = (payload: any) => {
    const firstName = payload.firstName ?? payload.first_name ?? '';
    const lastName = payload.lastName ?? payload.last_name ?? '';
    const name = payload.name ?? payload.fullName ?? payload.full_name ?? [firstName, lastName].filter(Boolean).join(' ');
    const streetAddress = payload.address ?? '';
    const city = payload.city ?? '';
    const zipCode = payload.zipCode ?? payload.zip_code ?? '';
    const address = streetAddress && !String(streetAddress).includes(String(city))
      ? [streetAddress, city, zipCode].filter(Boolean).join(', ')
      : streetAddress;

    return {
      id: payload.patientCode ?? payload.patient_code ?? payload.id ?? '',
      recordId: payload.id ?? '',
      qrToken: payload.qrToken ?? payload.qr_token ?? '',
      name,
      firstName,
      lastName,
      dateOfBirth: payload.dateOfBirth ?? payload.date_of_birth ?? payload.dob ?? '',
      bloodType: payload.bloodType ?? payload.blood_type ?? '',
      gender: payload.gender ?? '',
      phone: payload.phone ?? '',
      email: payload.email ?? '',
      address,
      allergies: payload.allergies ?? '',
      medications: payload.medications ?? '',
      emergencyContact: payload.emergencyContact ?? payload.emergency_contact_name ?? '',
      emergencyPhone: payload.emergencyPhone ?? payload.emergency_contact_phone ?? '',
    };
  };

  const patientRowToScannedPayload = (row: RegisteredPatientRow) =>
    normalizeScannedPayload({
      id: row.id,
      patient_code: row.patient_code,
      full_name: row.full_name,
      first_name: row.first_name,
      last_name: row.last_name,
      date_of_birth: row.date_of_birth,
      gender: row.gender,
      phone: row.phone,
      blood_type: row.blood_type,
      allergies: row.allergies,
      medications: row.medications,
      emergency_contact_name: row.emergency_contact_name,
      emergency_contact_phone: row.emergency_contact_phone,
    });

  const downloadScannedRecord = () => {
    if (!scannedPayload) return;

    const lines = [
      'FILCARE PATIENT RECORD',
      '----------------------',
      `Record ID: ${formatField(scannedPayload.id)}`,
      `Full Name: ${formatField(scannedPayload.name)}`,
      `Date of Birth: ${formatField(scannedPayload.dob || scannedPayload.dateOfBirth)}`,
      `Blood Type: ${formatField(scannedPayload.bloodType)}`,
      `Gender: ${formatField(scannedPayload.gender)}`,
      `Phone: ${formatField(scannedPayload.phone)}`,
      `Email: ${formatField(scannedPayload.email)}`,
      `Address: ${formatField(scannedPayload.address)}`,
      `Allergies: ${formatField(scannedPayload.allergies)}`,
      `Current Medications: ${formatField(scannedPayload.medications)}`,
      `Emergency Contact: ${formatField(scannedPayload.emergencyContact)}`,
      `Emergency Phone: ${formatField(scannedPayload.emergencyPhone)}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileSafeName = formatField(scannedPayload.name).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.href = url;
    link.download = `patient_record_${fileSafeName || 'unknown'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const stopScanner = () => {
    if (scannerIntervalRef.current !== null) {
      window.clearInterval(scannerIntervalRef.current);
      scannerIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const parseScannedData = async (rawValue: string) => {
    const trimmedValue = rawValue.trim();

    try {
      const payload = JSON.parse(trimmedValue);
      setScannedPayload(normalizeScannedPayload(payload));
      setScannerStatus('QR code scanned successfully.');
      setScannerError('');
      setIsScannerOpen(false);
      stopScanner();
    } catch (_error) {
      try {
        const patient = await fetchPatientByQrValue(trimmedValue);
        if (!patient) {
          setScannerError('QR code scanned, but no matching patient record was found.');
          return;
        }

        setScannedPayload(patientRowToScannedPayload(patient));
        setScannerStatus('QR code scanned successfully.');
        setScannerError('');
        setIsScannerOpen(false);
        stopScanner();
      } catch (lookupError) {
        setScannerError(
          lookupError instanceof Error
            ? lookupError.message
            : 'Invalid QR payload format or patient lookup failed.'
        );
      }
    }
  };

  const scanImageSource = async (source: CanvasImageSource, width: number, height: number) => {
    if (!canvasRef.current || width <= 0 || height <= 0) {
      return false;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      return false;
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(source, 0, 0, width, height);

    const DetectorCtor = (window as any).BarcodeDetector as
      | (new (options?: { formats?: string[] }) => { detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>> })
      | undefined;
    if (DetectorCtor) {
      const detector = new DetectorCtor({ formats: ['qr_code'] });
      const results = await detector.detect(canvas);
      const rawValue = results[0]?.rawValue;
      if (rawValue) {
        await parseScannedData(rawValue);
        return true;
      }
    }

    const imageData = context.getImageData(0, 0, width, height);
    const jsqrResult = jsQR(imageData.data, imageData.width, imageData.height);
    if (jsqrResult?.data) {
      await parseScannedData(jsqrResult.data);
      return true;
    }

    return false;
  };

  const startCameraScanner = async () => {
    setScannerError('');
    setScannerStatus('Requesting camera access...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScannerStatus('Point the camera at the patient QR code.');

      scannerIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const width = videoRef.current.videoWidth;
          const height = videoRef.current.videoHeight;
          await scanImageSource(videoRef.current, width, height);
        } catch (_error) {
          // Continue polling until a readable QR is found.
        }
      }, 700);
    } catch (_error) {
      setScannerStatus('Camera unavailable.');
      setScannerError('Could not access the camera. Allow permission or upload a QR photo.');
    }
  };

  const handleUploadScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setScannerStatus('Scanning uploaded image...');
      setScannerError('');
      const imageBitmap = await createImageBitmap(file);
      const found = await scanImageSource(imageBitmap, imageBitmap.width, imageBitmap.height);
      imageBitmap.close();
      if (!found) {
        setScannerError('No QR code found. Try again with a clearer image.');
      }
    } catch (_error) {
      setScannerError('Could not process the uploaded image.');
    }
  };

  useEffect(() => {
    if (isScannerOpen) {
      startCameraScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isScannerOpen]);

  const queueFacilities: QueueFacility[] = doctorAccess?.availableFacilities ?? [];
  const selectedFacility = facilityFilter === 'all'
    ? null
    : queueFacilities.find((facility) => facility.id === facilityFilter) || null;
  const selectedFacilityName = selectedFacility?.name || doctorAccess?.facilityName || null;
  const isFacilityLocked = doctorAccess?.scope === 'facility';
  const queueScopeLabel = facilityFilter === 'all'
    ? (isFacilityLocked ? selectedFacilityName || doctorAccess?.facilityLabel || 'Assigned facility' : 'All Facilities')
    : selectedFacilityName || doctorAccess?.facilityLabel || 'Selected facility';

  const filteredPatients = patients
    .filter((p: Patient) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.queueNumber.toString().includes(searchQuery)
    )
    .filter((p: Patient) => {
      if (facilityFilter === 'all') return true;
      return p.facilityId === facilityFilter || p.location === selectedFacilityName || p.location === facilityFilter;
    })
    .filter((p: Patient) => (activeTab === 'queue' ? p.status !== 'completed' : true));

  const completionBonus = facilityFilter === 'all'
    ? Object.values(completionBonusByFacility).reduce((sum, value) => sum + value, 0)
    : completionBonusByFacility[facilityFilter] || 0;

  const activeQueueEntries = patients.filter((p) => p.status !== 'completed').length;
  const completedQueueEntries = patients.filter((p) => p.status === 'completed').length + completionBonus;
  const totalQueueEntries = activeQueueEntries + completedQueueEntries;
  const inProgressEntries = patients.filter((p) => p.status === 'in-progress').length;
  const waitingEntries = patients.filter((p) => p.status === 'waiting').length;
  const priorityCounts = {
    P1: patients.filter((p) => p.priority === 'P1').length,
    P2: patients.filter((p) => p.priority === 'P2').length,
    P3: patients.filter((p) => p.priority === 'P3').length,
  };
  const waitTimes = patients
    .map((p) => {
      const match = p.waitTime.match(/\d+/);
      return match ? Number(match[0]) : null;
    })
    .filter((value): value is number => value !== null);
  const averageWait = waitTimes.length > 0
    ? Math.round(waitTimes.reduce((sum, value) => sum + value, 0) / waitTimes.length)
    : 0;
  const longestWait = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
  const facilityBreakdown = Object.entries(
    patients.reduce<Record<string, number>>((acc, patient) => {
      acc[patient.location] = (acc[patient.location] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxFacilityCount = Math.max(1, ...facilityBreakdown.map(([, count]) => count));
  const genderBreakdown = Object.entries(
    patients.reduce<Record<string, number>>((acc, patient) => {
      const key = patient.gender || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const percentOfTotal = (count: number) => {
    if (totalQueueEntries === 0) return 0;
    return Math.round((count / totalQueueEntries) * 100);
  };
  const peakPriority = (Object.entries(priorityCounts) as Array<[Priority, number]>)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'P3';
  const queueLoadLabel =
    activeQueueEntries >= 12 ? 'High' : activeQueueEntries >= 6 ? 'Moderate' : activeQueueEntries > 0 ? 'Light' : 'Clear';
  const analyticsBar = (
    label: string,
    count: number,
    colorClass: string,
    subLabel?: string
  ) => (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-950">
          {count} <span className="font-normal text-slate-500">({percentOfTotal(count)}%)</span>
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${Math.max(percentOfTotal(count), count > 0 ? 4 : 0)}%` }}
        />
      </div>
      {subLabel && <p className="mt-1 text-xs text-slate-500">{subLabel}</p>}
    </div>
  );

  return (
    <div className="size-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FilCareLogo size="sm" showText={false} />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900">Doctor Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm sm:text-base font-semibold text-gray-900">{doctorIdentity?.fullName || doctorIdentity?.email || 'Doctor'}</p>
            </div>
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-700" />
            </button>
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
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-700">Queue Management</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    {queueScopeLabel}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Showing queue entries for the selected date. Access is scoped by the doctor&apos;s email domain.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] lg:min-w-[760px]">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Queue Date</span>
                    <input
                      type="date"
                      value={queueDate}
                      onChange={(event) => setQueueDate(event.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Facility</span>
                    <select
                      value={facilityFilter}
                      onChange={(event) => setFacilityFilter(event.target.value)}
                      disabled={isFacilityLocked}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {isFacilityLocked ? (
                        <option value={doctorAccess?.facilityId || 'all'}>{selectedFacilityName || doctorAccess?.facilityLabel || 'Assigned Facility'}</option>
                      ) : (
                        <>
                          <option value="all">All Facilities</option>
                          {queueFacilities.map((facility) => (
                            <option key={facility.id} value={facility.id}>{facility.name}</option>
                          ))}
                        </>
                      )}
                    </select>
                    {isFacilityLocked && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        This account is locked to {selectedFacilityName || doctorAccess?.facilityLabel || 'its assigned facility'}.
                      </p>
                    )}
                  </label>
                  <button
                    onClick={fetchPatients}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:self-end"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 sm:self-end"
                  >
                    <QrCode className="w-4 h-4" />
                    Scan QR
                  </button>
                </div>
              </div>

              {actionError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {actionError}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, facility, or queue number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center sm:w-auto">
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                  <p className="text-xs text-red-600">P1</p>
                  <p className="font-semibold text-red-700">{patients.filter((p) => p.priority === 'P1' && p.status !== 'completed').length}</p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                  <p className="text-xs text-amber-600">P2</p>
                  <p className="font-semibold text-amber-700">{patients.filter((p) => p.priority === 'P2' && p.status !== 'completed').length}</p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <p className="text-xs text-emerald-600">P3</p>
                  <p className="font-semibold text-emerald-700">{patients.filter((p) => p.priority === 'P3' && p.status !== 'completed').length}</p>
                </div>
              </div>
            </div>

            {/* Patient Cards */}
            {loadingPatients ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-600">
                Loading queued patients...
              </div>
            ) : fetchError ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
                {fetchError}
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-600">
                No queue entries found for {queueDate}
                {facilityFilter !== 'all' ? ` at ${queueScopeLabel}` : ''}. Complete symptom triage and refresh.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredPatients.map((patient: Patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onAction={handleAction}
                    isRemoving={removingPatientIds.includes(patient.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Scan Patient QR Code</h3>
            <p className="text-gray-600 mb-6">Use the QR scanner to quickly access patient medical records and history</p>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Open QR Scanner
            </button>
            {scannedPayload && (
              <div className="mt-8 max-w-4xl mx-auto overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
                        {initialsFromName(scannedPayload.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase text-blue-700">Verified QR Record</p>
                        <h4 className="mt-1 text-xl font-semibold text-slate-950">{formatField(scannedPayload.name)}</h4>
                        <p className="mt-1 text-sm font-mono text-slate-500">{formatField(scannedPayload.id)}</p>
                      </div>
                    </div>
                    <button
                      onClick={downloadScannedRecord}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4" />
                      Download Record
                    </button>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {scannedRecordField('Date of Birth', scannedPayload.dob || scannedPayload.dateOfBirth, CalendarDays, { emphasis: true })}
                    {scannedRecordField('Blood Type', scannedPayload.bloodType, Droplets, { emphasis: true })}
                    {scannedRecordField('Gender', scannedPayload.gender, IdCard, { emphasis: true })}
                  </div>

                  <div className="mt-6">
                    <h5 className="mb-3 text-sm font-semibold uppercase text-slate-700">Contact Information</h5>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {scannedRecordField('Phone Number', scannedPayload.phone, Phone)}
                      {scannedRecordField('Email Address', scannedPayload.email, Mail)}
                      {scannedRecordField('Home Address', scannedPayload.address, MapPin, { span: true })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h5 className="mb-3 text-sm font-semibold uppercase text-slate-700">Medical Notes</h5>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {scannedRecordField('Known Allergies', scannedPayload.allergies, AlertCircle, { alert: true })}
                      {scannedRecordField('Current Medications', scannedPayload.medications, Pill)}
                    </div>
                  </div>

                  <div className="mt-6 rounded-lg border border-red-100 bg-red-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-red-700" />
                      <h5 className="text-sm font-semibold uppercase text-red-800">Emergency Contact</h5>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase text-red-700/80">Contact Name</p>
                        <p className="mt-1 text-sm font-semibold text-red-950">{formatField(scannedPayload.emergencyContact)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-red-700/80">Contact Phone</p>
                        <p className="mt-1 text-sm font-semibold text-red-950">{formatField(scannedPayload.emergencyPhone)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-700">Operational Analytics</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                    {queueScopeLabel} · {queueDate}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Metrics are calculated from the currently loaded queue entries.
                  </p>
                </div>
                <button
                  onClick={fetchPatients}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Refresh Data
                </button>
              </div>
            </div>

            {fetchError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {fetchError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Queue Entries</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{totalQueueEntries}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">{activeQueueEntries} active, {completedQueueEntries} completed</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Average Wait</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{averageWait}<span className="text-base font-semibold text-slate-500"> min</span></p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
                    <Timer className="h-6 w-6" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">Longest listed wait: {longestWait} min</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Critical Load</p>
                    <p className="mt-2 text-3xl font-bold text-red-600">{priorityCounts.P1}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 text-red-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">Top priority group: {peakPriority}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Current Load</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{queueLoadLabel}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                    <Activity className="h-6 w-6" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">{waitingEntries} waiting, {inProgressEntries} in progress</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Priority Distribution</h3>
                    <p className="text-sm text-slate-500">Triage urgency across loaded entries</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-slate-400" />
                </div>
                <div className="space-y-5">
                  {analyticsBar('P1 · Immediate', priorityCounts.P1, 'bg-red-500', 'Emergency or potentially life-threatening')}
                  {analyticsBar('P2 · Urgent', priorityCounts.P2, 'bg-amber-400', 'Needs prompt provider attention')}
                  {analyticsBar('P3 · Non-Urgent', priorityCounts.P3, 'bg-emerald-500', 'Routine or standard queue')}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Queue Status</h3>
                    <p className="text-sm text-slate-500">Operational state for the selected date</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-slate-400" />
                </div>
                <div className="space-y-5">
                  {analyticsBar('Waiting', waitingEntries, 'bg-slate-500')}
                  {analyticsBar('In Progress', inProgressEntries, 'bg-blue-500')}
                  {analyticsBar('Completed', completedQueueEntries, 'bg-emerald-500')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 xl:col-span-2">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Facility Volume</h3>
                    <p className="text-sm text-slate-500">Queue share by facility</p>
                  </div>
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
                {facilityBreakdown.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    No facility volume available for this date.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {facilityBreakdown.map(([facility, count]) => (
                      <div key={facility}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-medium text-slate-700">{facility}</span>
                          <span className="text-sm font-semibold text-slate-950">{count}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${Math.max((count / maxFacilityCount) * 100, 4)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-slate-950">Patient Mix</h3>
                  <p className="text-sm text-slate-500">Demographics from queue records</p>
                </div>
                {genderBreakdown.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    No patient mix available.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {genderBreakdown.map(([gender, count]) => (
                      <div key={gender} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">{gender}</span>
                        <span className="text-sm font-semibold text-slate-950">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">QR Scanner</h3>
              <button
                onClick={() => setIsScannerOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl bg-black overflow-hidden">
              <video ref={videoRef} className="w-full h-64 object-cover" playsInline muted />
            </div>
            <canvas ref={canvasRef} className="hidden" />

            <p className="mt-3 text-sm text-gray-700">{scannerStatus}</p>
            {scannerError && <p className="mt-2 text-sm text-red-600">{scannerError}</p>}

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={startCameraScanner}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Retry Camera
              </button>
              <label className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Upload QR Image
                <input type="file" accept="image/*" onChange={handleUploadScan} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Dialog open={activeModal === 'see-patient'} onOpenChange={(o) => !o && closeModal()}>
        {selectedPatient && activeModal === 'see-patient' && (
          <SeePatientModal
            patient={patients.find(p => p.id === selectedPatient.id) || selectedPatient}
            onAction={handleAction}
          />
        )}
      </Dialog>

      <Dialog open={activeModal === 'view-records'} onOpenChange={(o) => !o && closeModal()}>
        {selectedPatient && activeModal === 'view-records' && <ViewRecordsModal patient={selectedPatient} />}
      </Dialog>

      <Dialog open={activeModal === 'mark-complete'} onOpenChange={(o) => !o && closeModal()}>
        {selectedPatient && activeModal === 'mark-complete' && (
          <MarkCompleteModal patient={selectedPatient} onClose={closeModal} onConfirm={handleMarkComplete} />
        )}
      </Dialog>

      <Dialog open={activeModal === 'edit-vitals'} onOpenChange={(o) => !o && closeModal()}>
        {selectedPatient && activeModal === 'edit-vitals' && (
          <EditVitalsModal
            patient={patients.find(p => p.id === selectedPatient.id) || selectedPatient}
            onClose={closeModal}
            onSave={handleSaveVitals}
          />
        )}
      </Dialog>
    </div>
  );
}
