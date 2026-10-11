import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Phone } from 'lucide-react';
import { EMERGENCY_NUMBERS } from '../data/constants';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 group"
          aria-label="MediFirst Home"
        >
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center group-hover:bg-teal-700 transition-colors">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">
            Medi<span className="text-teal-600">First</span>
          </span>
        </button>

        {/* Nav links — hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-1">
          <NavLink active={isActive('/')} onClick={() => navigate('/')}>Home</NavLink>
          <NavLink active={isActive('/services')} onClick={() => navigate('/services')}>Nearby Services</NavLink>
          <NavLink active={isActive('/safety')} onClick={() => navigate('/safety')}>Safety Info</NavLink>
        </div>

        {/* Emergency call button */}
        <a
          href={`tel:${EMERGENCY_NUMBERS.primary}`}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
          aria-label={`Call emergency services: ${EMERGENCY_NUMBERS.primary}`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Call</span>
          <span>{EMERGENCY_NUMBERS.primary}</span>
        </a>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden flex border-t border-slate-100">
        <MobileNavLink active={isActive('/')} onClick={() => navigate('/')}>Home</MobileNavLink>
        <MobileNavLink active={isActive('/services')} onClick={() => navigate('/services')}>Services</MobileNavLink>
        <MobileNavLink active={isActive('/safety')} onClick={() => navigate('/safety')}>Safety</MobileNavLink>
      </div>
    </nav>
  );
}

function NavLink({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-teal-50 text-teal-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

function MobileNavLink({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-xs font-medium transition-colors ${
        active ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'
      }`}
    >
      {children}
    </button>
  );
}
