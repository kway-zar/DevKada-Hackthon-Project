
import { QRCodeSVG } from 'qrcode.react';
import { UserCircle, Shield, Download, Upload } from 'lucide-react';

interface Patient {
  name: string;
  id: string;
  age: number;
  sex: string;
  bloodType: string;
  allergies: string[];
  medication: string[];
  medicalHistory: string[];
  qrCode: string;
  address: string;
  parentGuardianName?: string;
  contactNumber: string;
  religion: string;
  insuranceProvider?: string[];
}

const PatientProfile = () => {
  const patient: Patient = {
    name: "Juan Dela Cruz",
    id: "PT-2024-001",
    age: 16,
    sex: "Male",
    bloodType: "O+",
    allergies: ["Penicillin", "Peanuts"],
    medication: ["Lisinopril", "Metformin"],
    medicalHistory: [
      "Hypertension diagnosed in 2018",
      "Type 2 Diabetes diagnosed in 2020",
      "Appendectomy in 2015"
    ],
    qrCode: "https://filcare.com/patient/PT-2024-001",
    address: "123 Main St, Barangay San Isidro, Manila, Philippines",
    parentGuardianName: "Maria Dela Cruz",
    contactNumber: "09123456789",
    religion: "Catholic",
    insuranceProvider: ["PhilHealth", "Maxicare"]
  };


  const showExtraInfo = patient.age < 18 || patient.age > 60;
  const hasInsurance = patient.insuranceProvider != null && patient.insuranceProvider.length > 0;
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <UserCircle className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Patient Profile</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Full Name
                  </label>
                  <p className="text-gray-900">{patient.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Patient ID
                  </label>
                  <p className="text-gray-900">{patient.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Address
                  </label>
                  <p className="text-gray-900">{patient.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Age
                  </label>
                  <p className="text-gray-900">{patient.age}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Sex
                  </label>
                  <p className="text-gray-900">{patient.sex}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Blood Type
                  </label>
                  <p className="text-gray-900">{patient.bloodType}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Religion
                  </label>
                  <p className="text-gray-900">{patient.religion}</p>
                </div>
                {hasInsurance && (
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">
                      Health Insurance
                    </label>
                    <p className="text-gray-900">{patient.insuranceProvider?.join(", ")}</p>
                  </div>
                )}

                {showExtraInfo && (
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">
                      Parent/Guardian Name
                    </label>
                    <p className="text-gray-900">{patient.parentGuardianName}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Contact Number
                  </label>
                  <p className="text-gray-900">{patient.contactNumber}</p>
                </div>

              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Medical Information</h2>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Allergies
                </label>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((allergy: string) => (
                    <span
                      key={allergy}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Current Medication
                </label>
                <ul className="space-y-1">
                  {patient.medication.map((med: string) => (
                    <li key={med} className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                      {med}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Medical History
                </label>
                <ul className="space-y-1">
                  {patient.medicalHistory.map((history) => (
                    <li
                      key={history}
                      className="text-gray-900 bg-gray-50 px-3 py-2 rounded"
                    >
                      {history}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                  <Upload className="h-5 w-5" />
                  Upload Medical Records
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold">
                  <Download className="h-5 w-5" />
                  Download Records
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
                <h3 className="font-bold text-gray-900">Digital Patient ID</h3>
              </div>

              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeSVG
                  value={patient.qrCode}
                  size={200}
                  level="H"
                  className="w-full h-auto"
                />
              </div>

              <p className="text-sm text-gray-700 mb-4">
                Show this QR code at any participating facility for instant
                access to your medical records. No paperwork needed!
              </p>

              <div className="bg-white rounded-lg p-3 mb-4">
                <p className="text-xs font-mono text-gray-600 break-all">
                  {patient.qrCode}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Secure, encrypted access</span>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Patient-controlled sharing</span>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700">Works across all hospitals</span>
                </div>
              </div>

              <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm">
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
        <h3 className="font-bold text-yellow-900 mb-2">Privacy Notice</h3>
        <p className="text-sm text-yellow-800">
          Your medical information is encrypted and only shared with authorized
          healthcare providers when you present your QR code. You maintain full
          control over who can access your records.
        </p>
      </div>
    </div>
  );
}

export default PatientProfile;
