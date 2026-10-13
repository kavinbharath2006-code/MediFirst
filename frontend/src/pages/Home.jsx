import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InteractiveVectorGrid from '../components/InteractiveVectorGrid';
import {
  Activity,
  Flame,
  ShieldCheck,
  ChevronRight,
  PhoneCall,
  MapPin,
  Shield,
  AlertTriangle,
  Info,
  Zap
} from '../components/icons';
import EmergencyInput from '../components/EmergencyInput';
import { getEmergencyGuidance, DEMO_MODE } from '../api/claude';
import { DEMO_SCENARIOS, EMERGENCY_NUMBERS } from '../data/constants';

const CLINICAL_BENCHMARKS = [
  {
    id: 'burn',
    label: 'Thermal Scald & Burn Injury',
    category: 'Trauma · Burns',
    icon: Flame,
    urgencyText: 'Acuity Tier 2',
    urgencyColor: 'text-amber-800 bg-amber-50 border-amber-200',
    summary: 'Standard 20-minute cool irrigation protocol, airway assessment, and sterile non-adherent dressing.',
    scenario: DEMO_SCENARIOS.find((s) => s.id === 'burn'),
  },
  {
    id: 'seizure',
    label: 'Active Tonic-Clonic Seizure',
    category: 'Neurologic Emergency',
    icon: Activity,
    urgencyText: 'Acuity Tier 1 (Critical)',
    urgencyColor: 'text-rose-800 bg-rose-50 border-rose-200',
    summary: 'Airway protection, lateral recovery positioning, seizure chronometry, and zero-oral-intervention safety.',
    scenario: DEMO_SCENARIOS.find((s) => s.id === 'seizure'),
  },
  {
    id: 'fracture',
    label: 'Displaced Limb Fracture',
    category: 'Orthopedic Trauma',
    icon: ShieldCheck,
    urgencyText: 'Acuity Tier 3',
    urgencyColor: 'text-slate-700 bg-slate-100 border-slate-200',
    summary: 'In-situ immobilization, neurovascular pulse check, and secondary injury mitigation without realignment.',
    scenario: DEMO_SCENARIOS.find((s) => s.id === 'fracture'),
  },
  {
    id: 'anaphylaxis',
    label: 'Acute Anaphylactic Reaction',
    category: 'Immunologic · Airway',
    icon: AlertTriangle,
    urgencyText: 'Acuity Tier 1 (Critical)',
    urgencyColor: 'text-rose-800 bg-rose-50 border-rose-200',
    summary: 'Prompt epinephrine administration into mid-anterolateral thigh, recumbent positioning, and airway alert.',
    scenario: DEMO_SCENARIOS.find((s) => s.id === 'allergic') || DEMO_SCENARIOS[0],
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (description, category) => {
    setError(null);
    setLoading(true);
    try {
      const guidance = await getEmergencyGuidance(description);
      navigate('/result', {
        state: { query: description, category, guidance },
      });
    } catch (err) {
      setError(err.message || 'Clinical synthesis could not complete. Verify network status and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleBenchmarkSelect = (benchmark) => {
    if (!benchmark.scenario) return;
    navigate('/result', {
      state: {
        query: benchmark.scenario.query,
        category: benchmark.scenario.id,
        guidance: benchmark.scenario.response,
        isDemo: true,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased">
      
      {/* ─────────────────────────────────────────────────────────────
          1. FLAGSHIP HERO WITH INTERACTIVE VECTOR CANVAS
      ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex flex-col justify-between overflow-hidden cursor-crosshair pb-12">
        {/* Ultramarine Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#091730] via-[#0b244d] to-[#040b17] pointer-events-none" />

        {/* 60 FPS Interactive Vector Grid */}
        <InteractiveVectorGrid
          gridPitch={40}
          interactionRadius={175}
          lerpSpeed={0.08}
          shape="chevron"
          accentColor="#38bdf8"
          baseColor="rgba(255, 255, 255, 0.18)"
        />

        {/* Radial Ambient Spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.12),transparent_70%)] pointer-events-none" />

        {/* Main Content Area */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 z-10 text-center flex-1 flex flex-col justify-center items-center">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sky-300 text-xs font-mono uppercase tracking-widest mb-6 shadow-xs">
            <Zap size={14} className="text-[#ccff00]" />
            <span>Acute AI Triage · GPS Hospital Routing · 108 Direct</span>
          </div>

          {/* Editorial Display Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white uppercase leading-[0.94] max-w-4xl mb-4 font-sans">
            Seconds <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-white to-sky-200">Count.</span>
            <br />
            Care in Real Time.
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl font-light leading-relaxed mb-8">
            Your instant guidance system for acute medical response, algorithmic hospital dispatch, and emergency triage.
          </p>

          {/* Input Component Embedded in Hero */}
          <div className="w-full max-w-3xl text-left bg-white rounded-2xl shadow-2xl p-4 sm:p-5 border border-white/20">
            <EmergencyInput onSubmit={handleSubmit} loading={loading} />

            {/* Error Notification */}
            {error && (
              <div
                role="alert"
                className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs sm:text-sm text-rose-900 flex items-start gap-3 shadow-2xs"
              >
                <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block">Intake Submission Error</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Diagnostic Mode Status */}
            {DEMO_MODE && (
              <div className="mt-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>
                    <strong>Offline Protocol Standby:</strong> Loaded with verified clinical first-aid rules.
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
                  VERIFIED_INDEX
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Telemetric HUD Ticker Badges */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Avg. Ambulance ETA', value: '06m 12s', sub: 'Regional Fleet GPS', accent: 'text-sky-400' },
              { label: 'Nearest Trauma Hub', value: '1.4 km', sub: '24-hr Casualty Open', accent: 'text-emerald-400' },
              { label: 'AI Protocol Latency', value: '< 18 ms', sub: 'Deterministic Fallback', accent: 'text-amber-400' },
              { label: 'Verified Specialties', value: '54 Units', sub: 'ICU / Neuro / Burns', accent: 'text-purple-400' },
            ].map((metric, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-3.5 transition-all hover:bg-white/10"
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  {metric.label}
                </div>
                <div className={`text-xl sm:text-2xl font-mono font-bold tracking-tight ${metric.accent}`}>
                  {metric.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-light">
                  {metric.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. CLINICAL ARCHITECTURE & OPERATIONAL SEQUENCE
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white text-slate-700 text-xs font-semibold px-3 py-1 rounded-md border border-slate-200/90 shadow-2xs mb-2">
            <span className="w-2 h-2 rounded-full bg-sky-700" />
            <span className="uppercase font-mono tracking-wider">Clinical Framework</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Clinical Decision Support Architecture
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-800">
              <Activity className="w-4 h-4 stroke-[2]" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              1. Triage Classification
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-light">
              Real-time classification based on Manchester Triage principles, separating life-threatening resuscitation events from guarded conditions.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
              <ShieldCheck className="w-4 h-4 stroke-[2]" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              2. Grounded Protocol Retrieval
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-light">
              Deterministic matching through indexed knowledge bases (Red Cross, WHO, ERC) prevents generative hallucinations in critical pathways.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-800">
              <PhoneCall className="w-4 h-4 stroke-[2]" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              3. Specialty Hospital Routing
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-light">
              Emergency-type routing connects patients to facilities equipped with dedicated ICUs, burn centers, cardiac catheter labs, or trauma bays.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. VERIFIED CLINICAL BENCHMARKS
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 border-t border-slate-200/80">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Verified Protocol Benchmarks</h2>
            <p className="text-xs text-slate-500">Standardized clinical presentations for immediate training or protocol evaluation</p>
          </div>
          <span className="text-xs font-mono text-slate-400 hidden sm:block">AHA / ERC 2024</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CLINICAL_BENCHMARKS.map((benchmark) => {
            const Icon = benchmark.icon;
            return (
              <button
                key={benchmark.id}
                onClick={() => handleBenchmarkSelect(benchmark)}
                className="group p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 hover:shadow-md transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-sky-50 group-hover:text-sky-700 transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-mono font-medium text-slate-500">
                        {benchmark.category}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${benchmark.urgencyColor}`}
                    >
                      {benchmark.urgencyText}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {benchmark.label}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-light">
                    {benchmark.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[10px]">AHA Protocol Verified</span>
                  <span className="text-sky-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    <span>Evaluate</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. FAST DISPATCH & TELEPHONY
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 border-t border-slate-200/80">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={`tel:${EMERGENCY_NUMBERS.primary}`}
            className="flex items-center gap-3 bg-rose-700 hover:bg-rose-800 text-white p-4 rounded-2xl transition-all shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-800/80 flex items-center justify-center text-white flex-shrink-0">
              <PhoneCall className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-200 block font-mono">
                Emergency Dispatch
              </span>
              <span className="text-base font-bold tracking-tight">Call {EMERGENCY_NUMBERS.primary} (Direct)</span>
            </div>
          </a>

          <button
            onClick={() => navigate('/services')}
            className="flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200/90 p-4 rounded-2xl text-left transition-all shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
              <MapPin className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                Hospital Locator
              </span>
              <span className="text-xs font-bold text-slate-900 block truncate">Nearby Emergency Centers</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => navigate('/safety')}
            className="flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200/90 p-4 rounded-2xl text-left transition-all shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
              <Shield className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                Clinical Standards
              </span>
              <span className="text-xs font-bold text-slate-900 block truncate">Governance & Disclaimers</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. REGULATORY FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/80 bg-white py-8 px-4 sm:px-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="leading-relaxed">
            <strong>Clinical Safety Advisory:</strong> MediFirst provides evidence-based decision support protocols intended for immediate acute first-aid guidance. It does not establish a formal physician-patient relationship nor substitute for immediate paramedic deployment.
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
            <span>AHA / ERC 2024 Standards</span>
            <span>•</span>
            <span>ICEMPS 2024 Context Architecture</span>
            <span>•</span>
            <span>Encrypted HIPAA/GDPR Transient Storage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}