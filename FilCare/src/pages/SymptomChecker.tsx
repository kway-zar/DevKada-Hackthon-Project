import { useState } from 'react';
import { AlertCircle, CheckCircle, Brain } from 'lucide-react';

interface SymptomCheckerProps {
  onTriageComplete: (data: any) => void;
}

export function SymptomChecker({ onTriageComplete }: SymptomCheckerProps) {

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [triageResult, setTriageResult] = useState<any>(null);

  const commonSymptoms = [
    'Fever', 'Cough', 'Headache', 'Chest pain', 'Shortness of breath',
    'Abdominal pain', 'Nausea', 'Vomiting', 'Dizziness', 'Fatigue',
    'Sore throat', 'Rash', 'Back pain', 'Joint pain', 'Severe bleeding'
  ];

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const analyzeSymptoms = () => {
    setAnalyzing(true);

    setTimeout(() => {
      const allSymptoms = selectedSymptoms.join(', ').toLowerCase();

      let priority = 'P3';
      let priorityLabel = 'Non-Urgent';
      let priorityColor = 'green';
      let recommendation = 'Telemedicine consultation or next-day clinic appointment';
      let estimatedWait = '24-48 hours';

      const p1Keywords = ['chest pain', 'severe bleeding', 'shortness of breath', 'difficulty breathing', 'unconscious', 'stroke', 'heart attack', 'severe burn'];
      const p2Keywords = ['high fever', 'deep laceration', 'persistent vomiting', 'severe pain', 'deep cut', 'broken bone', 'severe headache'];

      if (p1Keywords.some(keyword => allSymptoms.includes(keyword))) {
        priority = 'P1';
        priorityLabel = 'Immediate';
        priorityColor = 'red';
        recommendation = 'IMMEDIATE EMERGENCY CARE REQUIRED - Proceed to nearest ER';
        estimatedWait = '0-15 minutes';
      } else if (p2Keywords.some(keyword => allSymptoms.includes(keyword)) || severity === 'severe') {
        priority = 'P2';
        priorityLabel = 'Urgent';
        priorityColor = 'yellow';
        recommendation = 'Hospital or clinic visit within 1-2 hours recommended';
        estimatedWait = '1-2 hours';
      }

      const result = {
        priority,
        priorityLabel,
        priorityColor,
        recommendation,
        estimatedWait,
        symptoms: allSymptoms,
        duration,
        severity,
        analysis: generateAIAnalysis(priority),
      };

      setTriageResult(result);
      setAnalyzing(false);
    }, 2000);
  };

  const generateAIAnalysis = (priority: string) => {
    if (priority === 'P1') {
      return 'AI has detected potentially life-threatening symptoms. Based on the keywords identified, immediate medical attention is crucial. Your symptoms suggest a critical condition that requires emergency room care.';
    } else if (priority === 'P2') {
      return 'AI analysis indicates symptoms that require prompt medical attention. While not immediately life-threatening, these symptoms should be evaluated by a healthcare professional within 1-2 hours to prevent complications.';
    } else {
      return 'AI assessment suggests routine medical care is appropriate. Your symptoms appear to be non-urgent and can likely be managed through telemedicine or a scheduled clinic appointment. Monitor your condition and seek immediate care if symptoms worsen.';
    }
  };

  const handleContinue = () => {
    onTriageComplete(triageResult);
  };

  if (triageResult) {
    const colorClasses = {
      red: {
        bg: 'bg-gradient-to-br from-red-500 to-red-600',
        border: 'border-red-300',
        text: 'text-white',
        badge: 'bg-white text-red-600',
        button: 'bg-white text-red-600 hover:bg-red-50',
      },
      yellow: {
        bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
        border: 'border-yellow-300',
        text: 'text-white',
        badge: 'bg-white text-yellow-600',
        button: 'bg-white text-yellow-600 hover:bg-yellow-50',
      },
      green: {
        bg: 'bg-gradient-to-br from-green-500 to-green-600',
        border: 'border-green-300',
        text: 'text-white',
        badge: 'bg-white text-green-600',
        button: 'bg-white text-green-600 hover:bg-green-50',
      },
    };

    const colors = colorClasses[triageResult.priorityColor as keyof typeof colorClasses];

    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className={`${colors.bg} rounded-3xl p-6 sm:p-8 shadow-2xl`}>
          <div className="flex items-start gap-3 sm:gap-4 mb-6">
            <div className={`${colors.badge} w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0 shadow-lg`}>
              {triageResult.priority}
            </div>
            <div>
              <h2 className={`text-xl sm:text-3xl font-bold ${colors.text} mb-1 sm:mb-2`}>
                {triageResult.priorityLabel}
              </h2>
              <p className={`text-sm sm:text-lg ${colors.text} opacity-90`}>
                Wait: {triageResult.estimatedWait}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Brain className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
                <p className="text-gray-700">{triageResult.analysis}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Recommendation</h3>
            <p className={`${colors.text} font-medium`}>{triageResult.recommendation}</p>
          </div>

          <div className="bg-white rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Reported Symptoms</h3>
            <p className="text-gray-700">{triageResult.symptoms}</p>
            {triageResult.duration && (
              <p className="text-gray-600 text-sm mt-2">Duration: {triageResult.duration}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleContinue}
              className={`flex-1 py-4 px-6 ${colors.button} rounded-xl font-semibold shadow-lg active:scale-98 transition-transform`}
            >
              Continue to Find Facility
            </button>
            <button
              onClick={() => setTriageResult(null)}
              className="sm:flex-none px-6 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 active:scale-98 transition-transform"
            >
              Check Again
            </button>
          </div>

          {triageResult.priority === 'P1' && (
            <div className="mt-6 bg-red-100 border-2 border-red-300 rounded-lg p-4">
              <p className="text-red-900 font-semibold text-center">
                ⚠️ EMERGENCY: If you're experiencing a medical emergency, call your local emergency number immediately (911 in US)
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Symptom Checker</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Tell us about your symptoms and our AI will help assess the urgency
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-8">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Select Common Symptoms
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {commonSymptoms.map((symptom) => (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`px-3 py-3 sm:px-4 sm:py-2 rounded-xl border-2 transition-all text-sm active:scale-95 ${
                  selectedSymptoms.includes(symptom)
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Describe Your Symptoms in Detail
          </label>
          <textarea
            placeholder="Example: Sharp pain in lower right abdomen, started this morning..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              How long have you had these symptoms?
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select duration</option>
              <option value="less-than-1-hour">Less than 1 hour</option>
              <option value="1-6-hours">1-6 hours</option>
              <option value="6-24-hours">6-24 hours</option>
              <option value="1-3-days">1-3 days</option>
              <option value="3-7-days">3-7 days</option>
              <option value="more-than-week">More than a week</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              How severe are your symptoms?
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select severity</option>
              <option value="mild">Mild - Manageable discomfort</option>
              <option value="moderate">Moderate - Noticeable impact on daily activities</option>
              <option value="severe">Severe - Significantly affects quality of life</option>
            </select>
          </div>
        </div>

        <button
          onClick={analyzeSymptoms}
          disabled={analyzing || selectedSymptoms.length === 0}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-98 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg disabled:shadow-none"
        >
          {analyzing ? (
            <>
              <Brain className="w-5 h-5 animate-pulse" />
              AI Analyzing Symptoms...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Analyze with AI Triage
            </>
          )}
        </button>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Important Notice</p>
              <p>
                This AI-assisted triage is for informational purposes only and does not replace
                professional medical advice. In case of emergency, call your local emergency services immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
