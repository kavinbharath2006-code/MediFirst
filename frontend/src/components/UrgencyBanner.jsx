import React from 'react';
import { Phone } from 'lucide-react';
import { URGENCY_CONFIG, EMERGENCY_NUMBERS } from '../data/constants';

export default function UrgencyBanner({ urgency, emergencyEscalationRequired, category }) {
  const config = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.uncertain;

  return (
    <div className={`rounded-2xl border-2 p-4 sm:p-5 ${config.bgClass} fade-in`}>
      <div className="flex items-start gap-3">
        {/* Pulse dot */}
        <div className="flex-shrink-0 pt-0.5">
          <span className="relative flex h-4 w-4">
            {urgency === 'emergency' && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotClass} opacity-75`} />
            )}
            <span className={`relative inline-flex rounded-full h-4 w-4 ${config.dotClass}`} />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${config.badgeClass}`}>
              {config.icon} {config.label}
            </span>
            {category && (
              <span className="text-xs text-slate-500 font-medium">{category}</span>
            )}
          </div>
          <p className={`text-sm font-medium ${config.textClass}`}>{config.subLabel}</p>
          <p className="text-xs mt-1 text-slate-500">
            This guidance supports your response — it does not replace professional medical assessment.
          </p>
        </div>

        {/* Emergency call button — shown for emergency urgency */}
        {emergencyEscalationRequired && (
          <div className="flex-shrink-0">
            <a
              href={`tel:${EMERGENCY_NUMBERS.primary}`}
              className="flex flex-col items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded-xl px-3 py-2 transition-colors shadow"
              aria-label={`Call emergency services: ${EMERGENCY_NUMBERS.primary}`}
            >
              <Phone className="w-5 h-5" />
              <span className="text-xs font-bold">{EMERGENCY_NUMBERS.primary}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
