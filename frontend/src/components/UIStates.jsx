import React from 'react';
import { AlertTriangle, AlertOctagon, Info, CheckCircle2, RefreshCw, FileText } from './icons';

/**
 * High-precision clinical skeleton loading state.
 */
export function GuidanceSkeleton() {
  return (
    <div className="space-y-3.5 fade-in" aria-busy="true" aria-label="Synthesizing clinical guidance">
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-3 shadow-2xs">
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-4/5 rounded" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200/90 p-4.5 flex gap-3.5 shadow-2xs">
          <div className="skeleton w-6 h-6 rounded flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-1/4 rounded" />
            <div className="skeleton h-3.5 w-full rounded" />
            <div className="skeleton h-3.5 w-3/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Clinical Error state display with retry.
 */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-white rounded-xl border border-rose-200 p-6 text-center shadow-2xs fade-in">
      <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 mx-auto mb-3">
        <AlertOctagon className="w-5 h-5 stroke-[2]" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1">Clinical Protocol Synthesis Interrupted</h3>
      <p className="text-xs text-slate-600 mb-4 max-w-md mx-auto leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-execute Retrieval</span>
        </button>
      )}
    </div>
  );
}

/**
 * Standard empty state for unpopulated clinical queries.
 */
export function EmptyState({ message, icon: Icon = FileText, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center shadow-2xs fade-in">
      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mx-auto mb-3">
        <Icon className="w-5 h-5 stroke-[1.75]" />
      </div>
      <p className="text-xs text-slate-500 mb-4">{message}</p>
      {children}
    </div>
  );
}

/**
 * Clinical alert notification banner with proper icon containers and hairline borders.
 */
export function AlertBanner({ type = 'warning', children }) {
  const configs = {
    warning: {
      style: 'bg-amber-50/70 border-amber-200 text-amber-950',
      icon: AlertTriangle,
      iconColor: 'text-amber-700',
    },
    error: {
      style: 'bg-rose-50/70 border-rose-200 text-rose-950',
      icon: AlertOctagon,
      iconColor: 'text-rose-700',
    },
    info: {
      style: 'bg-sky-50/70 border-sky-200 text-sky-950',
      icon: Info,
      iconColor: 'text-sky-700',
    },
    success: {
      style: 'bg-emerald-50/70 border-emerald-200 text-emerald-950',
      icon: CheckCircle2,
      iconColor: 'text-emerald-700',
    },
    demo: {
      style: 'bg-slate-50 border-slate-200 text-slate-800',
      icon: FileText,
      iconColor: 'text-slate-600',
    },
  };

  const current = configs[type] || configs.warning;
  const Icon = current.icon;

  return (
    <div className={`flex items-start gap-2.5 border rounded-xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${current.style}`}>
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 stroke-[2] ${current.iconColor}`} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
