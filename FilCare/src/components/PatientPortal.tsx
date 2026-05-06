import { useState } from 'react';
import { ArrowLeft, FileText, MapPin, QrCode, Clock, Activity } from 'lucide-react';
import { FilCareLogo } from './FilCareLogo';
import { SymptomChecker } from './SymptomChecker';
import { PreRegistration } from './PreRegistration';
import { FacilityFinder } from './FacilityFinder';
import { PatientQueue } from './PatientQueue';
import { PatientRecord } from './PatientRecord';

interface PatientPortalProps {
  patientData: any;
  setPatientData: (data: any) => void;
  onBack: () => void;
}

type PatientView = 'symptom' | 'preregister' | 'facilities' | 'queue' | 'record';

export function PatientPortal({ patientData, setPatientData, onBack }: PatientPortalProps) {
  const [activeView, setActiveView] = useState<PatientView>('symptom');
  const [triageData, setTriageData] = useState<any>(null);

  const menuItems = [
    { id: 'symptom' as PatientView, label: 'Symptoms', icon: Activity, shortLabel: 'Symptoms' },
    { id: 'preregister' as PatientView, label: 'Register', icon: FileText, shortLabel: 'Register' },
    { id: 'facilities' as PatientView, label: 'Facilities', icon: MapPin, shortLabel: 'Find' },
    { id: 'queue' as PatientView, label: 'Queue', icon: Clock, shortLabel: 'Queue' },
    { id: 'record' as PatientView, label: 'Records', icon: QrCode, shortLabel: 'Records' },
  ];

  return (
    <div className="size-full flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <FilCareLogo size="sm" showText={false} />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-gray-900">Patient Portal</h1>
                {patientData && (
                  <p className="text-xs text-gray-500">ID: {patientData.id}</p>
                )}
              </div>
            </div>
          </div>
          {patientData && (
            <div className="hidden sm:block text-right">
              <p className="font-medium text-gray-900 text-sm">{patientData.name}</p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - with padding for bottom nav on mobile */}
      <div className="block md:hidden flex-1 overflow-auto pb-20 sm:pb-0">
        {activeView === 'symptom' && (
          <SymptomChecker
            onTriageComplete={(data) => {
              setTriageData(data);
              if (!patientData) {
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
              setPatientData(data);
              setActiveView('facilities');
            }}
          />
        )}
        {activeView === 'facilities' && (
          <FacilityFinder
            triageData={triageData}
            onFacilitySelect={() => {
              setActiveView('queue');
            }}
          />
        )}
        {activeView === 'queue' && (
          <PatientQueue patientData={patientData} triageData={triageData} />
        )}
        {activeView === 'record' && <PatientRecord patientData={patientData} />}
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {menuItems.map((item) => {
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
            {menuItems.map((item) => {
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
        {activeView === 'symptom' && (
          <SymptomChecker
            onTriageComplete={(data) => {
              setTriageData(data);
              if (!patientData) {
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
              setPatientData(data);
              setActiveView('facilities');
            }}
          />
        )}
        {activeView === 'facilities' && (
          <FacilityFinder
            triageData={triageData}
            onFacilitySelect={() => {
              setActiveView('queue');
            }}
          />
        )}
        {activeView === 'queue' && (
          <PatientQueue patientData={patientData} triageData={triageData} />
        )}
        {activeView === 'record' && <PatientRecord patientData={patientData} />}
      </div>
    </div>
  );
}
