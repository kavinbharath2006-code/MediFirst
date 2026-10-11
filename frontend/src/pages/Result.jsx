import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, MapPin, RotateCcw, ChevronLeft, ChevronRight,
  ExternalLink, AlertTriangle, CheckCircle, XCircle, BookOpen, Zap
} from 'lucide-react';
import StepCard from '../components/StepCard';
import UrgencyBanner from '../components/UrgencyBanner';
import SpeakButton from '../components/SpeakButton';
import { GuidanceSkeleton, AlertBanner } from '../components/UIStates';
import { getEmergencyGuidance } from '../api/claude';
import { EMERGENCY_NUMBERS } from '../data/constants';

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [guidance, setGuidance] = useState(state?.guidance || null);
  const [loading, setLoading] = useState(!state?.guidance);
  const [error, setError] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [activeStep, setActiveStep] = useState(0);
  const [showAvoid, setShowAvoid] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const query = state?.query || 'Unknown emergency';
  const isDemo = state?.isDemo || false;

  // Fetch guidance if not pre-loaded
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
      setError(err.message || 'Failed to get guidance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  };

  const steps = guidance?.steps || [];
  const totalSteps = steps.length;
  const completedCount = completedSteps.size;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  if (!state?.query) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">No emergency described</h2>
        <p className="text-slate-500 mb-6">Please go back and describe the emergency you need help with.</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          ← Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          aria-label="Go back to home"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">First-Aid Guidance</h1>
        </div>
        {guidance && (
          <SpeakButton
            steps={guidance.steps}
            immediateActions={guidance.immediateActions}
            summary={guidance.summary}
          />
        )}
      </div>

      {/* Query display */}
      <div className="card px-4 py-3 mb-4 text-sm text-slate-600 italic leading-relaxed">
        <span className="text-slate-400 not-italic font-medium">Emergency: </span>
        "{query}"
      </div>

      {/* Demo / fallback notice */}
      {isDemo && (
        <AlertBanner type="demo">
          <strong>Demo scenario</strong> — this is sample guidance for demonstration. Not a live AI response.
        </AlertBanner>
      )}
      {guidance?._demoMode && !isDemo && (
        <AlertBanner type="demo">
          <strong>Demo mode</strong> — running without an API key. Add <code>REACT_APP_ANTHROPIC_API_KEY</code> for live AI guidance.
        </AlertBanner>
      )}
      {guidance?._isFallback && (
        <AlertBanner type="warning">
          <strong>Safe fallback guidance.</strong> AI service unavailable — showing general first-aid principles only.
          Call emergency services ({EMERGENCY_NUMBERS.primary}) if unsure.
        </AlertBanner>
      )}
      {guidance?._error && !guidance?._isFallback && (
        <AlertBanner type="warning">
          {guidance._error}
        </AlertBanner>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-4 text-teal-600">
            <Zap className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">Analyzing emergency and preparing guidance…</span>
          </div>
          <GuidanceSkeleton />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="mt-4 card p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-800 mb-2">Unable to get guidance</h3>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button onClick={fetchGuidance} className="btn-primary text-sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              Try again
            </button>
            <a href={`tel:${EMERGENCY_NUMBERS.primary}`} className="btn-danger text-sm flex items-center gap-1 justify-center">
              <Phone className="w-4 h-4" />
              Call {EMERGENCY_NUMBERS.primary}
            </a>
          </div>
        </div>
      )}

      {/* Guidance content */}
      {guidance && !loading && (
        <div className="mt-4 space-y-4 fade-in">
          {/* Urgency banner */}
          <UrgencyBanner
            urgency={guidance.urgency}
            emergencyEscalationRequired={guidance.emergencyEscalationRequired}
            category={guidance.category}
          />

          {/* Summary */}
          {guidance.summary && (
            <div className="card px-4 py-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Situation Summary</h2>
              <p className="text-slate-700 text-sm leading-relaxed">{guidance.summary}</p>
            </div>
          )}

          {/* Immediate actions — highlighted */}
          {guidance.immediateActions?.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-red-800 mb-3 uppercase tracking-widest">
                <Zap className="w-4 h-4" />
                Do right now
              </h2>
              <ul className="space-y-2">
                {guidance.immediateActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-900">
                    <span className="flex-shrink-0 font-bold text-red-600 mt-0.5">{i + 1}.</span>
                    <span className="leading-relaxed">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step progress */}
          {totalSteps > 0 && (
            <div className="card px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Step-by-step guidance
                </h2>
                <span className="text-xs text-slate-500">
                  {completedCount}/{totalSteps} completed
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <StepCard
                key={index}
                step={step}
                number={index + 1}
                isActive={index === activeStep}
                isCompleted={completedSteps.has(index + 1)}
                onToggle={toggleStep}
              />
            ))}
          </div>

          {/* Step navigation */}
          {totalSteps > 1 && (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                disabled={activeStep === 0}
                className="btn-ghost flex items-center gap-1 text-sm disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs text-slate-500">
                Step {activeStep + 1} of {totalSteps}
              </span>
              <button
                onClick={() => setActiveStep(s => Math.min(totalSteps - 1, s + 1))}
                disabled={activeStep === totalSteps - 1}
                className="btn-ghost flex items-center gap-1 text-sm disabled:opacity-40"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Actions to avoid */}
          {guidance.actionsToAvoid?.length > 0 && (
            <div className="card overflow-hidden">
              <button
                onClick={() => setShowAvoid(s => !s)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-slate-800">Actions to avoid</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showAvoid ? 'rotate-90' : ''}`} />
              </button>
              {showAvoid && (
                <div className="px-4 pb-4 space-y-2 fade-in border-t border-slate-100 pt-3">
                  {guidance.actionsToAvoid.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-red-500 flex-shrink-0 mt-0.5">✗</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Professional help guidance */}
          {guidance.professionalHelp && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl px-4 py-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-1">
                    When to seek professional help
                  </p>
                  <p className="text-sm text-teal-800 leading-relaxed">{guidance.professionalHelp}</p>
                </div>
              </div>
            </div>
          )}

          {/* Source references */}
          {guidance.sourceReferences?.length > 0 && (
            <div className="card overflow-hidden">
              <button
                onClick={() => setShowSources(s => !s)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-800">Sources & references</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showSources ? 'rotate-90' : ''}`} />
              </button>
              {showSources && (
                <div className="px-4 pb-4 space-y-2 fade-in border-t border-slate-100 pt-3">
                  {guidance.sourceReferences.map((ref, i) => (
                    <a
                      key={i}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-teal-600 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      {ref.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={`tel:${EMERGENCY_NUMBERS.primary}`}
              className="btn-danger flex items-center justify-center gap-2 text-sm"
            >
              <Phone className="w-4 h-4" />
              Call {EMERGENCY_NUMBERS.primary}
            </a>
            <button
              onClick={() => navigate('/services')}
              className="btn-ghost flex items-center justify-center gap-2 text-sm"
            >
              <MapPin className="w-4 h-4" />
              Find hospitals
            </button>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full btn-ghost flex items-center justify-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Start a new emergency query
          </button>

          {/* Safety disclaimer */}
          <p className="text-center text-xs text-slate-400 leading-relaxed px-4 pb-2">
            🛡️ MediFirst guidance supports your response. It does not replace professional medical care.
            Call {EMERGENCY_NUMBERS.primary} for any life-threatening emergency.
          </p>
        </div>
      )}
    </div>
  );
}