import './App.css'
import LandingPage from './pages/LandingPage.tsx'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { PatientPortal } from './components/PatientPortal.tsx'
import { ProviderDashboard } from './components/ProviderDashboard.tsx'
import { GabayChatbot } from './components/GabayChatbot.tsx'

function App() {

  return (
    <>
      <HashRouter>
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/patient" element={<PatientPortal patientData={undefined} setPatientData={function (): void {
              throw new Error('Function not implemented.')
            } } onBack={function (): void {
              window.location.href = '/';
            } }/> }/>
            <Route path="/provider" element={<ProviderDashboard />} />
          </Routes>
        </main>

      </HashRouter>
      <GabayChatbot />
    </>
  )
}

export default App
