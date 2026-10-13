import React from 'react';
import { PhoneCall, ShieldAlert, AlertTriangle, CheckCircle2, Info } from './icons';
import { EMERGENCY_NUMBERS } from '../data/constants';

const URGENCY_PRESETS = {
  CRITICAL: {
    label: 'Acuity Tier 1 · Critical Resuscitation',
    subLabel: 'Immediate bystander intervention & EMS dispatch required',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    containerClass: 'bg-white border-l-4 border-l-rose-700 border-y border-r border-slate-200/90',
    textClass: 'text-rose-950',
    dotClass: 'bg-rose-600',
    icon: ShieldAlert,
  },
  emergency: {
    label: 'Acuity Tier 1 · Resuscitation Priority',
    subLabel: 'Immediate bystander action & emergency escalation required',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    containerClass: 'bg-white border-l-4 border-l-rose-700 border-y border-r border-slate-200/90',
    textClass: 'text-rose-950',
    dotClass: 'bg-rose-600',
    icon: ShieldAlert,
  },
  HIGH: {
    label: 'Acuity Tier 2 · Urgent Evaluation',
    subLabel: 'Rapid intervention indicated; prompt facility transport required',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    containerClass: 'bg-white border-l-4 border-l-amber-500 border-y border-r border-slate-200/90',
    textClass: 'text-amber-950',
    dotClass: 'bg-amber-500',
    icon: AlertTriangle,
  },
  urgent: {
    label: 'Acuity Tier 2 · Urgent Evaluation',
    subLabel: 'Stabilize and prepare patient for rapid medical handoff',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    containerClass: 'bg-white border-l-4 border-l-amber-500 border-y border-r border-slate-200/90',
    textClass: 'text-amber-950',
    dotClass: 'bg-amber-500',
    icon: AlertTriangle,
  },
  MODERATE: {
    label: 'Acuity Tier 3 · Semi-Urgent Care',
    subLabel: 'Standard first-aid stabilization; clinical assessment recommended',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    containerClass: 'bg-white border-l-4 border-l-sky-600 border-y border-r border-slate-200/90',
    textClass: 'text-slate-900',
    dotClass: 'bg-sky-600',
    icon: Info,
  },
  LOW: {
    label: 'Acuity Tier 4 · Non-Emergency Care',
    subLabel: 'Minor presentation; apply basic first-aid hygiene and monitor',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    containerClass: 'bg-white border-l-4 border-l-emerald-600 border-y border-r border-slate-200/90',
    textClass: 'text-slate-900',
    dotClass: 'bg-emerald-600',
    icon: CheckCircle2,
  },
  non_emergency: {
    label: 'Acuity Tier 4 · Routine First-Aid',
    subLabel: 'Self-limiting presentation; monitor for progressive red flags',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    containerClass: 'bg-white border-l-4 border-l-emerald-600 border-y border-r border-slate-200/90',
    textClass: 'text-slate-900',
    dotClass: 'bg-emerald-600',
    icon: CheckCircle2,
  },
  uncertain: {
    label: 'Acuity Tier · Guarded Evaluation',
    subLabel: 'Maintain caution; re-evaluate airway, breathing, and vitals',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    containerClass: 'bg-white border-l-4 border-l-slate-400 border-y border-r border-slate-200/90',
    textClass: 'text-slate-900',
    dotClass: 'bg-slate-400',
    icon: Info,
  },
};

export default function UrgencyBanner({ urgency, emergencyEscalationRequired, category }) {
  // Normalize string/object
  const urgencyKey =
    typeof urgency === 'string'
      ? urgency
      : urgency?.level || 'uncertain';

  const config = URGENCY_PRESETS[urgencyKey] || URGENCY_PRESETS.uncertain;
  const Icon = config.icon;

  const requiresCall =
    emergencyEscalationRequired ||
    urgencyKey === 'CRITICAL' ||
    urgencyKey === 'emergency' ||
    (typeof urgency === 'object' && urgency?.callAmbulance === true);

  return (
    <div className={`rounded-xl p-4 sm:p-5 shadow-2xs ${config.containerClass}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon className="w-4 h-4 text-slate-700 stroke-[2]" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${config.badgeClass}`}>
                {config.label}
              </span>
              {category && (
                <span className="text-xs font-mono font-medium text-slate-500 uppercase">
                  [{category}]
                </span>
              )}
            </div>

            <p className={`text-sm font-semibold tracking-tight ${config.textClass}`}>
              {config.subLabel}
            </p>

            <p className="text-[11px] text-slate-500 leading-normal">
              Validated with Manchester Triage Group & ERC 2024 Decision Support Criteria.
            </p>
          </div>
        </div>

        {requiresCall && (
          <div className="flex-shrink-0 self-end sm:self-auto">
            <a
              href={`tel:${EMERGENCY_NUMBERS.primary}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs transition-colors focus:ring-2 focus:ring-rose-500"
              aria-label={`Dispatch emergency services: ${EMERGENCY_NUMBERS.primary}`}
            >
              <PhoneCall className="w-3.5 h-3.5 stroke-[2]" />
              <span>EMS Direct ({EMERGENCY_NUMBERS.primary})</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
