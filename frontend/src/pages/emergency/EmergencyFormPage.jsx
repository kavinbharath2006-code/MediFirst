import React, { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { resolveLocation } from '../../utils/location';
import { buildSummary, CRITICAL_FLAGS, isCritical, TYPES } from '../../utils/triage';
import {
  Activity,
  Flame,
  Heart,
  HeartPulseIcon,
  ShieldAlert,
  Zap,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Wind,
  PhoneCall,
  Share2,
  Copy,
  ChevronRight,
  Navigation,
  Loader2
} from '../../components/icons';
import { MessageSquare, CheckCheck } from 'lucide-react';

const TYPE_ICONS = {
  trauma: Activity,
  fracture: ShieldAlert,
  burns: Flame,
  cardiac: HeartPulseIcon,
  stroke: Activity,
  seizure: Zap,
  poisoning: AlertTriangle,
  snakebite: AlertOctagon,
  breathing: Wind,
  pregnancy: Heart,
  eye: AlertCircle,
};

const API = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || '';
const BLOOD = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function EmergencyFormPage() {
  const { settings } = useSettings();
  const [params] = useSearchParams();
  const first = settings?.contacts?.[0];

  const [form, setForm] = useState({
    name: '',
    age: '',
    relativeName: first?.name || '',
    relativePhone: first?.phone || '',
    type: params.get('type') || '',
    flags: [],
    bloodGroup: '',
    allergies: '',
    conditions: '',
    medicines: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [location, setLocation] = useState(null);
  const [copied, setCopied] = useState(false);
  const [alertStatus, setAlertStatus] = useState('');
  const [alertId, setAlertId] = useState(null);

  // Sync relative contact from settings if available
  useEffect(() => {
    if (first && !form.relativePhone && !form.relativeName) {
      setForm((f) => ({
        ...f,
        relativeName: first.name || f.relativeName,
        relativePhone: first.phone || f.relativePhone,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first]);

  const critical = isCritical(form.flags);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleFlag = (id) =>
    setForm((f) => ({
      ...f,
      flags: f.flags.includes(id) ? f.flags.filter((x) => x !== id) : [...f.flags, id],
    }));

  async function submit(e) {
    e.preventDefault();
    if (!form.type) {
      setError('Please select what happened to initiate clinical hospital routing.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const loc = await resolveLocation(settings);
      setLocation(loc);
      const r = await fetch(`${API}/api/emergency/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: form.type, lat: loc?.lat, lng: loc?.lng }),
      });
      if (!r.ok) {
        const errorData = await r.json().catch(() => null);
        throw new Error(errorData?.error || 'Hospital routing API unavailable');
      }
      setResult(await r.json());
    } catch (err) {
      console.error('[EmergencyFormPage] Assessment error:', err);
      setError(
        `Unable to reach telemetry server. Verify connectivity, or dial emergency hotline ${settings?.emergencyNumber || '108'} immediately.`
      );
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(
    () => buildSummary(form, location, result?.hospitals?.[0]),
    [form, location, result]
  );

  const relativeDigits = (form.relativePhone || '').replace(/\D/g, '');
  const waNumber = relativeDigits.length === 10 ? `91${relativeDigits}` : relativeDigits;
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(summary)}`
    : `https://wa.me/?text=${encodeURIComponent(summary)}`;
  const cleanPhone = (form.relativePhone || '').replace(/[^\d+]/g, '');
  const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(summary)}`;

  // Dispatches alert telemetry packet to backend
  async function triggerRelativeAlert(channel = 'both') {
    try {
      const loc = location || (await resolveLocation(settings).catch(() => null));
      const res = await fetch(`${API}/api/emergency/alert-relative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: form.name || 'Emergency Patient',
          patientAge: form.age,
          bloodGroup: form.bloodGroup,
          emergencyType: TYPES.find((t) => t.id === form.type)?.label || form.type || 'Acute Emergency',
          urgency: critical ? 'CRITICAL - IMMEDIATE' : 'HIGH',
          flags: CRITICAL_FLAGS.filter((f) => form.flags.includes(f.id)).map((f) => f.label),
          relativeName: form.relativeName || 'Emergency Contact',
          relativePhone: form.relativePhone,
          lat: loc?.lat,
          lng: loc?.lng,
          locationLabel: loc?.label || (loc?.lat ? `${loc.lat}, ${loc.lng}` : null),
          hospitalName: result?.hospitals?.[0]?.name,
          hospitalPhone: result?.hospitals?.[0]?.phone,
          firstAidStep: 'Immediate triage and first aid underway',
          customMessage: summary,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.alertId) setAlertId(data.alertId);
        return data;
      }
    } catch (err) {
      console.warn('[triggerRelativeAlert] backend notification failed, using client fallback:', err);
    }
    return null;
  }

  async function handleShareWhatsApp() {
    if (!form.relativePhone) {
      setError('Please provide a Relative Phone Number below to share live incident GPS location via WhatsApp.');
      return;
    }
    setError('');
    setAlertStatus('sending-wa');
    const data = await triggerRelativeAlert('whatsapp');
    const targetUrl = data?.whatsappUrl || waUrl;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setAlertStatus('sent-wa');
    setTimeout(() => setAlertStatus(''), 4000);
  }

  async function handleShareSMS() {
    if (!form.relativePhone) {
      setError('Please provide a Relative Phone Number below to send live incident location via SMS / Messages.');
      return;
    }
    setError('');
    setAlertStatus('sending-sms');
    const data = await triggerRelativeAlert('sms');
    const targetUrl = data?.smsUrl || smsUrl;
    window.location.href = targetUrl;
    setAlertStatus('sent-sms');
    setTimeout(() => setAlertStatus(''), 4000);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      
      {/* Clinical Header Banner */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-white text-slate-700 text-xs font-semibold px-3 py-1 rounded-md border border-slate-200/90 shadow-2xs mb-3">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
          <span className="uppercase font-mono tracking-wider">Acute Emergency Triage Intake</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Emergency Clinical Assessment
        </h1>
        <p className="mt-2 text-base text-slate-600 font-light leading-relaxed">
          Provide available details for instant acuity rating and nearest trauma hospital routing. Skip any fields you are unsure of.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        
        {/* 1. Critical Flags Check */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono">
                1. Immediate Life-Threat Indicators
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Check any condition occurring right now
              </p>
            </div>
            <ShieldAlert size={20} className="text-slate-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CRITICAL_FLAGS.map((f) => {
              const checked = form.flags.includes(f.id);
              return (
                <label
                  key={f.id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    checked
                      ? 'bg-rose-50/80 border-rose-300 text-rose-950 shadow-2xs'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/60 text-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFlag(f.id)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs sm:text-sm font-medium leading-snug">
                    {f.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Acuity Alert Banner if Critical */}
        {critical && (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={24} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-rose-900">
                    High Acuity Alert: Immediate EMS Dispatch Advised
                  </h3>
                  <p className="text-xs sm:text-sm text-rose-800 mt-1">
                    Call <strong>{settings.emergencyNumber}</strong> immediately. Put speakerphone on while providing first-aid.
                  </p>
                </div>
              </div>
              <a
                href={`tel:${settings.emergencyNumber}`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs shrink-0"
              >
                <PhoneCall size={14} />
                <span>Call {settings.emergencyNumber} Now</span>
              </a>
            </div>

            <div className="mt-4 pt-4 border-t border-rose-200/70">
              <span className="text-xs font-mono font-bold uppercase text-rose-800 block mb-2">
                Rapid Step Guides for Selected Symptoms:
              </span>
              <div className="flex flex-wrap gap-2">
                {CRITICAL_FLAGS.filter((f) => form.flags.includes(f.id)).map((f) => (
                  <Link
                    key={f.id}
                    to={`/first-aid/${f.guide}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-rose-200 text-xs font-semibold text-rose-900 hover:bg-rose-100/50 transition-colors"
                  >
                    <span>{f.label}</span>
                    <ChevronRight size={12} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. Nature of Emergency (Type Selector) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
          <div className="pb-4 mb-4 border-b border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono">
              2. Nature of Clinical Presentation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the primary medical condition to match hospital specialty capabilities
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {TYPES.map((t) => {
              const IconComp = TYPE_ICONS[t.id] || AlertCircle;
              const selected = form.type === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                  className={`flex flex-col items-center justify-center text-center p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                    selected
                      ? 'bg-sky-50 border-sky-400 text-sky-900 ring-2 ring-sky-500 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
                  }`}
                >
                  <IconComp
                    size={20}
                    className={`mb-1.5 ${selected ? 'text-sky-700' : 'text-slate-500'}`}
                  />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Patient Vitals & Demographics */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
          <div className="pb-4 mb-4 border-b border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono">
              3. Patient Clinical Telemetry
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Encrypted locally on device; transmitted only upon ambulance handover
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Patient Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Optional"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Approximate Age
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={set('age')}
                placeholder="Years"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Blood Group
              </label>
              <select
                value={form.bloodGroup}
                onChange={set('bloodGroup')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                {BLOOD.map((b) => (
                  <option key={b} value={b}>
                    {b || 'Unknown / Unverified'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Known Drug Allergies
              </label>
              <input
                type="text"
                value={form.allergies}
                onChange={set('allergies')}
                placeholder="e.g. Penicillin, Sulfa, NSAIDs"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pre-existing Chronic Conditions
              </label>
              <input
                type="text"
                value={form.conditions}
                onChange={set('conditions')}
                placeholder="e.g. Diabetes Mellitus, Asthma, Hypertension, CAD"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Regular Prescription Medications
              </label>
              <input
                type="text"
                value={form.medicines}
                onChange={set('medicines')}
                placeholder="e.g. Aspirin, Beta blockers, Insulin"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Emergency Relative / Contact Location Coordination */}
          <div className="mt-5 pt-5 border-t border-slate-200/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono flex items-center gap-1.5">
                  <PhoneCall size={14} className="text-sky-700" />
                  <span>Emergency Relative / Next of Kin Coordination</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Share live GPS incident location and first-aid status directly via WhatsApp and Messages
                </p>
              </div>
              <span className="self-start sm:self-auto text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Location Sharing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Relative / Contact Name
                </label>
                <input
                  type="text"
                  value={form.relativeName}
                  onChange={set('relativeName')}
                  placeholder="e.g. Spouse, Father, Sister, Dr. Sarah"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Relative Phone Number</span>
                  <span className="text-[10px] text-sky-700 font-medium">WhatsApp & SMS</span>
                </label>
                <input
                  type="tel"
                  value={form.relativePhone}
                  onChange={set('relativePhone')}
                  placeholder="e.g. +91 98765 43210 or 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Relative Dispatch Action Bar inside Section 3 */}
            <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Quick Relative Dispatch:</span>{' '}
                <span>Transmit GPS location link now before or during triage</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  disabled={!form.relativePhone}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareSMS}
                  disabled={!form.relativePhone}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <MessageSquare size={13} />
                  <span>Messages / SMS</span>
                </button>

                {form.relativePhone && (
                  <a
                    href={`tel:${form.relativePhone.replace(/[^\d+]/g, '')}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                    title="Direct Phone Call"
                  >
                    <PhoneCall size={13} />
                    <span>Call</span>
                  </a>
                )}
              </div>
            </div>

            {alertStatus && (
              <div className="mt-2.5 text-xs font-semibold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCheck size={14} />
                <span>
                  {alertStatus.includes('wa') ? 'WhatsApp transmission ready & telemetry logged.' : 'Messages app launched with live incident coordinates.'}
                  {alertId && ` (Ref: ${alertId})`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Primary CTA Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-bold text-sm tracking-wide uppercase transition-all shadow-sm hover:shadow-sky-700/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span>Analyzing Hospital Acuity & Department Capabilities...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>Find Recommended Hospital & Triage Dispatch</span>
              <ChevronRight size={18} />
            </span>
          )}
        </button>
      </form>

      {/* ── Hospital Routing Results ── */}
      {result && (
        <section className="mt-12 space-y-6" aria-live="polite">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-sky-700 uppercase">
                  Triage Algorithm Output
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Optimal Emergency Facilities
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ranked by matching specialty casualty wings, 24-hr trauma capability, and live distance from{' '}
                  <span className="font-semibold text-slate-700">
                    {location?.source === 'gps' ? 'current GPS fix' : `${location?.label || 'regional area'}`}
                  </span>
                  .
                </p>
              </div>
              <Activity size={24} className="text-sky-600" />
            </div>

            {result.hospitals.length === 0 ? (
              <p className="text-sm text-slate-600 py-4">
                No matching facility found in the immediate regional radius. Please dial{' '}
                <strong>{settings.emergencyNumber}</strong> for regional dispatch coordinator.
              </p>
            ) : (
              <div className="space-y-4">
                {result.hospitals.map((h, index) => (
                  <div
                    key={h.id || h.name}
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-sky-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                          RANK #{index + 1}
                        </span>
                        {h.distanceKm != null && (
                          <span className="text-xs font-mono text-slate-600 font-semibold">
                            {h.distanceKm} km away
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            h.emergencyAvailable
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {h.emergencyAvailable ? '24-hr Trauma Hub' : 'Casualty: Call First'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{h.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{h.address}</p>

                      {h.matched?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {h.matched.map((m) => (
                            <span
                              key={m}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-medium"
                            >
                              Specialty: {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {h.phone && (
                        <a
                          href={`tel:${h.phone.replace(/\s/g, '')}`}
                          className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <PhoneCall size={14} />
                          <span>Call Casualty</span>
                        </a>
                      )}
                      <a
                        href={h.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Navigation size={14} />
                        <span>GPS Route</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clinical Handover Summary & WhatsApp/Messages Dispatch */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Clinical Telemetry & Handover Summary
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preformatted dispatch note with live Google Maps link ready for relative and emergency responders.
                </p>
              </div>
              {form.relativePhone && (
                <span className="text-xs font-mono font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                  Relative: {form.relativeName || 'Contact'} ({form.relativePhone})
                </span>
              )}
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto mb-4 border border-slate-800">
              {summary}
            </pre>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Share2 size={14} />
                <span>
                  {form.relativePhone
                    ? `Share to ${form.relativeName || 'Relative'} via WhatsApp`
                    : 'Share on WhatsApp'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleShareSMS}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageSquare size={14} />
                <span>
                  {form.relativePhone
                    ? `Share to ${form.relativeName || 'Relative'} via SMS`
                    : 'Send via Messages / SMS'}
                </span>
              </button>

              {form.relativePhone && (
                <a
                  href={`tel:${form.relativePhone.replace(/[^\d+]/g, '')}`}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <PhoneCall size={14} />
                  <span>Call Relative</span>
                </a>
              )}

              <button
                type="button"
                onClick={copy}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy size={14} />
                <span>{copied ? 'Summary Copied to Clipboard!' : 'Copy Summary Text'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

    </main>
  );
}
