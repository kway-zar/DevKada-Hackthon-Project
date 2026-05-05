import { useState } from "react";
import { AuthModal } from "./components/AuthModal";
import { Button } from "./components/ui/button";
import { Activity, Heart } from "lucide-react";

export default function App() {
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<'patient' | 'provider' | null>(null);

  const handleAuthSuccess = (type: 'patient' | 'provider') => {
    setIsAuthenticated(true);
    setUserType(type);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setShowAuthModal(true);
  };

  return (
    <div className="size-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                FilCare
              </span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            </div>
          </div>

          {isAuthenticated && (
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {!isAuthenticated ? (
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl">
                  <Activity className="w-12 h-12 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h1 className="text-4xl bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Welcome to FilCare
              </h1>
              <p className="text-lg text-muted-foreground">
                Your comprehensive hospital booking and triage system.
                Book appointments, manage medical records, and access quality healthcare.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="p-6 bg-white rounded-2xl shadow-lg border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="mb-2">AI-Powered Triage</h3>
                <p className="text-sm text-muted-foreground">
                  Smart symptom analysis with P1/P2/P3 priority classification
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl shadow-lg border border-indigo-100">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Heart className="w-6 h-6 text-indigo-600 fill-indigo-600" />
                </div>
                <h3 className="mb-2">Virtual Queue</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time queue tracking with estimated wait times
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl shadow-lg border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="mb-2">Medical Records</h3>
                <p className="text-sm text-muted-foreground">
                  Secure access to your health history with QR codes
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowAuthModal(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 shadow-xl"
            >
              Get Started
            </Button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  Welcome to FilCare!
                </h2>
                <p className="text-lg text-muted-foreground">
                  You're logged in as a <span className="text-blue-600">{userType}</span>
                </p>
                <div className="pt-6">
                  <p className="text-muted-foreground">
                    Hi me the {userType === 'patient' ? 'patient portal' : 'healthcare provider dashboard'} blahblahblah.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}