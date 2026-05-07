
import { useEffect, useMemo, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Download, Edit3, Loader2, FileText, Image as ImageIcon, Shield, UserCircle, Upload } from 'lucide-react';

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
  medicalRecords?: MedicalRecordAttachment[];
};

type MedicalRecordAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  dataUrl?: string;
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

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function getFileKind(type: string) {
  return type.startsWith('image/') ? 'image' : type === 'application/pdf' ? 'pdf' : 'file';
}

function isImageLikeFile(file: File) {
  return file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);
}

const PatientProfile = ({ patient, onPatientUpdated }: PatientProfileProps) => {
  const [formData, setFormData] = useState(toFormData(patient));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordAttachment[]>(patient?.medicalRecords ?? []);
  const [isUploadingRecord, setIsUploadingRecord] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFormData(toFormData(patient));
    setMedicalRecords(patient?.medicalRecords ?? []);
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
  const patientCode = patient?.patientCode || patient?.id || 'PT-UNKNOWN';
  const qrToken = patient?.qrToken || patient?.qr_token || '';
  const qrPayload = useMemo(
    () => ({
      type: 'filcare.patient',
      id: patient?.id || '',
      patientCode,
      qrToken,
      name: `${formData.firstName} ${formData.lastName}`.trim() || patient?.name || '',
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      phone: formData.phone,
      email: formData.email,
      address: [formData.address, formData.city, formData.zipCode].filter(Boolean).join(', '),
      city: formData.city,
      zipCode: formData.zipCode,
      bloodType: formData.bloodType,
      allergies: formData.allergies,
      medications: formData.medications,
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone,
    }),
    [formData, patient?.id, patient?.name, patientCode, qrToken]
  );
  const qrCodeValue = JSON.stringify(qrPayload);
  const qrRef = useRef<HTMLDivElement | null>(null);

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
        medicalRecords,
      };

      onPatientUpdated?.(updatedPatient);
      setSaveSuccess('Patient information updated successfully.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unexpected update error');
    } finally {
      setIsSaving(false);
    }
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
      reader.readAsDataURL(file);
    });

  const handleUploadRecords = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    setIsUploadingRecord(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const uploads: MedicalRecordAttachment[] = [];
      for (const file of files) {
        uploads.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          uploadedAt: new Date().toISOString(),
          dataUrl: isImageLikeFile(file) ? await readFileAsDataUrl(file) : undefined,
        });
      }

      const next = [...uploads, ...medicalRecords].slice(0, 12);
      setMedicalRecords(next);
      onPatientUpdated?.({
        ...(patient || {}),
        ...formData,
        id: patient?.id,
        name: `${formData.firstName} ${formData.lastName}`.trim() || patient?.name || '',
        patientCode,
        medicalRecords: next,
      });

      setSaveSuccess('Medical records uploaded.');
      window.setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to upload records');
    } finally {
      setIsUploadingRecord(false);
    }
  };

  const svgElementToPngDataUrl = (svg: SVGSVGElement) =>
    new Promise<string>((resolve, reject) => {
      try {
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svg);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width || 200;
            canvas.height = img.height || 200;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas not supported');
            ctx.drawImage(img, 0, 0);
            const png = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            resolve(png);
          } catch (e) {
            URL.revokeObjectURL(url);
            reject(e);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to render SVG'));
        };
        img.src = url;
      } catch (e) {
        reject(e);
      }
    });

  const handleDownloadRecords = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      patient: {
        id: patient?.id,
        patientCode,
        name: `${formData.firstName} ${formData.lastName}`.trim() || patient?.name || '',
        ...formData,
      },
      medicalRecords,
      qrPayload,
    };

    // Try to generate a PDF using jspdf; fallback to JSON download if unavailable
    try {
      const mod = await import('jspdf');
      const { jsPDF } = mod as any;

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      const valueColor = [17, 24, 39] as const;

      const drawHeader = (title: string, subtitle: string) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.setTextColor(17, 24, 39);
        pdf.text(title, margin, 18);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text(subtitle, margin, 24);
      };


      const drawField = (label: string, value: string, x: number, y: number, width: number) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105);
        pdf.text(label, x, y);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(...valueColor);
        const wrapped = pdf.splitTextToSize(value || 'N/A', width);
        pdf.text(wrapped, x, y + 5);
        return y + 5 + wrapped.length * 4.5 + 2;
      };

      const drawSection = (title: string, startY: number) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.text(title, margin, startY);
        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, startY + 2, pageWidth - margin, startY + 2);
        return startY + 8;
      };

      const safeValue = (value: unknown) =>
        value === null || value === undefined || String(value).trim() === '' ? 'N/A' : String(value);

      drawHeader('Patient Records', `${payload.patient.name} - ${payload.patient.patientCode}`);

      const identityTop = 30;
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(margin, identityTop, contentWidth, 32, 3, 3, 'S');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Full Name', margin + 4, identityTop + 8);
      pdf.text('Patient Code', margin + 4, identityTop + 21);
      pdf.text('Date of Birth', margin + contentWidth / 2 + 4, identityTop + 8);
      pdf.text('Gender', margin + contentWidth / 2 + 4, identityTop + 21);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(...valueColor);
      pdf.text(safeValue(payload.patient.name), margin + 24, identityTop + 8);
      pdf.text(safeValue(payload.patient.patientCode), margin + 27, identityTop + 21);
      pdf.text(safeValue(payload.patient.dateOfBirth), margin + contentWidth / 2 + 24, identityTop + 8);
      pdf.text(safeValue(payload.patient.gender), margin + contentWidth / 2 + 17, identityTop + 21);

      let y = 72;
      y = drawSection('Contact Information', y);
      y = drawField('Phone', safeValue(payload.patient.phone), margin, y, contentWidth);
      y = drawField('Email', safeValue(payload.patient.email), margin, y, contentWidth);
      y = drawField('Address', safeValue([payload.patient.address, payload.patient.city, payload.patient.zipCode].filter(Boolean).join(', ')), margin, y, contentWidth);

      y += 2;
      y = drawSection('Medical Information', y);
      y = drawField('Blood Type', safeValue(payload.patient.bloodType), margin, y, contentWidth);
      y = drawField('Allergies', safeValue(payload.patient.allergies), margin, y, contentWidth);
      y = drawField('Current Medications', safeValue(payload.patient.medications), margin, y, contentWidth);
      y = drawField('Emergency Contact', safeValue(payload.patient.emergencyContact), margin, y, contentWidth);
      y = drawField('Emergency Phone', safeValue(payload.patient.emergencyPhone), margin, y, contentWidth);

      // embed QR image if available
      try {
        const svg = qrRef.current?.querySelector('svg') as SVGSVGElement | null;
        if (svg) {
          const pngData = await svgElementToPngDataUrl(svg);
          pdf.addImage(pngData, 'PNG', pageWidth - 52, 12, 38, 38);
        }
      } catch (e) {
        // ignore QR embed failures
      }

      if (medicalRecords.length > 0) {
        pdf.addPage();
        drawHeader('Uploaded Medical Records', `${patientCode} - ${medicalRecords.length} file${medicalRecords.length === 1 ? '' : 's'}`);

        let recordY = 30;
        const ensureSpace = (needed: number) => {
          if (recordY + needed <= pageHeight - margin) return;
          pdf.addPage();
          drawHeader('Uploaded Medical Records', `${patientCode} - continued`);
          recordY = 30;
        };

        medicalRecords.forEach((record, index) => {
          const isImage = getFileKind(record.type) === 'image';
          const blockHeight = isImage && record.dataUrl ? 44 : 22;
          ensureSpace(blockHeight);

          pdf.setDrawColor(226, 232, 240);
          pdf.roundedRect(margin, recordY, contentWidth, blockHeight - 2, 3, 3, 'S');

          if (isImage && record.dataUrl) {
            const imageFormat = record.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            pdf.addImage(record.dataUrl, imageFormat, margin + 4, recordY + 4, 30, 30);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            pdf.setTextColor(15, 23, 42);
            pdf.text(record.name, margin + 40, recordY + 10);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.setTextColor(71, 85, 105);
            pdf.text(`Image - ${formatBytes(record.size)}`, margin + 40, recordY + 16);
            pdf.text(`Uploaded ${new Date(record.uploadedAt).toLocaleString()}`, margin + 40, recordY + 22);
          } else {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            pdf.setTextColor(15, 23, 42);
            pdf.text(`${index + 1}. ${record.name}`, margin + 4, recordY + 8);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.setTextColor(71, 85, 105);
            pdf.text(`${record.type || 'file'} - ${formatBytes(record.size)} - ${new Date(record.uploadedAt).toLocaleString()}`, margin + 4, recordY + 14);
          }

          recordY += blockHeight + 4;
        });
      }

      pdf.save(`${patientCode}-records.pdf`);
      setSaveSuccess('PDF downloaded.');
      setTimeout(() => setSaveSuccess(''), 3000);
      return;
    } catch (err) {
      // fallback to JSON
    }

    // Fallback: download JSON
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${patientCode}-records.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setSaveSuccess('Records downloaded.');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to download records');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <UserCircle className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Profile</h1>
            <p className="text-sm text-gray-500">Edit details and save</p>
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

            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">Uploaded Medical Records</h2>
                <span className="text-sm text-gray-500">{medicalRecords.length} file{medicalRecords.length === 1 ? '' : 's'}</span>
              </div>
              <div className="space-y-3">
                {medicalRecords.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                    No files uploaded yet. Add images or PDFs to include them in the downloadable record.
                  </div>
                ) : (
                  medicalRecords.map((record) => {
                    const isImage = getFileKind(record.type) === 'image';
                    return (
                      <div key={record.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                          {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900">{record.name}</p>
                          <p className="text-xs text-gray-500">
                            {record.type || 'file'} - {formatBytes(record.size)}
                          </p>
                        </div>
                        {isImage && record.dataUrl && (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Preview ready</span>
                        )}
                      </div>
                    );
                  })
                )}
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
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={handleUploadRecords}
              />
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                disabled={isUploadingRecord}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition font-semibold"
              >
                <Upload className="h-5 w-5" />
                {isUploadingRecord ? 'Uploading...' : 'Upload Medical Records'}
              </button>
              <button
                type="button"
                onClick={handleDownloadRecords}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
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

              <div ref={qrRef} className="bg-white p-4 rounded-lg mb-4">
                <QRCodeSVG value={qrCodeValue} size={200} level="H" className="w-full h-auto" />
              </div>

              <p className="text-sm text-gray-700 mb-4">
                Show this QR code at any participating facility for instant access to your medical records.
              </p>

              <div className="bg-white rounded-lg p-3 mb-4">
                <p className="text-xs font-mono text-gray-600 break-all">{patientCode}</p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;

