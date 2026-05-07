
import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Download, Edit3, Loader2, Shield, UserCircle, Upload } from 'lucide-react';

type PatientData = {
  id?: string;
  patientCode?: string;
  qrToken?: string;
  qr_token?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  bloodType?: string;
  allergies?: string;
  medications?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianPhone?: string;
  religion?: string;
  hasInsurance?: string;
  insuranceProvider?: string;
};

interface PatientProfileProps {
  patient?: PatientData | null;
  onPatientUpdated?: (data: PatientData) => void;
}

const DEFAULT_REST_API = 'https://mhahfguiqnaczorujmhd.supabase.co/rest/v1/';

function getRestBase() {
  return (
    (import.meta.env.VITE_SUPABASE_REST_API as string | undefined)?.trim() || DEFAULT_REST_API
  ).replace(/\/$/, '');
}

function getAnonKey() {
  return (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';
}

function toFormData(patient?: PatientData | null) {
  return {
    firstName: patient?.firstName ?? patient?.name?.split(' ')[0] ?? '',
    lastName: patient?.lastName ?? patient?.name?.split(' ').slice(1).join(' ') ?? '',
    dateOfBirth: patient?.dateOfBirth ?? '',
    gender: patient?.gender ?? '',
    phone: patient?.phone ?? '',
    email: patient?.email ?? '',
    address: patient?.address ?? '',
    city: patient?.city ?? '',
    zipCode: patient?.zipCode ?? '',
    bloodType: patient?.bloodType ?? '',
    allergies: patient?.allergies ?? '',
    medications: patient?.medications ?? '',
    emergencyContact: patient?.emergencyContact ?? '',
    emergencyPhone: patient?.emergencyPhone ?? '',
    guardianName: patient?.guardianName ?? '',
    guardianRelationship: patient?.guardianRelationship ?? '',
    guardianPhone: patient?.guardianPhone ?? '',
    religion: patient?.religion ?? '',
    hasInsurance: patient?.hasInsurance ?? '',
    insuranceProvider: patient?.insuranceProvider ?? '',
  };
}

const PatientProfile = ({ patient, onPatientUpdated }: PatientProfileProps) => {
  const [formData, setFormData] = useState(toFormData(patient));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    setFormData(toFormData(patient));
  }, [patient]);

  const age = useMemo(() => {
    if (!formData.dateOfBirth) return null;
    const dob = new Date(formData.dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;

    const today = new Date();
    let computedAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      computedAge -= 1;
    }

    return computedAge;
  }, [formData.dateOfBirth]);

  const showGuardianFields = age !== null && (age < 18 || age >= 60);
  const patientCode = useMemo(() => patient?.patientCode || patient?.id || 'PT-UNKNOWN', [patient]);
  
  // QR code encodes full patient data as JSON for DoctorDashboard scanner
  const qrCodeValue = useMemo(() => {
    if (!patient?.id) return '';
    return JSON.stringify({
      id: patient.id,
      patientCode: patient.patientCode || patient.id,
      name: patient.name || `${formData.firstName} ${formData.lastName}`.trim(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: patient.dateOfBirth,
      dob: patient.dateOfBirth,
      gender: patient.gender,
      bloodType: patient.bloodType,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      city: patient.city,
      zipCode: patient.zipCode,
      allergies: patient.allergies,
      medications: patient.medications,
      emergencyContact: patient.emergencyContact,
      emergencyPhone: patient.emergencyPhone,
      qrToken: patient.qrToken || patient.qr_token,
    });
  }, [patient, formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSaveError('');
    setSaveSuccess('');
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!patient?.id) {
      setSaveError('Missing patient ID. Save the registration first.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const response = await fetch(`${getRestBase()}/patients?id=eq.${encodeURIComponent(patient.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: getAnonKey(),
          Authorization: `Bearer ${getAnonKey()}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.dateOfBirth || null,
          gender: formData.gender,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          zip_code: formData.zipCode,
          blood_type: formData.bloodType || null,
          allergies: formData.allergies || null,
          medications: formData.medications || null,
          emergency_contact_name: formData.emergencyContact,
          emergency_contact_phone: formData.emergencyPhone,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unable to update patient details');
      }

      const updatedPatient: PatientData = {
        ...patient,
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        patientCode,
      };

      onPatientUpdated?.(updatedPatient);
      setSaveSuccess('Patient information updated successfully.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unexpected update error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <UserCircle className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Profile</h1>
            <p className="text-sm text-gray-500">Edit details and save through the Supabase REST API</p>
          </div>
        </div>

        {saveError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {saveSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">First Name</label>
                  <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Last Name</label>
                  <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Date of Birth</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Age</label>
                  <input value={age ?? ''} readOnly className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Blood Type</label>
                  <select name="bloodType" value={formData.bloodType} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
                  <input name="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Address</label>
                  <input name="address" value={formData.address} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">City</label>
                  <input name="city" value={formData.city} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">ZIP Code</label>
                  <input name="zipCode" value={formData.zipCode} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Medical Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Allergies</label>
                  <textarea name="allergies" value={formData.allergies} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-24" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Current Medications</label>
                  <textarea name="medications" value={formData.medications} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-24" />
                </div>
              </div>
            </div>

            {showGuardianFields && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Guardian Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Guardian Name</label>
                    <input name="guardianName" value={formData.guardianName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Relationship</label>
                    <input name="guardianRelationship" value={formData.guardianRelationship} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Guardian Phone</label>
                    <input name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button type="button" className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                <Upload className="h-5 w-5" />
                Upload Medical Records
              </button>
              <button type="button" className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold">
                <Download className="h-5 w-5" />
                Download Records
              </button>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
                <h3 className="font-bold text-gray-900">Digital Patient ID</h3>
              </div>

              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeSVG value={qrCodeValue} size={200} level="H" className="w-full h-auto" />
              </div>

              <p className="text-sm text-gray-700 mb-4">
                Show this QR code at any participating facility for instant access to your medical records.
              </p>

              

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
