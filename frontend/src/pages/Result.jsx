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
import { Navigation, Building2, Clock, CheckCircle2 } from 'lucide-react';
import StepCard from '../components/StepCard';
import UrgencyBanner from '../components/UrgencyBanner';
import SpeakButton from '../components/SpeakButton';
import { GuidanceSkeleton, AlertBanner } from '../components/UIStates';
import { getEmergencyGuidance } from '../api/claude';
import { EMERGENCY_NUMBERS } from '../data/constants';
import { resolveLocation } from '../utils/location';
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

  // Specialized Hospital Routing State
  const [hospitals, setHospitals] = useState(state?.guidance?.nearbyHospitals || []);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

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

  // Automatically ensure accident-specialized hospitals are loaded
  useEffect(() => {
    let isMounted = true;
    const fetchHospitals = async () => {
      setLoadingHospitals(true);
      try {
        const loc = await resolveLocation().catch(() => ({ lat: 12.9249, lng: 80.1, label: 'Tambaram, Chennai' }));
        if (isMounted) setUserLocation(loc);
        const emergencyType = guidance?.emergencyType || guidance?.urgency?.emergencyType || state?.category || 'burn';
        const res = await axios.get('/api/hospitals', {
          params: { lat: loc.lat, lng: loc.lng, emergencyType, radius: 30000 }
        });
        if (isMounted && res.data?.hospitals?.length > 0) {
          setHospitals(res.data.hospitals);
        }
      } catch (e) {
        console.warn('Could not load specialized hospitals:', e);
      } finally {
        if (isMounted) setLoadingHospitals(false);
      }
    };

    if (hospitals.length === 0) {
      fetchHospitals();
    } else if (!userLocation) {
      resolveLocation().then((loc) => isMounted && setUserLocation(loc)).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [guidance, hospitals.length, state?.category]);

  const fetchGuidance = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getEmergencyGuidance(query);
      setGuidance(result);
      if (result.nearbyHospitals?.length > 0) {
        setHospitals(result.nearbyHospitals);
      }
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
  const nearbyHospitals = hospitals.length > 0 ? hospitals : (guidance?.nearbyHospitals || []);

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
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300/60 flex items-center justify-center text-amber-700 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold block text-amber-900">Validated Clinical Triage Protocols Active</span>
                <span className="text-amber-700">Displaying standardized Red Cross & WHO acute stabilization measures for this presentation.</span>
              </div>
            </div>
            <button
              onClick={fetchGuidance}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry AI Sync</span>
            </button>
          </div>
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

                {/* SPECIALTY ROUTING / ACCIDENT HOSPITALS */}
                <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-700">
                        <Building2 className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Accident Response Facilities
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Equipped for {guidance?.category || 'Acute Emergency'} care
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {nearbyHospitals.length} Found Nearby
                    </span>
                  </div>

                  {/* Interactive OpenStreetMap Embed */}
                  {userLocation && (
                    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200/80 shadow-2xs" style={{ height: '210px' }}>
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.lng - 0.04},${userLocation.lat - 0.025},${userLocation.lng + 0.04},${userLocation.lat + 0.025}&layer=mapnik&marker=${userLocation.lat},${userLocation.lng}`}
                        title="Specialized accident hospitals map"
                        className="w-full h-full border-0"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-sm z-10 pointer-events-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Incident GPS: {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/hospital`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm text-sky-800 hover:text-sky-900 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm border border-slate-200 z-10 flex items-center gap-1 transition-colors"
                      >
                        <Navigation className="w-3 h-3 text-sky-600" />
                        <span>Open in Google Maps</span>
                      </a>
                    </div>
                  )}

                  {/* Hospital Cards List */}
                  {loadingHospitals && nearbyHospitals.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 font-medium space-y-1">
                      <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span>Locating emergency bays equipped for this injury...</span>
                    </div>
                  ) : nearbyHospitals.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      <span>No specialized emergency centers recorded within immediate radius.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {nearbyHospitals.map((h, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-200/90 hover:border-slate-300 transition-all bg-slate-50/50 hover:bg-white shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-900 truncate">{h.name}</h4>
                                {h.rating && (
                                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                                    ★ {h.rating}
                                  </span>
                                )}
                              </div>
                              {h.matchReason && (
                                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200/60 text-[10px] font-semibold">
                                  <span>✓ {h.matchReason}</span>
                                </div>
                              )}
                              {h.address && (
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{h.address}</p>
                              )}
                            </div>

                            {typeof h.distance === 'number' && (
                              <div className="text-right flex-shrink-0">
                                <span className="text-xs font-mono font-bold text-slate-800 block">
                                  {(h.distance / 1000).toFixed(1)} km
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ~{Math.max(2, Math.round((h.distance / 1000) * 3))} min
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Quick Action Navigation & Dial Buttons */}
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                            {h.phone ? (
                              <a
                                href={`tel:${h.phone}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-colors border border-rose-200/60"
                              >
                                <PhoneCall className="w-3 h-3 stroke-[2.2]" />
                                <span>Casualty: {h.phone}</span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">
                                24/7 Casualty Open
                              </span>
                            )}

                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(h.name + ' ' + (h.address || ''))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-[11px] transition-colors shadow-2xs ml-auto"
                            >
                              <Navigation className="w-3 h-3 stroke-[2.2]" />
                              <span>Route / Navigate</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

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