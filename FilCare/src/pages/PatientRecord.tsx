import { QRCodeSVG } from 'qrcode.react';
import { Download, FileText, Shield, Share2 } from 'lucide-react';

interface PatientRecordProps {
  patientData: any;
}

export function PatientRecord({ patientData }: PatientRecordProps) {
  if (!patientData) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-900">Please complete pre-registration to access your patient record.</p>
        </div>
      </div>
    );
  }

  const qrData = JSON.stringify({
    id: patientData.id,
    name: patientData.name,
    dob: patientData.dateOfBirth,
    bloodType: patientData.bloodType,
    timestamp: Date.now(),
  });

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Medical Records</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Secure QR code access
        </p>
      </div>

      {/* QR Code Card */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-6 sm:p-8 text-white mb-4 sm:mb-6 shadow-2xl">
        <div className="text-center mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-bold mb-2">Digital Patient ID</h3>
          <p className="text-blue-100 text-sm sm:text-base">
            Scan for instant access to records
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-8 mx-auto max-w-xs flex justify-center">
          <QRCodeSVG
            value={qrData}
            size={window.innerWidth < 640 ? 200 : 256}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="mt-6 text-center">
          <p className="text-lg font-semibold mb-1">{patientData.name}</p>
          <p className="text-blue-100">Patient ID: {patientData.id}</p>
        </div>

        <div className="mt-4 sm:mt-6 flex gap-3 justify-center">
          <button className="px-4 sm:px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 active:scale-95 flex items-center gap-2 transition-transform">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button className="px-4 sm:px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 active:scale-95 flex items-center gap-2 transition-transform">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Full Name</p>
            <p className="font-medium text-gray-900">{patientData.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
            <p className="font-medium text-gray-900">
              {new Date(patientData.dateOfBirth).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Gender</p>
            <p className="font-medium text-gray-900 capitalize">{patientData.gender}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Blood Type</p>
            <p className="font-medium text-gray-900">{patientData.bloodType || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Phone</p>
            <p className="font-medium text-gray-900">{patientData.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="font-medium text-gray-900">{patientData.email || 'Not provided'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500 mb-1">Address</p>
            <p className="font-medium text-gray-900">
              {patientData.address}, {patientData.city}, {patientData.zipCode}
            </p>
          </div>
        </div>
      </div>

      {/* Medical Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Medical Information</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">Known Allergies</p>
            <p className="text-gray-900">
              {patientData.allergies || 'No known allergies'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Current Medications</p>
            <p className="text-gray-900">
              {patientData.medications || 'No current medications'}
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Contact Name</p>
            <p className="font-medium text-gray-900">{patientData.emergencyContact}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Contact Phone</p>
            <p className="font-medium text-gray-900">{patientData.emergencyPhone}</p>
          </div>
        </div>
      </div>

      {/* Medical Records */}
      {patientData.medicalRecords && patientData.medicalRecords.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Medical Records</h3>
          <div className="space-y-3">
            {patientData.medicalRecords.map((record: string, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-900">{record}</span>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-green-900 mb-2">Secure & Private</h4>
            <p className="text-sm text-green-800">
              Your medical records are encrypted and secured. The QR code provides read-only access
              and requires healthcare provider authentication. You control who can access your information.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-98 transition-transform shadow-lg">
          Update Information
        </button>
        <button className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 active:scale-98 transition-transform">
          Request Records
        </button>
      </div>
    </div>
  );
}
