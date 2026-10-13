import React from 'react';
import { Check, AlertTriangle } from './icons';

export default function StepCard({ step, number, isActive, isCompleted, onToggle }) {
  const isObject = typeof step === 'object' && step !== null;
  const title = isObject ? step.title : null;
  const instruction = isObject ? step.instruction : step;
  const warning = isObject ? step.warning : null;

  return (
    <div
      onClick={() => onToggle && onToggle(number)}
      className={`rounded-xl border p-4 sm:p-4.5 cursor-pointer select-none transition-all ${
        isCompleted
          ? 'bg-slate-50/80 border-slate-200/80 opacity-75'
          : isActive
          ? 'bg-white border-sky-400 ring-1 ring-sky-200 shadow-2xs'
          : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Verification Checkmark Box */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle && onToggle(number);
          }}
          className={`flex-shrink-0 w-5 h-5 rounded mt-0.5 flex items-center justify-center border transition-all ${
            isCompleted
              ? 'bg-emerald-700 border-emerald-800 text-white'
              : isActive
              ? 'border-sky-500 bg-sky-50 text-sky-800'
              : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'
          }`}
          aria-label={isCompleted ? `Step ${number} executed` : `Mark step ${number} as executed`}
        >
          {isCompleted ? (
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          ) : (
            <span className="font-mono text-[10px] font-bold">{number}</span>
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Action Step {number}
            </span>
            {isCompleted && (
              <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                EXECUTED
              </span>
            )}
          </div>

          {/* Title */}
          {title && (
            <h3
              className={`text-sm font-bold tracking-tight leading-snug ${
                isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
              }`}
            >
              {title}
            </h3>
          )}

          {/* Action Instruction */}
          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              isCompleted ? 'text-slate-500' : 'text-slate-700'
            }`}
          >
            {instruction}
          </p>

          {/* Clinical Precaution / Warning */}
          {warning && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-900 flex items-start gap-2 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5 stroke-[2]" />
              <div className="leading-relaxed">
                <strong className="font-semibold block text-[11px] uppercase tracking-wider text-amber-950">
                  Clinical Precaution:
                </strong>
                <span>{warning}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
