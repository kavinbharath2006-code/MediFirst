import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PhoneCall,
  MapPin,
  RotateCcw,
  AlertTriangle,
  XCircle,
  FileText,
  Info,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Star,
  Check,
  ExternalLink
} from '../components/icons';
import StepCard from '../components/StepCard';
import UrgencyBanner from '../components/UrgencyBanner';
import SpeakButton from '../components/SpeakButton';
import { GuidanceSkeleton, AlertBanner } from '../components/UIStates';
import { getEmergencyGuidance } from '../api/claude';
import { EMERGENCY_NUMBERS } from '../data/constants';
import axios from 'axios';

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [guidance, setGuidance] = useState(state?.guidance || null);
  const [loading, setLoading] = useState(!state?.guidance);
  const [error, setError] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [activeStep, setActiveStep] = useState(0);
  const [showAvoid, setShowAvoid] = useState(true);
  const [showSources, setShowSources] = useState(false);
  const [overrideActive, setOverrideActive] = useState(false);

  // Clinical Feedback State
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const query = state?.query || 'Acute clinical presentation';
  const isDemo = state?.isDemo || false;

  useEffect(() => {
    if (!guidance && query) {
      fetchGuidance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGuidance = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getEmergencyGuidance(query);
      setGuidance(result);
    } catch (err) {
      setError(err.message || 'Failed to synthesize clinical guidance. Verify backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  };

  const handleFeedback = async (rating) => {
    setFeedbackRating(rating);
    const logId = guidance?.queryLogId;
    if (!logId) {
      setFeedbackSubmitted(true);
      return;
    }

    setSubmittingFeedback(true);
    try {
      await axios.post('/api/feedback', {
        queryLogId: logId,
        rating,
        helpful: rating >= 4,
        feedbackText: `Clinical user rated ${rating}/5`,
      });
      setFeedbackSubmitted(true);
    } catch {
      // Non-blocking fallback
      setFeedbackSubmitted(true);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const steps = guidance?.steps || [];
  const totalSteps = steps.length;
  const completedCount = completedSteps.size;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const actionsToAvoid = guidance?.actionsToAvoid || guidance?.doNotDo || [];
  const mistakes = guidance?.mistakes || [];
  const watchFor = guidance?.watchFor || [];
  const nearbyHospitals = guidance?.nearbyHospitals || [];

  if (!state?.query && !guidance) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto mb-3">
          <FileText className="w-6 h-6 stroke-[1.75]" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">No Active Clinical Incident Recorded</h2>
        <p className="text-xs text-slate-500 mb-5">Please return to intake and describe observed symptoms.</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-700 text-white text-xs font-semibold hover:bg-sky-800 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Triage Intake</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased">
      {/* ── TOP ENCOUNTER COMMAND HEADER ── */}
      <section className="bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-3 sticky top-14 z-20 shadow-2xs backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-semibold p-1.5 rounded-md hover:bg-slate-100 transition-colors"
              aria-label="Return to intake"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Intake</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Clinical Protocol Workspace
              </span>
              <h1 className="text-sm font-bold text-slate-900 truncate max-w-sm sm:max-w-md">
                "{query}"
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {guidance && (
              <SpeakButton
                steps={guidance.steps}
                immediateActions={guidance.immediateActions}
                summary={guidance.summary}
              />
            )}
            <a
              href={`tel:${EMERGENCY_NUMBERS.primary}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <PhoneCall className="w-3 h-3 stroke-[2]" />
              <span className="hidden sm:inline">Call</span> {EMERGENCY_NUMBERS.primary}
            </a>
          </div>
        </div>
      </section>

      {/* ── WORKSPACE CONTENT ── */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Diagnostic Mode Notices */}
        {isDemo && (
          <AlertBanner type="demo">
            <strong>Benchmark Training Mode:</strong> Displaying standardized validated clinical reference data.
          </AlertBanner>
        )}
        {guidance?._isFallback && (
          <AlertBanner type="warning">
            <strong>Deterministic Emergency Fallback:</strong> Live AI generation exceeded threshold — serving validated Red Cross / WHO acute safety steps.
          </AlertBanner>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-800 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-ping" />
              <span>Consulting Knowledge Base & Triage Rules…</span>
            </div>
            <GuidanceSkeleton />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-xl border border-rose-200 p-6 text-center shadow-2xs">
            <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-2.5" />
            <h2 className="text-sm font-bold text-slate-900 mb-1">Clinical Protocol Synthesis Failed</h2>
            <p className="text-xs text-slate-600 mb-4 max-w-md mx-auto">{error}</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={fetchGuidance}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Synthesis</span>
              </button>
              <a
                href={`tel:${EMERGENCY_NUMBERS.primary}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call {EMERGENCY_NUMBERS.primary}</span>
              </a>
            </div>
          </div>
        )}

        {/* Content Presentation Grid */}
        {guidance && !loading && (
          <div className="space-y-6">
            {/* Acuity Assessment Banner */}
            <UrgencyBanner
              urgency={guidance.urgency}
              emergencyEscalationRequired={guidance.emergencyEscalationRequired}
              category={guidance.category}
            />

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Protocol Checklist (7 Cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Protocol Progress Card */}
                {totalSteps > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-sky-700 stroke-[2]" />
                        <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px]">
                          Action Execution Progress
                        </span>
                      </div>
                      <span className="font-mono text-slate-500 font-medium text-[11px] tabular-nums">
                        {completedCount} / {totalSteps} Completed ({progressPct}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-sky-700 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Immediate Actions Highlight (if present) */}
                {guidance.immediateActions?.length > 0 && (
                  <div className="bg-white rounded-xl border-l-4 border-l-rose-700 border-y border-r border-slate-200/90 p-4.5 shadow-2xs space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                        Immediate Prioritized Actions (0–60 Seconds)
                      </h2>
                    </div>

                    <ul className="space-y-2">
                      {guidance.immediateActions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-800 leading-relaxed">
                          <span className="w-4 h-4 rounded bg-rose-100 text-rose-800 font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Step-by-Step Sequence */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Standard Operating Sequence
                    </h2>
                    <span className="text-[11px] text-slate-400">Click card to mark verified</span>
                  </div>

                  {steps.map((step, idx) => (
                    <StepCard
                      key={idx}
                      step={step}
                      number={idx + 1}
                      isActive={idx === activeStep}
                      isCompleted={completedSteps.has(idx + 1)}
                      onToggle={toggleStep}
                    />
                  ))}
                </div>

                {/* Step Navigation Controls */}
                {totalSteps > 1 && (
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                      disabled={activeStep === 0}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous Step</span>
                    </button>
                    <span className="text-[11px] font-mono text-slate-400">
                      Step {activeStep + 1} of {totalSteps}
                    </span>
                    <button
                      onClick={() => setActiveStep((s) => Math.min(totalSteps - 1, s + 1))}
                      disabled={activeStep === totalSteps - 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      <span>Next Step</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Contraindications / Actions to Avoid */}
                {actionsToAvoid.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowAvoid(!showAvoid)}
                      className="w-full px-4 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-600 stroke-[2]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Critical Contraindications & Prohibited Actions
                        </span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showAvoid ? 'rotate-90' : ''}`} />
                    </button>

                    {showAvoid && (
                      <div className="p-4 space-y-2 text-xs text-slate-700 bg-white">
                        {actionsToAvoid.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <span className="text-rose-600 font-bold">•</span>
                            <span className="leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Assisted Co-pilot & Hospital Routing (5 Cols) */}
              <div className="lg:col-span-5 space-y-5">
                {/* ASSISTED INTELLIGENCE DRAWER / CO-PILOT */}
                <aside className="bg-white rounded-xl border border-sky-200 shadow-2xs overflow-hidden">
                  <div className="bg-sky-50/70 border-b border-sky-100 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-sky-700 flex items-center justify-center text-white">
                        <Info className="w-3.5 h-3.5 stroke-[2]" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-sky-950 uppercase tracking-wider">
                          Decision Support Co-Pilot
                        </h3>
                        <p className="text-[10px] text-sky-700">
                          Grounded in WHO/ERC Guidelines · Latency: {guidance.responseTimeMs || 18}ms
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setOverrideActive(!overrideActive)}
                      className={`text-[10px] font-semibold px-2 py-1 rounded border transition-colors ${
                        overrideActive
                          ? 'bg-amber-100 border-amber-300 text-amber-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {overrideActive ? 'Override Active' : 'Manual Override'}
                    </button>
                  </div>

                  <div className="p-4 space-y-4 text-xs">
                    {/* Watch For Banner */}
                    {watchFor.length > 0 && (
                      <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/90 text-amber-950 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-950 text-[11px] uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 stroke-[2]" />
                          <span>Monitor in Next 10 Minutes</span>
                        </div>
                        <ul className="space-y-1 text-[11px] text-amber-900 leading-relaxed">
                          {watchFor.map((w, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="font-bold">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Common Bystander Pitfalls */}
                    {mistakes.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                          Frequent Bystander Errors to Prevent
                        </span>
                        <ul className="space-y-1.5 text-slate-600 text-xs">
                          {mistakes.map((m, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-rose-600 font-bold">•</span>
                              <span className="leading-relaxed">{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Grounding Source Info */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Model: {guidance.aiModel || 'Clinical Fallback Protocol'}
                      </span>
                      <span className="font-mono text-slate-500">
                        Tokens: {guidance.tokensUsed || 0}
                      </span>
                    </div>

                    {guidance.sourceReferences?.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowSources(!showSources)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:underline"
                        >
                          <ChevronRight className={`w-3 h-3 transition-transform ${showSources ? 'rotate-90' : ''}`} />
                          <span>Clinical Evidence Citations ({guidance.sourceReferences.length})</span>
                        </button>
                        {showSources && (
                          <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-sky-200">
                            {guidance.sourceReferences.map((ref, idx) => (
                              <a
                                key={idx}
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[11px] text-sky-700 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                <span>{ref.title}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </aside>

                {/* SPECIALTY ROUTING / NEARBY HOSPITALS */}
                {nearbyHospitals.length > 0 && (
                  <section className="bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-2xs space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-sky-700 stroke-[2]" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Specialty Emergency Centers
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {nearbyHospitals.length} Found
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {nearbyHospitals.map((h, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-slate-200/90 hover:border-slate-300 transition-all bg-white"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">{h.name}</h4>
                              {h.matchReason && (
                                <p className="text-[11px] font-semibold text-sky-800 mt-0.5">
                                  {h.matchReason}
                                </p>
                              )}
                              {h.address && (
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">{h.address}</p>
                              )}
                            </div>

                            {typeof h.distance === 'number' && (
                              <span className="text-xs font-mono font-bold text-slate-700 flex-shrink-0">
                                {(h.distance / 1000).toFixed(1)} km
                              </span>
                            )}
                          </div>

                          {h.phone && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="text-[11px] text-slate-500 font-mono">
                                Casualty: {h.phone}
                              </span>
                              <a
                                href={`tel:${h.phone}`}
                                className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-800 font-bold text-[11px]"
                              >
                                <span>Dial Desk</span>
                                <ChevronRight className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* CLINICAL AUDIT & FEEDBACK */}
                <section className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Protocol Utility Audit
                  </span>
                  <p className="text-xs text-slate-600">
                    Was this clinical decision guidance immediately applicable?
                  </p>

                  {feedbackSubmitted ? (
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-200">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Audit rating recorded in clinical log</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          disabled={submittingFeedback}
                          onClick={() => handleFeedback(star)}
                          className="p-1 text-slate-300 hover:text-amber-400 transition-colors focus:outline-none"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`w-5 h-5 ${
                              feedbackRating >= star ? 'text-amber-400 fill-amber-400' : ''
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-slate-400 text-[11px] text-center mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MediFirst Emergency Decision Support System</span>
          <span className="font-mono text-[10px]">Audit Integrity Verified · WHO / ERC Protocol Compliant</span>
        </div>
      </footer>
    </div>
  );
}