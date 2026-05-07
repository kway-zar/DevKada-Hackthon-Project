import { useEffect, useState } from "react";
import {
  Activity,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  FileText,
  CheckCheck,
  MapPin,
  Phone,
  QrCode,
  Stethoscope,
  LogOut,
} from "lucide-react";
import { FilCareLogo } from "./FilCareLogo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { fetchProviderQueueDashboard, type ProviderQueueDashboardRow } from "../lib/supabaseAuth";

type Priority = "P1" | "P2" | "P3";

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
  status: "waiting" | "in-progress" | "completed";
}

const MOCK_PATIENTS: Patient[] = [
  {
    id: "FIL-20240501-001",
    name: "Maria Santos",
    age: 67,
    gender: "Female",
    priority: "P1",
    symptoms: ["Chest pain", "Shortness of breath", "Diaphoresis"],
    queueNumber: 1,
    waitTime: "Now",
    location: "Triage Bay 1",
    phone: "+63 917 234 5678",
    dob: "Mar 12, 1957",
    bloodType: "A+",
    allergies: ["Penicillin", "Aspirin"],
    currentVitals: { bp: "160/95", hr: "112 bpm", temp: "37.2°C", spo2: "94%" },
    medicalHistory: [
      { date: "Jan 14, 2024", diagnosis: "Hypertension follow-up", doctor: "Dr. Reyes" },
      { date: "Aug 3, 2023", diagnosis: "Coronary artery disease screening", doctor: "Dr. Cruz" },
      { date: "Feb 20, 2023", diagnosis: "Dyslipidemia management", doctor: "Dr. Reyes" },
    ],
    chiefComplaint: "Sudden onset chest pain radiating to left arm for 45 minutes",
    arrivalTime: "08:14 AM",
    status: "in-progress",
  },
  {
    id: "FIL-20240501-002",
    name: "Jose Dela Cruz",
    age: 34,
    gender: "Male",
    priority: "P2",
    symptoms: ["High fever", "Severe headache", "Stiff neck"],
    queueNumber: 2,
    waitTime: "~12 min",
    location: "Waiting Area B",
    phone: "+63 918 876 4321",
    dob: "Jun 5, 1990",
    bloodType: "O+",
    allergies: ["Sulfonamides"],
    currentVitals: { bp: "122/78", hr: "98 bpm", temp: "39.7°C", spo2: "98%" },
    medicalHistory: [
      { date: "Oct 11, 2023", diagnosis: "Dengue fever", doctor: "Dr. Mendoza" },
      { date: "May 2, 2022", diagnosis: "Annual physical exam", doctor: "Dr. Lim" },
    ],
    chiefComplaint: "39.7°C fever since yesterday with progressive headache and neck stiffness",
    arrivalTime: "08:31 AM",
    status: "waiting",
  },
  {
    id: "FIL-20240501-003",
    name: "Ana Reyes",
    age: 28,
    gender: "Female",
    priority: "P2",
    symptoms: ["Abdominal pain", "Nausea", "Vomiting"],
    queueNumber: 3,
    waitTime: "~25 min",
    location: "Waiting Area A",
    phone: "+63 919 543 2109",
    dob: "Sep 22, 1995",
    bloodType: "B-",
    allergies: ["None known"],
    currentVitals: { bp: "110/70", hr: "88 bpm", temp: "37.9°C", spo2: "99%" },
    medicalHistory: [
      { date: "Mar 3, 2024", diagnosis: "GERD follow-up", doctor: "Dr. Tan" },
      { date: "Dec 15, 2023", diagnosis: "Gastroenteritis", doctor: "Dr. Tan" },
    ],
    chiefComplaint: "Sudden periumbilical pain migrating to RLQ, associated with nausea and 2 episodes of vomiting",
    arrivalTime: "08:47 AM",
    status: "waiting",
  },
  {
    id: "FIL-20240501-004",
    name: "Roberto Mangahas",
    age: 45,
    gender: "Male",
    priority: "P3",
    symptoms: ["Sprained ankle", "Mild swelling"],
    queueNumber: 4,
    waitTime: "~40 min",
    location: "Waiting Area A",
    phone: "+63 920 123 9876",
    dob: "Nov 8, 1978",
    bloodType: "AB+",
    allergies: ["Ibuprofen"],
    currentVitals: { bp: "128/82", hr: "76 bpm", temp: "36.8°C", spo2: "99%" },
    medicalHistory: [
      { date: "Jan 5, 2024", diagnosis: "Hypertension screening", doctor: "Dr. Buenaventura" },
    ],
    chiefComplaint: "Twisted right ankle while playing basketball 2 hours ago, difficulty weight bearing",
    arrivalTime: "09:02 AM",
    status: "waiting",
  },
  {
    id: "FIL-20240501-005",
    name: "Lourdes Villanueva",
    age: 72,
    gender: "Female",
    priority: "P3",
    symptoms: ["Mild dizziness", "Ear pain"],
    queueNumber: 5,
    waitTime: "~55 min",
    location: "Waiting Area C",
    phone: "+63 921 654 3210",
    dob: "Feb 14, 1952",
    bloodType: "A-",
    allergies: ["Codeine"],
    currentVitals: { bp: "135/85", hr: "72 bpm", temp: "36.6°C", spo2: "97%" },
    medicalHistory: [
      { date: "Apr 22, 2024", diagnosis: "Otitis media", doctor: "Dr. Garcia" },
      { date: "Feb 10, 2024", diagnosis: "Diabetes management", doctor: "Dr. Reyes" },
      { date: "Nov 30, 2023", diagnosis: "Cataract follow-up", doctor: "Dr. Sy" },
    ],
    chiefComplaint: "Right ear pain and hearing muffling for 3 days with intermittent dizziness",
    arrivalTime: "09:15 AM",
    status: "waiting",
  },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string; icon: typeof AlertCircle }> = {
  P1: { label: "Immediate", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: AlertCircle },
  P2: { label: "Urgent", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle },
  P3: { label: "Non-Urgent", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
};

type ModalType = "see-patient" | "view-records" | "mark-complete" | null;

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
            {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-blue-900 leading-tight">{patient.name}</h3>
            <p className="text-sm text-muted-foreground">{patient.age} y/o · {patient.gender} · DOB {patient.dob}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{patient.id}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.border} border`}>
            <PriorityIcon className={`w-4 h-4 ${cfg.color}`} />
            <span className={`text-xs font-semibold ${cfg.color}`}>{patient.priority} · {cfg.label}</span>
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
                <span key={a} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">{a}</span>
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
            {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-blue-900 text-sm">{patient.name}</p>
            <p className="text-xs text-muted-foreground">{patient.age} y/o · {patient.gender} · Blood type: {patient.bloodType}</p>
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
              <span key={a} className="text-xs px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full font-medium">{a}</span>
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
            {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-emerald-900">{patient.name}</p>
            <p className="text-xs text-emerald-700 mt-0.5">{patient.age} y/o · Queue #{patient.queueNumber}</p>
            <div className={`flex items-center gap-1 mt-1.5 w-fit px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.border} border`}>
              <PriorityIcon className={`w-3 h-3 ${cfg.color}`} />
              <span className={`text-xs font-semibold ${cfg.color}`}>{patient.priority} · {cfg.label}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-foreground">
            Confirm that <span className="font-semibold">{patient.name}</span>&apos;s visit has been completed and their case can be closed.
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
  const PriorityIcon = cfg.icon;
  const isCompleted = patient.status === "completed";
  const isInProgress = patient.status === "in-progress";

  return (
    <div
      className={`relative bg-white rounded-2xl border p-5 transition-shadow hover:shadow-md ${
        isCompleted ? "opacity-50" : ""
      } ${cfg.border}`}
    >
      {/* Priority stripe */}
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${
        patient.priority === "P1" ? "bg-red-500" :
        patient.priority === "P2" ? "bg-amber-400" : "bg-emerald-400"
      }`} />

      <div className="pl-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 text-sm leading-tight">{patient.name}</h4>
              <p className="text-xs text-muted-foreground">{patient.age} y/o · {patient.gender}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.border} border`}>
              <PriorityIcon className={`w-3 h-3 ${cfg.color}`} />
              <span className={`text-xs font-bold ${cfg.color}`}>{patient.priority}</span>
            </div>
            <span className="text-xs text-muted-foreground">#{patient.queueNumber}</span>
          </div>
        </div>

        {/* Symptoms */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {patient.symptoms.slice(0, 3).map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{s}</span>
          ))}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {patient.waitTime}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {patient.location}
          </span>
          {isInProgress && (
            <span className="flex items-center gap-1 text-blue-600 font-medium">
              <Activity className="w-3.5 h-3.5" />
              In Progress
            </span>
          )}
        </div>

        {/* Actions */}
        {!isCompleted && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => onAction("see-patient", patient)}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              See Patient
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              onClick={() => onAction("view-records", patient)}
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              Records
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs h-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              onClick={() => onAction("mark-complete", patient)}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Complete
            </Button>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Visit completed
          </div>
        )}
      </div>
    </div>
  );
}

interface ProviderDashboardProps {
  onBack?: () => void;
}

export function ProviderDashboard({ onBack }: ProviderDashboardProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filter, setFilter] = useState<"all" | Priority>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const mapStatus = (status: string): Patient['status'] => {
      if (status === 'completed') return 'completed';
      if (status === 'called' || status === 'in-progress' || status === 'in_consultation') return 'in-progress';
      return 'waiting';
    };

    const formatArrivalTime = (checkInAt: string | null) => {
      if (!checkInAt) return 'N/A';
      const date = new Date(checkInAt);
      if (Number.isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    };

    const parseSymptoms = (symptomsText: string | null) => {
      if (!symptomsText) return ['No symptoms recorded'];
      return symptomsText
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 6);
    };

    const toPatient = (row: ProviderQueueDashboardRow): Patient => {
      const waitTime = row.status === 'completed'
        ? 'Completed'
        : row.estimated_wait_minutes === null
          ? 'Pending'
          : row.estimated_wait_minutes <= 0
            ? 'Now'
            : `~${row.estimated_wait_minutes} min`;

      return {
        id: row.patient_code || row.id,
        name: row.patient_name || 'Unknown Patient',
        age: 0,
        gender: row.gender || 'Unknown',
        priority: row.priority,
        symptoms: parseSymptoms(row.symptoms_text),
        queueNumber: row.queue_number,
        waitTime,
        location: row.facility_name || 'Facility not set',
        phone: 'N/A',
        dob: 'N/A',
        bloodType: row.blood_type || 'N/A',
        allergies: [],
        currentVitals: { bp: 'N/A', hr: 'N/A', temp: 'N/A', spo2: 'N/A' },
        medicalHistory: [],
        chiefComplaint: row.recommendation || row.symptoms_text || 'No details available',
        arrivalTime: formatArrivalTime(row.check_in_at),
        status: mapStatus(row.status),
      };
    };

    const loadQueue = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const rows = await fetchProviderQueueDashboard();
        setPatients(rows.map(toPatient));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Failed to load provider queue dashboard');
        setPatients(MOCK_PATIENTS);
      } finally {
        setIsLoading(false);
      }
    };

    void loadQueue();
  }, []);

  const handleAction = (type: ModalType, patient: Patient) => {
    if (type === "view-records") {
      navigate(`/provider/patient/${patient.id}`, {
        state: {
          entry: {
            patientName: patient.name,
            patientId: patient.id,
            priority: patient.priority,
            queueNumber: patient.queueNumber,
            status:
              patient.status === "completed"
                ? "Completed"
                : patient.status === "in-progress"
                ? "In Progress"
                : "Waiting",
            checkedInAt: patient.arrivalTime,
            symptoms: patient.symptoms.join(", "),
            estimatedWait: patient.waitTime,
            age: patient.age,
            gender: patient.gender,
            bloodType: patient.bloodType,
            allergies: patient.allergies,
            medication: [],
            medicalHistory: patient.medicalHistory.map(
              (record) => `${record.date} — ${record.diagnosis} (${record.doctor})`
            ),
            qrCode: `https://filcare.com/patient/${patient.id}`,
            contactNumber: patient.phone,
          },
        },
      });
      return;
    }

    setSelectedPatient(patient);
    setActiveModal(type);
  };

  const handleMarkComplete = (id: string) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "completed" } : p))
    );
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedPatient(null);
  };

  const filtered = filter === "all" ? patients : patients.filter((p) => p.priority === filter);
  const stats = {
    total: patients.filter((p) => p.status !== "completed").length,
    p1: patients.filter((p) => p.priority === "P1" && p.status !== "completed").length,
    p2: patients.filter((p) => p.priority === "P2" && p.status !== "completed").length,
    p3: patients.filter((p) => p.priority === "P3" && p.status !== "completed").length,
    completed: patients.filter((p) => p.status === "completed").length,
  };

  return (
    <div className="size-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FilCareLogo size="sm" showText={false} />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900">Provider Dashboard</h1>
              <p className="text-xs text-gray-500">Live queue management</p>
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

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          {/* Page Title */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Live queue — {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">Live</span>
            </div>
          </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Patients", value: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Immediate (P1)", value: stats.p1, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Urgent (P2)", value: stats.p2, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{value}</p>
              <p className="text-xs text-muted-foreground leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "P1", "P2", "P3"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-muted-foreground border-slate-200 hover:border-blue-300 hover:text-blue-700"
            }`}
          >
            {f === "all" ? "All Patients" : f === "P1" ? "Immediate" : f === "P2" ? "Urgent" : "Non-Urgent"}
          </button>
        ))}
      </div>

      {/* Patient List */}
      <div className="grid md:grid-cols-2 gap-4">
        {isLoading && (
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground">
            Loading provider queue...
          </div>
        )}

        {!isLoading && loadError && (
          <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Unable to load live queue. Showing fallback data. Details: {loadError}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground">
            No queue entries found for today.
          </div>
        )}

        {!isLoading && filtered.map((patient) => (
          <PatientCard key={patient.id} patient={patient} onAction={handleAction} />
        ))}
      </div>

      {/* Modals */}
      <Dialog open={activeModal === "see-patient"} onOpenChange={(o) => !o && closeModal()}>
        {selectedPatient && activeModal === "see-patient" && (
          <SeePatientModal patient={selectedPatient} />
        )}
      </Dialog>

      <Dialog open={activeModal === "view-records"} onOpenChange={(o) => !o && closeModal()}>
        {selectedPatient && activeModal === "view-records" && (
          <ViewRecordsModal patient={selectedPatient} />
        )}
      </Dialog>

      <Dialog open={activeModal === "mark-complete"} onOpenChange={(o) => !o && closeModal()}>
        {selectedPatient && activeModal === "mark-complete" && (
          <MarkCompleteModal patient={selectedPatient} onClose={closeModal} onConfirm={handleMarkComplete} />
        )}
      </Dialog>
        </div>
      </div>
    </div>
  );
}
