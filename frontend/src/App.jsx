import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Result from './pages/Result';
import Services from './pages/Services';
import Safety from './pages/Safety';
import EmergencyHeroLandingPage from './pages/EmergencyHeroLandingPage';

// Emergency module imports from pages/emergency
import { SettingsProvider } from './context/SettingsContext';
import {
  EmergencyLayout,
  EmergencyFormPage,
  FirstAidPage,
  MachinesPage,
  SettingsPage,
} from './pages/emergency';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main>
          <Routes>
            {/* Existing Core Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/result" element={<Result />} />
            <Route path="/services" element={<Services />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/dispatch" element={<EmergencyHeroLandingPage />} />
            <Route path="/hero" element={<EmergencyHeroLandingPage />} />

            {/* Isolated Emergency & First-Aid Module */}
            <Route
              element={
                <SettingsProvider>
                  <EmergencyLayout />
                </SettingsProvider>
              }
            >
              <Route path="/emergency" element={<EmergencyFormPage />} />
              <Route path="/first-aid" element={<FirstAidPage />} />
              <Route path="/first-aid/:id" element={<FirstAidPage />} />
              <Route path="/machines" element={<MachinesPage />} />
              <Route path="/machines/:id" element={<MachinesPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Sub-routes under /emergency/* */}
              <Route path="/emergency/first-aid" element={<FirstAidPage />} />
              <Route path="/emergency/first-aid/:id" element={<FirstAidPage />} />
              <Route path="/emergency/machines" element={<MachinesPage />} />
              <Route path="/emergency/machines/:id" element={<MachinesPage />} />
              <Route path="/emergency/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;