import { useState } from 'react';
import { AlertCircle, CheckCircle, Brain } from 'lucide-react';

interface SymptomCheckerProps {
  onTriageComplete: (data: any) => void;
}

export function SymptomChecker({ onTriageComplete }: SymptomCheckerProps) {
  const [symptoms, setSymptoms] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [triageResult, setTriageResult] = useState<any>(null);

  const getGabayApiConfig = () => {
    const apiKey = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim();
    const base =
      ((import.meta.env.VITE_OPENAI_API_BASE as string | undefined)?.trim() ||
        'https://openrouter.ai/api/v1').replace(/\/$/, '');
    const model =
      (import.meta.env.VITE_OPENAI_MODEL as string | undefined)?.trim() ||
      'openai/gpt-4o-mini';
    return { apiKey, base, model };
  };

  const parseJsonObject = (text: string) => {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    const jsonText = text.slice(start, end + 1);
    try {
      return JSON.parse(jsonText);
    } catch {
      return null;
    }
  };

  const normalizeStringField = (value: unknown, fallback: string) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : fallback;
    }
    return fallback;
  };

  const fetchGabayTriage = async (symptomsText: string) => {
    const { apiKey, base, model } = getGabayApiConfig();
    if (!apiKey) return null;

    try {
      const prompt = `You are Gabay, a health education assistant. Based on the following patient information, provide a JSON object only with the fields: priority, priorityLabel, priorityColor, recommendation, estimatedWait, analysis, matchedSignals, riskScore, symptoms. Use the exact field names. If a field cannot be determined, return an empty string or an empty array (for matchedSignals). Do not include any additional explanation outside the JSON object.\n\nPatient information:\n${symptomsText}`;

      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'FilCare Gabay',
        },
        body: JSON.stringify({
          model,
          temperature: 0.25,
          max_tokens: 500,
          messages: [
            { role: 'system', content: 'You are Gabay, a short health-education assistant for FilCare. Keep answers educational and non-diagnostic.' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const responseText = data.choices?.[0]?.message?.content?.trim() ?? '';
      const json = parseJsonObject(responseText);
      return json;
    } catch {
      return null;
    }
  };

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

  const analyzeSymptoms = async () => {
    setAnalyzing(true);
    setTriageResult(null);

    const allSymptoms = [...selectedSymptoms, symptoms].filter(Boolean).join(', ').toLowerCase();
    const symptomDetails = `Symptoms: ${allSymptoms}
Duration: ${duration || 'unknown'}
Severity: ${severity || 'unknown'}`;

    const apiResult = await fetchGabayTriage(symptomDetails);

    if (apiResult && typeof apiResult.priority === 'string') {
      const normalized = {
        priority: normalizeStringField(apiResult.priority, 'P3'),
        priorityLabel: normalizeStringField(apiResult.priorityLabel, 'Non-Urgent'),
        priorityColor: normalizeStringField(apiResult.priorityColor, 'green'),
        recommendation: normalizeStringField(
          apiResult.recommendation,
          'Telemedicine consultation or next-day clinic appointment'
        ),
        estimatedWait: normalizeStringField(apiResult.estimatedWait, '24-48 hours'),
        symptoms: normalizeStringField(apiResult.symptoms, allSymptoms),
        duration,
        severity,
        riskScore: typeof apiResult.riskScore === 'number' ? apiResult.riskScore : 0,
        matchedSignals: Array.isArray(apiResult.matchedSignals)
          ? apiResult.matchedSignals
          : typeof apiResult.matchedSignals === 'string'
          ? apiResult.matchedSignals.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        analysis: normalizeStringField(
          apiResult.analysis,
          generateAIAnalysis(apiResult.priority, [])
        ),
      };

      setTriageResult(normalized);
      setAnalyzing(false);
      return;
    }

    let priority = 'P3';
    let priorityLabel = 'Non-Urgent';
    let priorityColor = 'green';
    let recommendation = 'Telemedicine consultation or next-day clinic appointment';
    let estimatedWait = '24-48 hours';
    let riskScore = 0;
    const matchedSignals: string[] = [];

    const p1Keywords = ['chest pain', 'severe bleeding', 'shortness of breath', 'difficulty breathing', 'unconscious', 'stroke', 'heart attack', 'severe burn', 'fainting', 'seizure'];
    const p2Keywords = ['high fever', 'deep laceration', 'persistent vomiting', 'severe pain', 'deep cut', 'broken bone', 'severe headache', 'dizziness', 'abdominal pain'];
    const p3Keywords = ['cough', 'sore throat', 'rash', 'fatigue', 'joint pain', 'back pain', 'mild fever'];

    const foundP1 = p1Keywords.filter((keyword) => allSymptoms.includes(keyword));
    const foundP2 = p2Keywords.filter((keyword) => allSymptoms.includes(keyword));
    const foundP3 = p3Keywords.filter((keyword) => allSymptoms.includes(keyword));

    riskScore += foundP1.length * 6;
    riskScore += foundP2.length * 3;
    riskScore += foundP3.length * 1;
    matchedSignals.push(...foundP1, ...foundP2, ...foundP3);

    if (severity === 'severe') riskScore += 4;
    if (severity === 'moderate') riskScore += 2;

    if (duration === 'less-than-1-hour' && (severity === 'severe' || foundP1.length > 0)) riskScore += 3;
    if (duration === '1-6-hours') riskScore += 1;
    if (duration === 'more-than-week' && foundP1.length === 0) riskScore -= 1;

    if (foundP1.length > 0 || riskScore >= 8) {
      priority = 'P1';
      priorityLabel = 'Immediate';
      priorityColor = 'red';
      recommendation = 'IMMEDIATE EMERGENCY CARE REQUIRED - Proceed to nearest ER';
      estimatedWait = '0-15 minutes';
    } else if (foundP2.length > 0 || riskScore >= 4) {
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
      riskScore,
      matchedSignals,
      analysis: generateAIAnalysis(priority, matchedSignals),
    };

    setTriageResult(result);
    setAnalyzing(false);
  };

  const generateAIAnalysis = (priority: string, matchedSignals: string[]) => {
    const signalsText = matchedSignals.length > 0
      ? ` Key indicators detected: ${matchedSignals.slice(0, 5).join(', ')}.`
      : '';
    if (priority === 'P1') {
      return `AI has detected potentially life-threatening symptoms. Immediate medical attention is crucial and emergency room care is recommended.${signalsText}`;
    } else if (priority === 'P2') {
      return `AI analysis indicates symptoms that need prompt medical attention. While not immediately life-threatening, they should be evaluated within 1-2 hours to prevent complications.${signalsText}`;
    } else {
      return `AI assessment suggests routine medical care is appropriate. Your symptoms currently appear non-urgent and can likely be managed through telemedicine or a scheduled clinic visit. Monitor for worsening symptoms.${signalsText}`;
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
            <p className="text-gray-700 font-medium">{triageResult.recommendation}</p>
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
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Example: Sharp pain in lower right abdomen, started this morning..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          disabled={analyzing || (selectedSymptoms.length === 0 && !symptoms)}
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
