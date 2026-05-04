import './App.css'
import LandingPage from './pages/LandingPage.tsx'
import { HashRouter, Route, Routes } from 'react-router-dom'

function App() {
 

  return (
    <>
      <HashRouter>
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </main>

      </HashRouter>
    </>
  )
}

export default App
