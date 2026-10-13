import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import {
  AlertTriangle,
  BookOpen,
  Stethoscope,
  SlidersHorizontal
} from '../../components/icons';

const SUB_LINKS = [
  { to: '/emergency', label: 'Emergency Triage', icon: AlertTriangle },
  { to: '/first-aid', label: 'First Aid Guides', icon: BookOpen },
  { to: '/machines', label: 'Medical Devices', icon: Stethoscope },
  { to: '/settings', label: 'Preferences', icon: SlidersHorizontal },
];

export default function Layout() {
  const { settings } = useSettings();
  const location = useLocation();

  const isCurrent = (to) => {
    if (to === '/emergency') return location.pathname === '/emergency';
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-16 antialiased">
      {/* Sleek Sub-navigation Tabs */}
      <div className="bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2.5 overflow-x-auto no-scrollbar gap-2">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {SUB_LINKS.map((link) => {
                const Icon = link.icon;
                const active = isCurrent(link.to);
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      active
                        ? 'bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <Icon size={14} className={active ? 'text-sky-700' : 'text-slate-500'} />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-500 flex-shrink-0 pl-4 border-l border-slate-200">
              <span>Hotline Active:</span>
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {settings?.emergencyNumber || '108'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Outlet Content */}
      <Outlet />
    </div>
  );
}
