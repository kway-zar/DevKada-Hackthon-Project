import { useLocation, useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  User,
  Clock,
  FileText,
  AlertTriangle,
  Pill,
  Activity,
} from "lucide-react";

interface PatientEntry {
  patientName: string;
  patientId: string;
  priority?: string;
  queueNumber?: string | number;
  status?: string;
  checkedInAt?: string;
  symptoms?: string;
  estimatedWait?: string;
  age?: number;
  gender?: string;
  sex?: string;
  bloodType?: string;
  allergies?: string[];
  medication?: string[];
  medicalHistory?: string[];
  qrCode?: string;
  parentGuardianName?: string;
  contactNumber?: string;
  religion?: string;
  insuranceProvider?: string[];
}

const priorityStyles: Record<string, { label: string; badgeClass: string }> = {
  P1: { label: "Critical", badgeClass: "bg-red-100 text-red-700" },
  P2: { label: "Urgent", badgeClass: "bg-yellow-100 text-yellow-700" },
  P3: { label: "Routine", badgeClass: "bg-green-100 text-green-700" },
};

function PriorityBadge({
  priority,
  size = "md",
}: {
  priority?: string;
  size?: "sm" | "md" | "lg";
}) {
  const level = priority && priorityStyles[priority] ? priority : "P3";
  const style = priorityStyles[level];
  const sizeClass =
    size === "lg"
      ? "px-4 py-2 text-sm"
      : size === "sm"
      ? "px-2 py-1 text-xs"
      : "px-3 py-1.5 text-xs";

  return (
    <span
      className={`${style.badgeClass} ${sizeClass} rounded-full font-semibold uppercase tracking-wide`}
    >
      {style.label}
    </span>
  );
}

export default function PatientDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { entry?: PatientEntry } | null;
  const entry = state?.entry;

  if (!entry) {
    navigate("/provider");
    return null;
  }

  const allergies = entry.allergies ?? [];
  const medication = entry.medication ?? [];
  const medicalHistory = entry.medicalHistory ?? [];
  const qrCode = entry.qrCode ?? `https://filcare.com/patient/${entry.patientId}`;
  const gender = entry.gender ?? entry.sex ?? "N/A";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate("/doctor")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-semibold"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <User className="h-12 w-12 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {entry.patientName}
                  </h1>
                  <p className="text-gray-600 font-mono">{entry.patientId}</p>
                </div>
              </div>
              <PriorityBadge priority={entry.priority} size="lg" />
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">Queue Number</p>
                <p className="text-2xl font-bold text-gray-900">
                  #{entry.queueNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {entry.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Checked In</p>
                <p className="text-lg font-semibold text-gray-900">
                  {entry.checkedInAt}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Presenting Symptoms
                </h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {entry.symptoms}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Estimated Wait Time
                </h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {entry.estimatedWait}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Medical History
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Allergies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allergies.length > 0 ? (
                    allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="px-3 py-2 bg-red-100 text-red-800 rounded-lg font-medium"
                      >
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-600">No known allergies recorded.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Pill className="h-5 w-5 text-blue-600" />
                  Current Medications
                </h3>
                <div className="space-y-2">
                  {medication.length > 0 ? (
                    medication.map((med) => (
                      <div
                        key={med}
                        className="bg-gray-50 p-3 rounded-lg text-gray-900"
                      >
                        {med}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">No medications listed.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Medical History
                </h3>
                <div className="space-y-2">
                  {medicalHistory.length > 0 ? (
                    medicalHistory.map((history) => (
                      <div
                        key={history}
                        className="bg-gray-50 p-3 rounded-lg text-gray-900"
                      >
                        {history}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">No prior medical history available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
              Start Consultation
            </button>
            <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold">
              Mark as Complete
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-8 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Patient Information
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Age</p>
                <p className="text-gray-900">{entry.age ?? "—"} years</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Gender
                </p>
                <p className="text-gray-900">{gender}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Blood Type
                </p>
                <p className="text-gray-900">{entry.bloodType ?? "—"}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-900 mb-4">
                Digital Patient ID
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <QRCodeSVG
                  value={qrCode}
                  size={150}
                  level="H"
                  className="w-full h-auto"
                />
              </div>
              <p className="text-xs font-mono text-gray-600 break-all text-center mb-4">
                {qrCode}
              </p>
              <p className="text-sm text-gray-600">
                Scan to verify patient identity and access complete medical records across all facilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
