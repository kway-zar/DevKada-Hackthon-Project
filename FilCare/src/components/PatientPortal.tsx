import { useState, useEffect } from 'react';
import { LogOut, FileText, MapPin, QrCode, Clock, Activity } from 'lucide-react';
import { FilCareLogo } from './FilCareLogo';
import { SymptomChecker } from './SymptomChecker';
import { PreRegistration } from './PreRegistration';
import { FacilityFinder } from './FacilityFinder';
import { PatientQueue } from './PatientQueue';
import PatientProfile from './PatientProfile';
import { createTriageQueueEntry, loadAuthSession } from '../lib/supabaseAuth';

interface PatientPortalProps {
  patientData: any;
  setPatientData: (data: any) => void;
  onBack: () => void;
}

type PatientView = 'symptom' | 'preregister' | 'facilities' | 'queue' | 'record';

export function PatientPortal({ patientData, setPatientData, onBack }: PatientPortalProps) {
  const [activeView, setActiveView] = useState<PatientView>('symptom');
  const [triageData, setTriageData] = useState<any>(null);
  const [registeredPatient, setRegisteredPatient] = useState<any>(patientData ?? null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [queueSaveError, setQueueSaveError] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [queueEntry, setQueueEntry] = useState<any>(null);

  const menuItems = [
    { id: 'symptom' as PatientView, label: 'Symptoms', icon: Activity, shortLabel: 'Symptoms' },
    { id: 'preregister' as PatientView, label: 'Register', icon: FileText, shortLabel: 'Register' },
    { id: 'facilities' as PatientView, label: 'Facilities', icon: MapPin, shortLabel: 'Find' },
    { id: 'queue' as PatientView, label: 'Queue', icon: Clock, shortLabel: 'Queue' },
    { id: 'record' as PatientView, label: 'Records', icon: QrCode, shortLabel: 'Records' },
  ];

  const hasPatient = Boolean(registeredPatient && (registeredPatient.id || registeredPatient.patientCode || registeredPatient.name));

  const [recordPatient, setRecordPatient] = useState<any>(registeredPatient ?? null);
  const [recordLoading, setRecordLoading] = useState<boolean>(false);
  const [recordError, setRecordError] = useState<string>('');

  useEffect(() => {
    // REGISTRATION VERIFICATION FLOW:
    // 1. Load session from localStorage (filcare-auth-session)
    // 2. Extract userID (which is accounts.id)
    // 3. Query patients table for matching user_id
    // 4. If found: Display patient data and hide Register menu (setIsRegistered = true)
    // 5. If not found: Show Register menu (setIsRegistered = false)
    
    const session = loadAuthSession(); // Load from localStorage: filcare-auth-session
     console.log('Session loaded from localStorage:', session);
     if (!session?.userId) {
       console.log('No session or userID found');
       return; // No session or userID, cannot proceed
     }

    const restBase = ((import.meta.env.VITE_SUPABASE_REST_API as string | undefined) || '').replace(/\/$/, '');
    const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

     if (!restBase || !anonKey) {
       console.log('Missing REST API base or anon key');
       return;
     }

    const mappedFromRow = (patient: any) => ({
      id: patient.id,
      name: patient.full_name,
      firstName: patient.first_name,
      lastName: patient.last_name,
      patientCode: patient.patient_code,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      bloodType: patient.blood_type,
      address: patient.address,
      city: patient.city,
      zipCode: patient.zip_code,
      allergies: patient.allergies,
      medications: patient.medications,
      emergencyContact: patient.emergency_contact_name,
      emergencyPhone: patient.emergency_contact_phone,
      qrToken: patient.qr_token,
    });

    // Query patients by user_id matching the userID from localStorage session
    const url = `${restBase}/patients?select=*&user_id=eq.${session.userId}`;
     console.log('Fetching from URL:', url);
     console.log('Using userID:', session.userId);
   
     fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    })
      .then(async (res) => {
        console.log('Patient fetch response:', res);
         console.log('Response status:', res.status);
         console.log('Response headers:', res.headers);
       
        if (!res.ok) {
          const text = await res.text();
           console.log('Error response text:', text);
          throw new Error(text || 'Failed to load patient');
        }

        return res.json();
      })
      .then((data) => {
        console.log('Patient data received:', data);
        const patient = Array.isArray(data) ? data[0] : data;

        if (patient) {
          // FOUND: Patient record matched with localStorage userID → User is registered
          const mappedPatient = mappedFromRow(patient);
          setRegisteredPatient(mappedPatient); // Display patient data
          setPatientData(mappedPatient);
          setRecordPatient(mappedPatient);
          setIsRegistered(true); // Hide Register from menu, show other menus
          return;
        }

        // NOT FOUND: No patient record for this userID → User is not registered
        setIsRegistered(false); // Show Register in menu
        if (patientData) {
          setRegisteredPatient(patientData);
          setRecordPatient(patientData);
        }
      })
      .catch((err) => {
        console.error('Error loading registered patient:', err);
        setIsRegistered(false); // On error, assume not registered, show Register menu
        if (patientData) {
          setRegisteredPatient(patientData);
          setRecordPatient(patientData);
        }
      });
  }, []);

  useEffect(() => {
    // When user opens Records view, fetch the latest patient data from REST API
    if (activeView !== 'record') return;
    if (!hasPatient) return;

    const restBase = ((import.meta.env.VITE_SUPABASE_REST_API as string | undefined) || '').replace(/\/$/, '');
    const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

    const sourcePatient = registeredPatient ?? patientData;
    const id = encodeURIComponent((sourcePatient?.id ?? sourcePatient?.patientCode ?? ''));
    if (!id) return;

    setRecordLoading(true);
    setRecordError('');

    fetch(`${restBase}/patients?id=eq.${id}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to fetch patient records');
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.length > 0) {
          const patient = data[0];
          const patientDataObj = {
            id: patient.id,
            name: patient.full_name,
            firstName: patient.first_name,
            lastName: patient.last_name,
            patientCode: patient.patient_code,
            email: patient.email,
            phone: patient.phone,
            dateOfBirth: patient.date_of_birth,
            gender: patient.gender,
            bloodType: patient.blood_type,
            address: patient.address,
            city: patient.city,
            zipCode: patient.zip_code,
            allergies: patient.allergies,
            medications: patient.medications,
            emergencyContact: patient.emergency_contact_name,
            emergencyPhone: patient.emergency_contact_phone,
            qrToken: patient.qr_token,
          };
          setRecordPatient(patientDataObj);
        } else {
          setRecordPatient(sourcePatient);
        }
      })
      .catch((err) => {
        setRecordError(err?.message ?? 'Unable to load records');
      })
      .finally(() => setRecordLoading(false));
  }, [activeView, registeredPatient, patientData]);

  const handleFacilitySelect = async (facility: any) => {
    setQueueSaveError('');
    const patient = registeredPatient ?? patientData;

    if (!patient?.id || !triageData) {
      setActiveView('queue');
      return;
    }

    try {
      const result = await createTriageQueueEntry({
        patientId: patient.id,
        facility,
        triageData,
      });
      setSelectedFacility(result.facility || facility);
      setQueueEntry(result.queue);
      setActiveView('queue');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save queue entry';
      if (message.toLowerCase().includes('facilities') || message.toLowerCase().includes('row-level security')) {
        const fallbackQueue = {
          id: `local-${Date.now()}`,
          facility_id: facility.id,
          patient_id: patient.id,
          queue_date: new Date().toISOString().slice(0, 10),
          queue_number: Math.floor(Date.now() % 90) + 10,
          priority: triageData?.priority || 'P3',
          priority_label: triageData?.priorityLabel || 'Standard',
          status: 'waiting',
          check_in_at: new Date().toISOString(),
          estimated_wait_minutes: Number.parseInt(String(facility.waitTime || triageData?.estimatedWait || '30'), 10) || 30,
        };

        setSelectedFacility(facility);
        setQueueEntry(fallbackQueue);
        setQueueSaveError('Facility was not saved to Supabase because of database policy, so this queue is shown locally. Ask an admin to allow facility inserts or seed real facilities.');
        setActiveView('queue');
        return;
      }

      setQueueSaveError(message);
    }
  };

  return (
    <div className="size-full flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FilCareLogo size="sm" showText={false} />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900">Patient Portal</h1>
              {registeredPatient && (
                <p className="text-xs text-gray-500">ID: {registeredPatient.id}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {registeredPatient && (
              <div className="hidden sm:block text-right">
                <p className="font-medium text-gray-900 text-sm">{registeredPatient.name}</p>
              </div>
            )}
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

      {/* Main Content - with padding for bottom nav on mobile */}
      <div className="block md:hidden flex-1 overflow-auto pb-20 sm:pb-0">
        {queueSaveError && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {queueSaveError}
          </div>
        )}
        {activeView === 'symptom' && (
          <SymptomChecker
            onTriageComplete={(data) => {
              setTriageData(data);
              if (!registeredPatient) {
                setActiveView('preregister');
              } else {
                setActiveView('facilities');
              }
            }}
          />
        )}
        {activeView === 'preregister' && (
          <PreRegistration
            onComplete={(data) => {
              setRegisteredPatient(data);
              setPatientData(data);
              setIsRegistered(true); // Mark user as registered after successful patient creation
              setActiveView('facilities');
            }}
          />
        )}
        {activeView === 'facilities' && (
          <FacilityFinder
            triageData={triageData}
            onFacilitySelect={handleFacilitySelect}
          />
        )}
        {activeView === 'queue' && (
          <PatientQueue
            patientData={registeredPatient ?? patientData}
            triageData={triageData}
            selectedFacility={selectedFacility}
            queueEntry={queueEntry}
          />
        )}
        {activeView === 'record' && (
          <PatientProfile patient={registeredPatient ?? patientData} onPatientUpdated={(data) => { setPatientData(data); setRegisteredPatient(data); }} />
        )}
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {menuItems
            .filter((it) => {
              // Hide Register menu if user is registered (isRegistered = true when accounts.id matches patients.user_id)
              return !(isRegistered && it.id === 'preregister');
            })
            .map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 active:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Navigation - Desktop */}
      <div className="hidden sm:flex absolute left-0 top-[57px] bottom-0 w-64 bg-white border-r border-gray-200 z-30">
        <nav className="w-full overflow-y-auto">
          <div className="p-4 space-y-2">
            {menuItems
              .filter((it) => {
                // Hide Register menu if user is registered (isRegistered = true when accounts.id matches patients.user_id)
                return !(isRegistered && it.id === 'preregister');
              })
              .map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Desktop content wrapper */}
      <div className="hidden sm:block absolute left-64 right-0 top-[57px] bottom-0 overflow-auto">
        {queueSaveError && (
          <div className="mx-8 mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {queueSaveError}
          </div>
        )}
        {activeView === 'symptom' && (
          <SymptomChecker
            onTriageComplete={(data) => {
              setTriageData(data);
              if (!registeredPatient) {
                setActiveView('preregister');
              } else {
                setActiveView('facilities');
              }
            }}
          />
        )}
        {activeView === 'preregister' && (
          <PreRegistration
            onComplete={(data) => {
              setRegisteredPatient(data);
              setPatientData(data);
              setIsRegistered(true); // Mark user as registered after successful patient creation
              setActiveView('facilities');
            }}
          />
        )}
        {activeView === 'facilities' && (
          <FacilityFinder
            triageData={triageData}
            onFacilitySelect={handleFacilitySelect}
          />
        )}
        {activeView === 'queue' && (
          <PatientQueue
            patientData={registeredPatient ?? patientData}
            triageData={triageData}
            selectedFacility={selectedFacility}
            queueEntry={queueEntry}
          />
        )}
        {activeView === 'record' && (
          <div className="p-4">
            {recordLoading && <div className="text-sm text-gray-500">Loading records...</div>}
            {recordError && <div className="text-sm text-red-600">{recordError}</div>}
            {!recordLoading && !recordError && (
              <PatientProfile patient={recordPatient ?? registeredPatient ?? patientData} onPatientUpdated={(d) => { setPatientData(d); setRegisteredPatient(d); setRecordPatient(d); }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
