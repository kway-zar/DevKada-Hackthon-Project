import { useEffect, useRef, useState } from 'react';
import {
  Clock,
  AlertTriangle,
  Search,
  QrCode,
  Upload,
  Camera,
  LogOut,
  AlertCircle,
  CheckCircle2,
  FileText,
  CheckCheck,
  MapPin,
  Phone,
  Stethoscope,
} from 'lucide-react';
import jsQR from 'jsqr';
import { FilCareLogo } from './FilCareLogo';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface DoctorDashboardProps {
  onBack: () => void;
}

type Priority = 'P1' | 'P2' | 'P3';

interface Patient {
  id: string;
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

interface Patient {
  id: string;
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

const MOCK_PATIENTS: Patient[] = [
  {
    id: 'FIL-20240501-001',
    name: 'Maria Santos',
    age: 67,
    gender: 'Female',
    priority: 'P1',
    symptoms: ['Chest pain', 'Shortness of breath', 'Diaphoresis'],
    queueNumber: 1,
    waitTime: 'Now',
    location: 'Triage Bay 1',
    phone: '+63 917 234 5678',
    dob: 'Mar 12, 1957',
    bloodType: 'A+',
    allergies: ['Penicillin', 'Aspirin'],
    currentVitals: { bp: '160/95', hr: '112 bpm', temp: '37.2°C', spo2: '94%' },
    medicalHistory: [
      { date: 'Jan 14, 2024', diagnosis: 'Hypertension follow-up', doctor: 'Dr. Reyes' },
      { date: 'Aug 3, 2023', diagnosis: 'Coronary artery disease screening', doctor: 'Dr. Cruz' },
      { date: 'Feb 20, 2023', diagnosis: 'Dyslipidemia management', doctor: 'Dr. Reyes' },
    ],
    chiefComplaint: 'Sudden onset chest pain radiating to left arm for 45 minutes',
    arrivalTime: '08:14 AM',
    status: 'in-progress',
  },
  {
    id: 'FIL-20240501-002',
    name: 'Jose Dela Cruz',
    age: 34,
    gender: 'Male',
    priority: 'P2',
    symptoms: ['High fever', 'Severe headache', 'Stiff neck'],
    queueNumber: 2,
    waitTime: '~12 min',
    location: 'Waiting Area B',
    phone: '+63 918 876 4321',
    dob: 'Jun 5, 1990',
    bloodType: 'O+',
    allergies: ['Sulfonamides'],
    currentVitals: { bp: '122/78', hr: '98 bpm', temp: '39.7°C', spo2: '98%' },
    medicalHistory: [
      { date: 'Oct 11, 2023', diagnosis: 'Dengue fever', doctor: 'Dr. Mendoza' },
      { date: 'May 2, 2022', diagnosis: 'Annual physical exam', doctor: 'Dr. Lim' },
    ],
    chiefComplaint: '39.7°C fever since yesterday with progressive headache and neck stiffness',
    arrivalTime: '08:31 AM',
    status: 'waiting',
  },
  {
    id: 'FIL-20240501-003',
    name: 'Ana Reyes',
    age: 28,
    gender: 'Female',
    priority: 'P2',
    symptoms: ['Abdominal pain', 'Nausea', 'Vomiting'],
    queueNumber: 3,
    waitTime: '~25 min',
    location: 'Waiting Area A',
    phone: '+63 919 543 2109',
    dob: 'Sep 22, 1995',
    bloodType: 'B-',
    allergies: ['None known'],
    currentVitals: { bp: '110/70', hr: '88 bpm', temp: '37.9°C', spo2: '99%' },
    medicalHistory: [
      { date: 'Mar 3, 2024', diagnosis: 'GERD follow-up', doctor: 'Dr. Tan' },
      { date: 'Dec 15, 2023', diagnosis: 'Gastroenteritis', doctor: 'Dr. Tan' },
    ],
    chiefComplaint: 'Sudden periumbilical pain migrating to RLQ, associated with nausea and 2 episodes of vomiting',
    arrivalTime: '08:47 AM',
    status: 'waiting',
  },
  {
    id: 'FIL-20240501-004',
    name: 'Roberto Mangahas',
    age: 45,
    gender: 'Male',
    priority: 'P3',
    symptoms: ['Sprained ankle', 'Mild swelling'],
    queueNumber: 4,
    waitTime: '~40 min',
    location: 'Waiting Area A',
    phone: '+63 920 123 9876',
    dob: 'Nov 8, 1978',
    bloodType: 'AB+',
    allergies: ['Ibuprofen'],
    currentVitals: { bp: '128/82', hr: '76 bpm', temp: '36.8°C', spo2: '99%' },
    medicalHistory: [
      { date: 'Jan 5, 2024', diagnosis: 'Hypertension screening', doctor: 'Dr. Buenaventura' },
    ],
    chiefComplaint: 'Twisted right ankle while playing basketball 2 hours ago, difficulty weight bearing',
    arrivalTime: '09:02 AM',
    status: 'waiting',
  },
  {
    id: 'FIL-20240501-005',
    name: 'Lourdes Villanueva',
    age: 72,
    gender: 'Female',
    priority: 'P3',
    symptoms: ['Mild dizziness', 'Ear pain'],
    queueNumber: 5,
    waitTime: '~55 min',
    location: 'Waiting Area C',
    phone: '+63 921 654 3210',
    dob: 'Feb 14, 1952',
    bloodType: 'A-',
    allergies: ['Codeine'],
    currentVitals: { bp: '135/85', hr: '72 bpm', temp: '36.6°C', spo2: '97%' },
    medicalHistory: [
      { date: 'Apr 22, 2024', diagnosis: 'Otitis media', doctor: 'Dr. Garcia' },
      { date: 'Feb 10, 2024', diagnosis: 'Diabetes management', doctor: 'Dr. Reyes' },
      { date: 'Nov 30, 2023', diagnosis: 'Cataract follow-up', doctor: 'Dr. Sy' },
    ],
    chiefComplaint: 'Right ear pain and hearing muffling for 3 days with intermittent dizziness',
    arrivalTime: '09:15 AM',
    status: 'waiting',
  },
];

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

type ModalType = 'see-patient' | 'view-records' | 'mark-complete' | null;

function VitalChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-blue-50 rounded-xl px-4 py-3 gap-0.5">
      <span className="text-xs text-blue-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-blue-900">{value}</span>
    </div>
  );
}

function SeePatientModal({ patient }: { patient: Patient }) {
  const cfg = PRIORITY_CONFIG[patient.priority];
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
        {/* Identity */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {patient.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-blue-900 leading-tight">{patient.name}</h3>
            <p className="text-sm text-muted-foreground">
              {patient.age} y/o · {patient.gender} · DOB {patient.dob}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{patient.id}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.border} border`}>
            <PriorityIcon className={`w-4 h-4 ${cfg.color}`} />
            <span className={`text-xs font-semibold ${cfg.color}`}>
              {patient.priority} · {cfg.label}
            </span>
          </div>
        </div>

        <Separator />

        {/* Chief Complaint */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Chief Complaint</p>
          <p className="text-sm text-foreground leading-relaxed bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            {patient.chiefComplaint}
          </p>
        </div>

        {/* Symptoms */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Symptoms</p>
          <div className="flex flex-wrap gap-2">
            {patient.symptoms.map((s) => (
              <span key={s} className={`text-xs px-3 py-1 rounded-full font-medium ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Vitals */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Current Vitals</p>
          <div className="grid grid-cols-4 gap-2">
            <VitalChip label="BP" value={patient.currentVitals.bp} />
            <VitalChip label="HR" value={patient.currentVitals.hr} />
            <VitalChip label="Temp" value={patient.currentVitals.temp} />
            <VitalChip label="SpO₂" value={patient.currentVitals.spo2} />
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{patient.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Arrived {patient.arrivalTime}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{patient.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <QrCode className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Queue #{patient.queueNumber} · {patient.waitTime}</span>
          </div>
        </div>

        {/* Allergies */}
        {patient.allergies.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1.5">Allergies</p>
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((a) => (
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
  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-blue-900">
          <FileText className="w-5 h-5 text-blue-600" />
          Medical Records
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5">
        {/* Patient */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {patient.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-blue-900 text-sm">{patient.name}</p>
            <p className="text-xs text-muted-foreground">
              {patient.age} y/o · {patient.gender} · Blood type: {patient.bloodType}
            </p>
          </div>
        </div>

        {/* Bio Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-500 uppercase tracking-wide font-medium mb-0.5">Blood Type</p>
            <p className="text-sm font-semibold text-blue-900">{patient.bloodType}</p>
          </div>
          <div className="bg-blue-50 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-500 uppercase tracking-wide font-medium mb-0.5">Date of Birth</p>
            <p className="text-sm font-semibold text-blue-900">{patient.dob}</p>
          </div>
        </div>

        {/* Allergies */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Known Allergies</p>
          <div className="flex flex-wrap gap-2">
            {patient.allergies.map((a) => (
              <span key={a} className="text-xs px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full font-medium">
                {a}
              </span>
            ))}
          </div>
        </div>

        <Separator />

        {/* Visit History */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Visit History</p>
          <div className="space-y-3">
            {patient.medicalHistory.map((h, i) => (
              <div key={i} className="flex gap-3 items-start group">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                  {i < patient.medicalHistory.length - 1 && (
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
            ))}
          </div>
        </div>

        {/* QR Section */}
        <div className="border border-dashed border-blue-200 rounded-xl px-4 py-4 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <QrCode className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Patient QR Code</p>
            <p className="text-xs text-muted-foreground mt-0.5">Scan to verify identity and access complete record</p>
            <p className="text-xs font-mono text-blue-500 mt-1">{patient.id}</p>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

function MarkCompleteModal({
  patient,
  onClose,
  onConfirm,
}: {
  patient: Patient;
  onClose: () => void;
  onConfirm: (id: string) => void;
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
            case can be closed.
          </p>
          <p className="text-xs text-muted-foreground">
            This will update their status in the queue and remove them from the active patient list.
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            onClick={() => {
              onConfirm(patient.id);
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

function PatientCard({
  patient,
  onAction,
}: {
  patient: Patient;
  onAction: (type: ModalType, patient: Patient) => void;
}) {
  const cfg = PRIORITY_CONFIG[patient.priority];
  const isCompleted = patient.status === 'completed';
  const isInProgress = patient.status === 'in-progress';

  return (
    <div
      className={`bg-white rounded-2xl border-2 ${
        isInProgress ? 'border-blue-500 shadow-lg' : cfg.border
      } p-4 sm:p-6 hover:shadow-lg active:scale-[0.99] transition-all ${
        !isCompleted ? 'cursor-pointer' : 'opacity-50'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div
            className={`${cfg.bg} w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold`}
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
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{patient.name}</h3>
            <p className="text-gray-600 mb-2">
              {patient.age} years old · Blood Type: {patient.bloodType}
            </p>
            <div className="flex items-center gap-3">
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
        <div className="text-right">
          <p className="text-sm text-gray-500">Check-in</p>
          <p className="font-medium text-gray-900">{patient.arrivalTime}</p>
          <p className="text-sm text-gray-500 mt-2">Wait Time</p>
          <p className="font-medium text-gray-900">{patient.waitTime}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">Reported Symptoms</p>
        <p className="text-gray-900">{patient.symptoms.join(', ')}</p>
      </div>

      {!isCompleted && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
  );
}


export function DoctorDashboard({ onBack }: DoctorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'patients' | 'analytics'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('Waiting to start scanner.');
  const [scannerError, setScannerError] = useState('');
  const [scannedPayload, setScannedPayload] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scannerIntervalRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const handleAction = (type: ModalType, patient: Patient) => {
    setSelectedPatient(patient);
    setActiveModal(type);
  };

  const handleMarkComplete = () => {
    // Mark complete action
    closeModal();
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedPatient(null);
  };

  const formatField = (value: unknown) => {
    if (value === null || value === undefined || String(value).trim() === '') return 'N/A';
    return String(value);
  };

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

  const parseScannedData = (rawValue: string) => {
    try {
      const payload = JSON.parse(rawValue);
      setScannedPayload(payload);
      setScannerStatus('QR code scanned successfully.');
      setScannerError('');
      setIsScannerOpen(false);
      stopScanner();
    } catch (_error) {
      setScannerError('Invalid QR payload format. Expected patient data JSON.');
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
        parseScannedData(rawValue);
        return true;
      }
    }

    const imageData = context.getImageData(0, 0, width, height);
    const jsqrResult = jsQR(imageData.data, imageData.width, imageData.height);
    if (jsqrResult?.data) {
      parseScannedData(jsqrResult.data);
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

  const filteredPatients = MOCK_PATIENTS.filter((p: Patient) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.queueNumber.toString().includes(searchQuery)
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
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-gray-700" />
          </button>
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
            {/* Search */}
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
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                Scan QR
              </button>
            </div>

            {/* Patient Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredPatients.map((patient: Patient) => (
                <PatientCard key={patient.id} patient={patient} onAction={handleAction} />
              ))}
            </div>
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
              <div className="mt-6 text-left bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-200 rounded-xl p-5 sm:p-6 max-w-3xl mx-auto shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900">Patient Medical Record</h4>
                    <p className="text-sm text-blue-700">Generated from scanned QR payload</p>
                  </div>
                  <button
                    onClick={downloadScannedRecord}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download Record
                  </button>
                </div>

                <div className="rounded-lg border border-blue-100 bg-white p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Patient ID</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatField(scannedPayload.id)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Full Name</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatField(scannedPayload.name)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Date of Birth</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatField(scannedPayload.dob || scannedPayload.dateOfBirth)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Blood Type</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatField(scannedPayload.bloodType)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Gender</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatField(scannedPayload.gender)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Phone Number</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatField(scannedPayload.phone)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Email Address</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatField(scannedPayload.email)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Home Address</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatField(scannedPayload.address)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Known Allergies</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatField(scannedPayload.allergies)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Current Medications</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatField(scannedPayload.medications)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Emergency Contact</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatField(scannedPayload.emergencyContact)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Emergency Phone</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatField(scannedPayload.emergencyPhone)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Today&apos;s Statistics</h3>
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
        {selectedPatient && activeModal === 'see-patient' && <SeePatientModal patient={selectedPatient} />}
      </Dialog>

      <Dialog open={activeModal === 'view-records'} onOpenChange={(o) => !o && closeModal()}>
        {selectedPatient && activeModal === 'view-records' && <ViewRecordsModal patient={selectedPatient} />}
      </Dialog>

      <Dialog open={activeModal === 'mark-complete'} onOpenChange={(o) => !o && closeModal()}>
        {selectedPatient && activeModal === 'mark-complete' && (
          <MarkCompleteModal patient={selectedPatient} onClose={closeModal} onConfirm={() => handleMarkComplete()} />
        )}
      </Dialog>
    </div>
  );
}
