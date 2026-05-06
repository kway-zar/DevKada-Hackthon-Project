import { useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';

interface PreRegistrationProps {
  onComplete: (data: any) => void;
}

export function PreRegistration({ onComplete }: PreRegistrationProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    religion: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    bloodType: '',
    allergies: '',
    medications: '',
    emergencyContact: '',
    emergencyPhone: '',
    guardianName: '',
    guardianRelationship: '',
    guardianPhone: '',
    hasInsurance: '',
    insuranceProvider: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState('');

  const getAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age;
  };

  const age = getAge(formData.dateOfBirth);
  const needsGuardianInfo = age !== null && (age < 18 || age >= 60);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setSubmitError('');
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      insuranceProvider: name === 'hasInsurance' && value === 'no' ? '' : prev.insuranceProvider,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(files.map(f => f.name));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (needsGuardianInfo) {
      const guardianMissing =
        !formData.guardianName.trim() ||
        !formData.guardianRelationship.trim() ||
        !formData.guardianPhone.trim();

      if (guardianMissing) {
        setSubmitError('Guardian/Parent details are required for minors and senior patients.');
        return;
      }
    }

    if (formData.hasInsurance === 'yes' && !formData.insuranceProvider.trim()) {
      setSubmitError('Please provide your insurance provider.');
      return;
    }

    const patientId = 'PT' + Date.now().toString().slice(-8);
    const patientData = {
      ...formData,
      id: patientId,
      name: `${formData.firstName} ${formData.lastName}`,
      age,
      needsGuardianInfo,
      registeredAt: new Date().toISOString(),
      medicalRecords: uploadedFiles,
    };
    onComplete(patientData);
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Pre-Registration</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Speed up your hospital visit
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-8">
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                required
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {age !== null && (
                <p className="mt-2 text-xs text-gray-500">
                  Age: {age} {needsGuardianInfo ? '(Guardian/Parent details required)' : ''}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="text"
                value={age ?? ''}
                readOnly
                placeholder="Calculated from date of birth"
                className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Religion
              </label>
              <input
                type="text"
                name="religion"
                value={formData.religion}
                onChange={handleChange}
                placeholder="Enter religion (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Insurance Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Do you have healthcare insurance? *
              </label>
              <select
                name="hasInsurance"
                required
                value={formData.hasInsurance}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
>
                <option value="">Select option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {formData.hasInsurance === 'yes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Provider *
                </label>
                <input
                  type="text"
                  name="insuranceProvider"
                  required={formData.hasInsurance === 'yes'}
                  value={formData.insuranceProvider}
                  onChange={handleChange}
                  placeholder="e.g. PhilHealth, Maxicare, Medicard"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Address</h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  required
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Medical Information</h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Type
              </label>
              <select
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Known Allergies
              </label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="List any known allergies (medications, food, etc.)"
                className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Medications
              </label>
              <textarea
                name="medications"
                value={formData.medications}
                onChange={handleChange}
                placeholder="List current medications and dosages"
                className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Name *
              </label>
              <input
                type="text"
                name="emergencyContact"
                required
                value={formData.emergencyContact}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Phone *
              </label>
              <input
                type="tel"
                name="emergencyPhone"
                required
                value={formData.emergencyPhone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {needsGuardianInfo && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Guardian / Parent Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guardian / Parent Name *
                </label>
                <input
                  type="text"
                  name="guardianName"
                  required={needsGuardianInfo}
                  value={formData.guardianName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship *
                </label>
                <input
                  type="text"
                  name="guardianRelationship"
                  required={needsGuardianInfo}
                  value={formData.guardianRelationship}
                  onChange={handleChange}
                  placeholder="Parent, Child, Spouse, Sibling, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guardian / Parent Phone *
                </label>
                <input
                  type="tel"
                  name="guardianPhone"
                  required={needsGuardianInfo}
                  value={formData.guardianPhone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Medical Records (Optional)</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <label className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                Click to upload files
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">
              PDF, JPG, PNG up to 10MB each
            </p>
            {uploadedFiles.length > 0 && (
              <div className="mt-4 text-left">
                <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</p>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {file}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {submitError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-98 flex items-center justify-center gap-2 shadow-lg transition-transform"
        >
          <CheckCircle className="w-5 h-5" />
          Complete Registration
        </button>
      </form>
    </div>
  );
}
