import './App.css'
import LandingPage from './pages/LandingPage.tsx'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { PatientPortal } from './components/PatientPortal.tsx'
import { GabayChatbot } from './components/GabayChatbot.tsx'
import { AuthModal } from './components/AuthModal.tsx'
import { clearAuthSession, isAuthSessionExpired, loadAuthSession, saveAuthSession, type AuthRole, type AuthSession } from './lib/supabaseAuth.ts'
import { useEffect, useState, type ReactNode } from 'react'
import { ProviderDashboard } from './components/ProviderDashboard.tsx'
import PatientDetails from './components/Provider-patientDetails.tsx'

function AuthenticatedRoute({
  session,
  requiredRole,
  onRequireAuth,
  children,
}: {
  session: AuthSession | null
  requiredRole: AuthRole
  onRequireAuth: (role: AuthRole, redirectTo: string) => void
  children: ReactNode
}) {
  const location = useLocation()

  useEffect(() => {
    if (!session) {
      onRequireAuth(requiredRole, location.pathname)
    }
  }, [location.pathname, onRequireAuth, requiredRole, session])

  if (!session) {
    return <LandingPage isAuthenticated={false} onRequireAuth={onRequireAuth} />
  }

  return <>{children}</>
}

function AppShell() {
  const navigate = useNavigate()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [patientData, setPatientData] = useState<any>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authRole, setAuthRole] = useState<AuthRole>('patient')
  const [redirectTo, setRedirectTo] = useState('/')

  useEffect(() => {
    const storedSession = loadAuthSession()
    const storedPatientData = window.localStorage.getItem('filcare-patient-data')

    if (!storedSession) {
      if (storedPatientData) {
        try {
          setPatientData(JSON.parse(storedPatientData))
        } catch {
          window.localStorage.removeItem('filcare-patient-data')
        }
      }
      return
    }

    if (isAuthSessionExpired(storedSession)) {
      clearAuthSession()
      return
    }

    setSession(storedSession)

    if (storedPatientData) {
      try {
        setPatientData(JSON.parse(storedPatientData))
      } catch {
        window.localStorage.removeItem('filcare-patient-data')
      }
    }
  }, [])

  useEffect(() => {
    if (patientData) {
      window.localStorage.setItem('filcare-patient-data', JSON.stringify(patientData))
    } else {
      window.localStorage.removeItem('filcare-patient-data')
    }
  }, [patientData])

  const handleRequireAuth = (role: AuthRole, nextPath: string) => {
    setAuthRole(role)
    setRedirectTo(nextPath)
    setAuthModalOpen(true)
  }

  const handleAuthSuccess = (session: AuthSession) => {
    saveAuthSession(session);
    setSession(session);
    setAuthModalOpen(false);
    navigate(redirectTo);
  };

  const handleLogout = () => {
    clearAuthSession();
    setSession(null);
    setPatientData(null);
    setAuthModalOpen(true);
    navigate('/');
  };

  const landingPage = (
    <LandingPage
      isAuthenticated={Boolean(session)}
      onRequireAuth={handleRequireAuth}
    />
  )

  return (
    <>
      <main>
        <Routes>
          <Route path="/" element={landingPage} />
          <Route
            path="/patient"
            element={
              <AuthenticatedRoute
                session={session}
                requiredRole="patient"
                onRequireAuth={handleRequireAuth}
              >
                  <PatientPortal
                    patientData={patientData}
                    setPatientData={setPatientData}
                    onBack={handleLogout}
                  />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/provider"
            element={
              <AuthenticatedRoute
                session={session}
                requiredRole="provider"
                onRequireAuth={handleRequireAuth}
              >
                <ProviderDashboard onBack={handleLogout} />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/provider/patient/:id"
            element={
              <AuthenticatedRoute
                session={session}
                requiredRole="provider"
                onRequireAuth={handleRequireAuth}
              >
                <PatientDetails />
              </AuthenticatedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <AuthModal
        open={authModalOpen}
        defaultUserType={authRole}
        onOpenChange={setAuthModalOpen}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  )
}

function App() {

  return (
    <>
      <HashRouter>
        <AppShell />
      </HashRouter>
      <GabayChatbot />
    </>
  )
}

export default App
