import React from 'react';
import { AlertOctagon } from 'lucide-react';

/**
 * Reusable skeleton loading card for guidance screen.
 */
export function GuidanceSkeleton() {
  return (
    <div className="space-y-4 fade-in" aria-busy="true" aria-label="Loading guidance">
      <div className="card p-5 space-y-3">
        <div className="skeleton h-5 w-2/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="card p-4 flex gap-3">
          <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-4/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Error state display with optional retry action.
 */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="card p-6 text-center fade-in">
      <AlertOctagon className="w-12 h-12 text-red-400 mx-auto mb-3" />
      <h3 className="font-semibold text-slate-800 mb-2">Something went wrong</h3>
      <p className="text-slate-500 text-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary text-sm">
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * Empty state for no results.
 */
export function EmptyState({ message, icon, children }) {
  return (
    <div className="card p-8 text-center fade-in">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <p className="text-slate-500 text-sm">{message}</p>
      {children}
    </div>
  );
}

/**
 * Inline warning/alert banner.
 */
export function AlertBanner({ type = 'warning', children }) {
  const styles = {
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    demo: 'bg-purple-50 border-purple-200 text-purple-800',
  };
  const icons = {
    warning: '⚠️',
    error: '🚫',
    info: 'ℹ️',
    success: '✅',
    demo: '🎭',
  };

  return (
    <div className={`flex items-start gap-2 border rounded-xl px-4 py-3 text-sm ${styles[type]}`}>
      <span className="flex-shrink-0">{icons[type]}</span>
      <div>{children}</div>
    </div>
  );
}
