import React from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  CheckCircle2,
  XCircle,
  MapPin,
  Mic,
  ShieldAlert,
  PhoneCall,
} from '../components/icons';
import { EMERGENCY_NUMBERS } from '../data/constants';

const cardVariant = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Safety() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-16 antialiased">
      {/* Header Banner */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-white text-slate-700 text-xs font-semibold px-3 py-1 rounded-full border border-slate-200/90 shadow-2xs mb-3">
          <span className="w-2 h-2 rounded-full bg-crimson-600" />
          <span className="uppercase font-mono tracking-wider">Clinical Governance & Legal Framework</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-carbon tracking-tight">
          Safety Standards & Compliance
        </h1>
        <p className="mt-2 text-base text-slate-600 font-light leading-relaxed">
          Critical disclaimers, triage limitations, data protection standards, and verified national emergency hotlines.
        </p>
      </div>

      <div className="space-y-6">
        {/* Critical Warning Card */}
        <motion.div
          custom={0}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-2xs"
        >
          <div className="flex items-start gap-4">
            <ShieldAlert className="w-7 h-7 text-crimson-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-rose-950 text-base mb-2">
                Mandatory Clinical Precaution & Disclaimer
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-rose-900 leading-relaxed font-normal">
                <li className="flex items-start gap-2">
                  <span className="text-crimson-600 font-bold">•</span>
                  <span>MediFirst is a <strong>first-aid decision support tool</strong>, not a licensed diagnostic physician system.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-crimson-600 font-bold">•</span>
                  <span>It does <strong>not</strong> substitute for rapid emergency medical deployment or paramedical intervention.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-crimson-600 font-bold">•</span>
                  <span>For any <strong>life-threatening presentation</strong> (cardiac arrest, severe arterial hemorrhage, respiratory asphyxiation), dial <strong>{EMERGENCY_NUMBERS.primary}</strong> immediately.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-crimson-600 font-bold">•</span>
                  <span>Always seek <strong>in-person clinical medical assessment</strong> at a trauma hospital following any acute injury or illness.</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Emergency Contacts Card */}
        <motion.div
          custom={1}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-card"
        >
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono">
                National Emergency Telephony Hotlines
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official regional dispatch numbers (Republic of India)
              </p>
            </div>
            <PhoneCall className="w-5 h-5 text-crimson-600" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'EMS Primary', number: EMERGENCY_NUMBERS.primary, desc: 'Ambulance & Trauma' },
              { label: 'Paramedic Fleet', number: EMERGENCY_NUMBERS.ambulance, desc: 'Central Dispatch' },
              { label: 'Police Assistance', number: EMERGENCY_NUMBERS.police, desc: 'Emergency Response' },
              { label: 'Fire & Rescue', number: EMERGENCY_NUMBERS.fire, desc: 'Hazardous Materials' },
            ].map((item) => (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className="p-4 rounded-xl border border-slate-200/90 hover:border-crimson-300 hover:bg-slate-50 transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    {item.label}
                  </span>
                  <span className="text-2xl font-bold font-mono text-carbon tracking-tight block group-hover:text-crimson-600 transition-colors">
                    {item.number}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-2 block font-medium">
                  {item.desc}
                </span>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Scope of Practice Comparison */}
        <motion.div
          custom={2}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-card"
        >
          <div className="pb-4 mb-4 border-b border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono">
              Clinical Platform Capabilities & Boundaries
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clear delineation of automated advisory limits vs professional care
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* What MediFirst Does */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4.5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold uppercase tracking-wider font-mono">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Verified System Capabilities</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed font-normal">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Grounded clinical first-aid instructions aligned with ERC 2024 protocols</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Manchester Triage acuity rating (Code Red, Amber, Green)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Multimodal input support (natural language voice & symptom selector)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Proximity hospital department routing via satellite geolocation</span>
                </li>
              </ul>
            </div>

            {/* What MediFirst Does NOT Do */}
            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4.5 space-y-3">
              <div className="flex items-center gap-2 text-rose-950 text-xs font-bold uppercase tracking-wider font-mono">
                <XCircle size={16} className="text-crimson-600" />
                <span>Explicit Clinical Limitations</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed font-normal">
                <li className="flex items-start gap-2">
                  <span className="text-crimson-600 font-bold">✕</span>
                  <span>Does not provide definitive differential medical diagnoses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-crimson-600 font-bold">✕</span>
                  <span>Does not replace hands-on paramedics or emergency room physicians</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-crimson-600 font-bold">✕</span>
                  <span>Does not prescribe prescription pharmacological regimens</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-crimson-600 font-bold">✕</span>
                  <span>Does not initiate automated municipal 911/108 vehicle dispatch</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Privacy & Transient Storage */}
        <motion.div
          custom={3}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-card"
        >
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono">
                Telemetry Privacy & Zero-Retention Security
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compliant with transient edge-processing standards
              </p>
            </div>
            <Lock className="w-5 h-5 text-slate-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed font-light">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
                <MapPin size={14} className="text-crimson-600" />
                <span>Client-Side Geolocation</span>
              </div>
              <span>GPS data is evaluated in-memory for coordinate calculation and is never stored on external databases.</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
                <Mic size={14} className="text-crimson-600" />
                <span>On-Device Speech Processing</span>
              </div>
              <span>Voice inputs are converted via local browser Web Speech APIs without audio streaming to MediFirst servers.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
