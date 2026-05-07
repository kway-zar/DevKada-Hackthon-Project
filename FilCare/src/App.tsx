import './App.css'
import LandingPage from './pages/LandingPage.tsx'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { PatientPortal } from './components/PatientPortal.tsx'
import { GabayChatbot } from './components/GabayChatbot.tsx'
import { AuthModal } from './components/AuthModal.tsx'
import { clearAuthSession, isAuthSessionExpired, loadAuthSession, saveAuthSession, type AuthRole, type AuthSession } from './lib/supabaseAuth.ts'
import { useEffect, useState, type ReactNode } from 'react'
import { DoctorDashboard } from './components/DoctorDashboard.tsx'
import { Provider } from '@radix-ui/react-tooltip'
import { ProviderDashboard } from './components/ProviderDashboard.tsx'

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
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authRole, setAuthRole] = useState<AuthRole>('patient')
  const [redirectTo, setRedirectTo] = useState('/')

  useEffect(() => {
    const storedSession = loadAuthSession()

    if (!storedSession) {
      return
    }

    if (isAuthSessionExpired(storedSession)) {
      clearAuthSession()
      return
    }

    setSession(storedSession)
  }, [])

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
                  patientData={undefined}
                  setPatientData={function (): void {
                    throw new Error('Function not implemented.')
                  }}
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
                <ProviderDashboard/>
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
