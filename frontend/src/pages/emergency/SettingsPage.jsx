import React, { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { AREAS, getPosition, permissionState } from '../../utils/location';
import {
  MapPin,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Plus
} from '../../components/icons';

const STATE_CONFIG = {
  granted: {
    label: 'Authorized by Browser',
    pillClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  prompt: {
    label: 'Awaiting User Prompt',
    pillClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  denied: {
    label: 'Permission Denied',
    pillClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  unknown: {
    label: 'Status Pending',
    pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export default function SettingsPage() {
  const { settings, update, reset } = useSettings();
  const [perm, setPerm] = useState('unknown');
  const [msg, setMsg] = useState('');
  const [contact, setContact] = useState({ name: '', phone: '' });

  useEffect(() => {
    permissionState().then(setPerm);
  }, []);

  async function enableLocation() {
    setMsg('');
    try {
      await getPosition();
      update({ useLocation: true });
      setPerm('granted');
      setMsg('Precise geolocation enabled. Hospitals will be ranked strictly by travel distance.');
    } catch {
      update({ useLocation: false });
      setPerm(await permissionState());
      setMsg('Location access was denied or timed out. Default regional fallback area will be used.');
    }
  }

  function addContact(e) {
    e.preventDefault();
    const phone = contact.phone.replace(/[^\d+]/g, '');
    if (phone.length < 10) {
      setMsg('Please enter a valid phone number with at least 10 digits.');
      return;
    }
    update({ contacts: [...settings.contacts, { name: contact.name.trim(), phone }] });
    setContact({ name: '', phone: '' });
    setMsg('');
  }

  function clearAll() {
    if (window.confirm('Delete all saved clinical contacts, custom settings, and device cache?')) {
      reset();
      try {
        localStorage.clear();
      } catch {
        /* ignore */
      }
      setMsg('Device settings restored to default baseline.');
    }
  }

  const permConfig = STATE_CONFIG[perm] || STATE_CONFIG.unknown;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      
      {/* Header Banner */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-white text-slate-700 text-xs font-semibold px-3 py-1 rounded-md border border-slate-200/90 shadow-2xs mb-3">
          <span className="w-2 h-2 rounded-full bg-sky-700" />
          <span className="uppercase font-mono tracking-wider">Device Configuration & Contacts</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          System Preferences
        </h1>
        <p className="mt-2 text-base text-slate-600 font-light leading-relaxed">
          Configure regional dispatch numbers, telemetry sensor permissions, and emergency notification contacts.
        </p>
      </div>

      {msg && (
        <div className="mb-6 p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 size={16} className="text-sky-700 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <div className="space-y-6">
        
        {/* 1. Geolocation Telemetry */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono">
                1. GPS Telemetry & Facility Routing
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculates real-time transit distance to 24-hr trauma centers
              </p>
            </div>
            <MapPin size={20} className="text-sky-600" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Sensor Permission Status
                </span>
                <span className="text-xs text-slate-500">Browser Geolocation API</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${permConfig.pillClass}`}>
                {permConfig.label}
              </span>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.useLocation}
                onChange={(e) => (e.target.checked ? enableLocation() : update({ useLocation: false }))}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-xs sm:text-sm font-medium text-slate-700">
                Automatically query GPS sensors for nearby hospital queries
              </span>
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Regional Fallback Area (When GPS is unavailable)
              </label>
              <select
                value={settings.area}
                onChange={(e) => update({ area: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                {Object.entries(AREAS).map(([k, a]) => (
                  <option key={k} value={k}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Emergency Hotline Number */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono">
                2. Emergency Telephony Hotline
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customizes primary one-click dispatch destination
              </p>
            </div>
            <PhoneCall size={20} className="text-rose-600" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default National / Regional Hotline
            </label>
            <div className="flex gap-3">
              <select
                value={settings.emergencyNumber}
                onChange={(e) => update({ emergencyNumber: e.target.value })}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="108">108 — National Emergency Medical Services / Ambulance</option>
                <option value="112">112 — Unified National Emergency Hotline</option>
                <option value="102">102 — Maternity & Pediatric Emergency Transport</option>
              </select>
              <a
                href={`tel:${settings.emergencyNumber}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm shrink-0"
                aria-label={`Call ${settings.emergencyNumber}`}
              >
                <PhoneCall size={15} />
                <span>Call Now</span>
              </a>
            </div>
          </div>
        </div>

        {/* 3. Emergency Contacts */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono">
                3. Designee Emergency Contacts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                The primary contact receives your auto-generated clinical handover via WhatsApp
              </p>
            </div>
            <ShieldCheck size={20} className="text-emerald-600" />
          </div>

          {settings.contacts.length === 0 ? (
            <p className="text-xs text-slate-500 mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
              No contacts registered yet. Add a family member or physician below.
            </p>
          ) : (
            <div className="space-y-2 mb-4">
              {settings.contacts.map((c, i) => (
                <div
                  key={c.phone + i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div>
                    <strong className="text-xs sm:text-sm font-bold text-slate-900 block">
                      {c.name || 'Primary Contact'}
                    </strong>
                    <span className="text-xs font-mono text-slate-500">{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${c.phone}`}
                      className="p-1.5 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-lg border border-emerald-200 hover:border-emerald-600 transition-all active:scale-95"
                      aria-label={`Call ${c.name || c.phone}`}
                      title={`Call ${c.phone}`}
                    >
                      <PhoneCall size={15} />
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        update({ contacts: settings.contacts.filter((_, j) => j !== i) })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      aria-label="Remove contact"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Contact Form */}
          <form onSubmit={addContact} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <input
              type="text"
              value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
              placeholder="Contact Name"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <input
              type="tel"
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              placeholder="Phone (e.g. 9876543210)"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Plus size={16} />
              <span>Add Contact</span>
            </button>
          </form>
        </div>

        {/* 4. Local Data & Cache */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono">
                4. Data Privacy & Local Storage
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Clinical telemetry is strictly stored inside browser localStorage. Zero remote tracking.
              </p>
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Wipe Local Cache
            </button>
          </div>
        </div>

      </div>

    </main>
  );
}
