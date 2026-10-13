// Merge into your existing router. Your <App /> must be wrapped in <SettingsProvider>.
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import Layout from './components/Layout';
import EmergencyFormPage from './pages/EmergencyFormPage';
import FirstAidPage from './pages/FirstAidPage';
import MachinesPage from './pages/MachinesPage';
import SettingsPage from './pages/SettingsPage';
import './styles/emergency.css';

export default function AppRoutes() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/emergency" element={<EmergencyFormPage />} />
            <Route path="/first-aid" element={<FirstAidPage />} />
            <Route path="/first-aid/:id" element={<FirstAidPage />} />
            <Route path="/machines" element={<MachinesPage />} />
            <Route path="/machines/:id" element={<MachinesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/emergency" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}
