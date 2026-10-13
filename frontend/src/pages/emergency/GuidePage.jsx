import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import {
  ArrowLeft,
  Search,
  X,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Activity
} from '../../components/icons';

const SEVERITY_CONFIG = {
  critical: {
    label: 'Acuity Tier 1 · Critical',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    accentDot: 'bg-rose-600',
  },
  urgent: {
    label: 'Acuity Tier 2 · Urgent',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    accentDot: 'bg-amber-500',
  },
  machine: {
    label: 'Medical Device · Life Support',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    accentDot: 'bg-sky-600',
  },
};

export default function GuidePage({ items, basePath, title, intro, watchHeading = 'Contraindications & Safety Warnings' }) {
  const { id } = useParams();
  const { settings } = useSettings();
  const [q, setQ] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const emergencyNum = settings?.emergencyNumber || '108';
  const item = items.find((i) => i.id === id);

  // ── Guide Not Found ──
  if (id && !item) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-md mx-auto">
          <AlertTriangle size={36} className="text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Protocol Guide Not Found</h1>
          <p className="text-sm text-slate-600 mb-6">
            The requested clinical guide ID is not recognized or has been superseded.
          </p>
          <Link
            to={basePath}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to All {title}</span>
          </Link>
        </div>
      </main>
    );
  }

  // ── Index / List View ──
  if (!item) {
    const filteredList = items.filter((i) => {
      const matchQuery = (i.title + ' ' + i.summary).toLowerCase().includes(q.toLowerCase());
      const matchSeverity = selectedSeverity === 'all' || i.severity === selectedSeverity;
      return matchQuery && matchSeverity;
    });

    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Header Banner */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 bg-white text-slate-700 text-xs font-semibold px-3 py-1 rounded-md border border-slate-200/90 shadow-2xs mb-3">
            <span className="w-2 h-2 rounded-full bg-sky-700" />
            <span className="uppercase font-mono tracking-wider">Clinical Guidance Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-base text-slate-600 leading-relaxed font-light">
            {intro}
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Search ${title.toLowerCase()} (e.g. burns, CPR, bleeding)...`}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                aria-label="Search clinical guides"
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'all', label: 'All Protocols' },
                { id: 'critical', label: 'Critical' },
                { id: 'urgent', label: 'Urgent' },
                { id: 'machine', label: 'Devices' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setSelectedSeverity(pill.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedSeverity === pill.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredList.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
            <Search size={32} className="text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No matching protocols</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Nothing matched your query “{q}”. Try a shorter symptom name or check another category.
            </p>
            <button
              onClick={() => { setQ(''); setSelectedSeverity('all'); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Guides Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((g) => {
            const config = SEVERITY_CONFIG[g.severity] || SEVERITY_CONFIG.urgent;
            return (
              <Link
                key={g.id}
                to={`${basePath}/${g.id}`}
                className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Machine / Step Visual Preview */}
                  <div className="relative aspect-video bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center p-4">
                    {(g.image || g.steps?.[0]?.image) ? (
                      <img
                        src={g.image || g.steps[0].image}
                        alt={g.title}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Activity size={32} className="text-slate-300" />
                    )}
                    <span
                      className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.badgeClass} shadow-2xs flex items-center gap-1.5`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${config.accentDot}`} />
                      {config.label.split('·')[1]?.trim() || config.label}
                    </span>
                  </div>

                  {/* Text Details */}
                  <div className="p-5">
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1">
                      {g.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                      {g.summary}
                    </p>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{g.steps?.length || 0} Illustrated Steps</span>
                  <span className="text-sky-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                    <span>View Guide</span>
                    <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

      </main>
    );
  }

  // ── Detail Step-by-Step View ──
  const config = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.urgent;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to={basePath}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft size={14} />
          <span>Back to All {title}</span>
        </Link>
      </div>

      {/* Guide Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.badgeClass} flex items-center gap-1.5`}>
                <span className={`w-2 h-2 rounded-full ${config.accentDot}`} />
                {config.label}
              </span>
              <span className="text-xs font-mono text-slate-400">·</span>
              <span className="text-xs font-mono text-slate-500">{item.steps.length} Critical Actions</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {item.title}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 font-light leading-relaxed">
              {item.summary}
            </p>
          </div>

          {item.image && (
            <div className="w-full md:w-48 h-36 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-3 flex-shrink-0 shadow-2xs">
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Immediate Call Notice */}
        {item.call && (
          <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-bold text-rose-900 block">
                  Time-Sensitive Critical Emergency
                </strong>
                <p className="text-xs text-rose-700">
                  Dial ambulance hotline immediately before or while performing these steps.
                </p>
              </div>
            </div>
            <a
              href={`tel:${emergencyNum}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs tracking-wide uppercase transition-all shadow-xs shrink-0"
            >
              <PhoneCall size={14} />
              <span>Call {emergencyNum} Now</span>
            </a>
          </div>
        )}
      </div>

      {/* Contraindications / "Do Not Do" Warnings */}
      {(item.dont?.length > 0 || item.watch?.length > 0) && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 sm:p-6 mb-8 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider font-mono mb-2">
                {watchHeading}
              </h2>
              <ul className="space-y-1.5 text-xs sm:text-sm text-amber-800 leading-relaxed">
                {(item.dont || item.watch).map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Numbered Step Cards */}
      <div className="space-y-6">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
          Step-by-Step Response Sequence
        </h2>

        {item.steps.map((s, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs p-5 sm:p-6 flex flex-col md:flex-row items-center gap-6"
          >
            {/* Step Illustration */}
            <div className="w-full md:w-56 h-48 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-4 flex-shrink-0">
              <img
                src={s.image}
                alt={`Step ${index + 1}: ${s.label}`}
                loading="lazy"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Instruction Details */}
            <div className="flex-1 w-full">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono font-bold mb-2">
                <span>ACTION {String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {s.label}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                {s.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Completion & Feedback Card */}
      <div className="mt-10 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center">
        <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">Protocol Complete</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-5">
          Continue monitoring patient vitals until certified paramedics arrive on scene.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={basePath}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            View More Protocols
          </Link>
          <a
            href={`tel:${emergencyNum}`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <PhoneCall size={14} />
            <span>Call Paramedics ({emergencyNum})</span>
          </a>
        </div>
      </div>

    </main>
  );
}
