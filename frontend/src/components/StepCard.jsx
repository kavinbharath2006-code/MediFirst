import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function StepCard({ step, number, isActive, isCompleted, onToggle }) {
  const hasWarning = step.warning && step.warning.trim();

  return (
    <div
      className={`card p-4 transition-all fade-in ${
        isActive ? 'ring-2 ring-teal-400 shadow-md' : ''
      } ${isCompleted ? 'opacity-75' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Step number / completion toggle */}
        <button
          type="button"
          onClick={() => onToggle && onToggle(number)}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
            isCompleted
              ? 'bg-teal-600 border-teal-600 text-white'
              : isActive
              ? 'border-teal-500 text-teal-600 bg-teal-50'
              : 'border-slate-300 text-slate-500 bg-white hover:border-teal-400 hover:text-teal-600'
          }`}
          aria-label={isCompleted ? `Step ${number} completed` : `Mark step ${number} as done`}
        >
          {isCompleted ? <CheckCircle className="w-4 h-4" /> : number}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title */}
          {step.title && (
            <h3 className={`font-semibold text-sm sm:text-base mb-1 leading-snug ${
              isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'
            }`}>
              {step.title}
            </h3>
          )}

          {/* Instruction */}
          {typeof step === 'string' ? (
            <p className={`text-sm sm:text-base leading-relaxed ${
              isCompleted ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {step}
            </p>
          ) : (
            <p className={`text-sm sm:text-base leading-relaxed ${
              isCompleted ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {step.instruction}
            </p>
          )}

          {/* Warning */}
          {hasWarning && (
            <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">{step.warning}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
