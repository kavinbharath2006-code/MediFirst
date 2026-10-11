import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, MapPin, Shield, ChevronRight, Phone, Play } from 'lucide-react';
import EmergencyInput from '../components/EmergencyInput';
import { getEmergencyGuidance, DEMO_MODE } from '../api/claude';
import { DEMO_SCENARIOS, EMERGENCY_NUMBERS } from '../data/constants';

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
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoScenario = (scenario) => {
    navigate('/result', {
      state: {
        query: scenario.query,
        category: scenario.id,
        guidance: scenario.response,
        isDemo: true,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-6 sm:pt-12 sm:pb-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-teal-200">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered · Voice-Ready · Available Offline
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-3 leading-tight">
            Emergency first aid,
            <br />
            <span className="text-teal-600">instantly.</span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto">
            Describe what happened. Get clear, step-by-step guidance in seconds — by text or voice.
          </p>
        </div>

        {/* Main emergency input */}
        <EmergencyInput onSubmit={handleSubmit} loading={loading} />

        {/* Error display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
            <span className="flex-shrink-0 text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Demo mode notice */}
        {DEMO_MODE && (
          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm text-purple-700 flex items-start gap-2">
            <span>🎭</span>
            <span>
              <strong>Demo mode active.</strong> AI API key not configured — responses use safe fallback guidance.
              Add <code className="bg-purple-100 px-1 rounded">REACT_APP_ANTHROPIC_API_KEY</code> to your <code className="bg-purple-100 px-1 rounded">.env</code> for live AI.
            </span>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">How MediFirst works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: '🗣️',
              title: 'Describe the emergency',
              desc: 'Type or speak what happened — in your own words.'
            },
            {
              icon: '⚡',
              title: 'AI classifies & guides',
              desc: 'Get urgent, step-by-step first-aid guidance in seconds.'
            },
            {
              icon: '🏥',
              title: 'Connect to help',
              desc: 'Find nearby hospitals and call emergency services directly.'
            },
          ].map((item, i) => (
            <div key={i} className="card p-4 text-center">
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1">{item.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo scenarios */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Try a demo scenario</h2>
            <p className="text-xs text-slate-500">Sample emergencies with pre-built guidance — no API key needed</p>
          </div>
          <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-1 rounded-full">Demo</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DEMO_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => handleDemoScenario(scenario)}
              className="card p-4 text-left hover:border-teal-300 hover:shadow-md transition-all group"
            >
              <div className="text-2xl mb-2">{scenario.icon}</div>
              <h3 className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition-colors leading-snug">
                {scenario.label}
              </h3>
              <div className="flex items-center gap-1 mt-2 text-teal-600">
                <Play className="w-3 h-3" />
                <span className="text-xs font-medium">View guidance</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Quick actions row */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Emergency call */}
          <a
            href={`tel:${EMERGENCY_NUMBERS.primary}`}
            className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-5 py-4 rounded-2xl font-semibold transition-colors shadow"
          >
            <Phone className="w-6 h-6 flex-shrink-0" />
            <div>
              <div className="text-xs opacity-80">Emergency services</div>
              <div className="text-lg font-bold">Call {EMERGENCY_NUMBERS.primary}</div>
            </div>
          </a>

          {/* Nearby services */}
          <button
            onClick={() => navigate('/services')}
            className="flex items-center gap-3 card px-5 py-4 hover:border-teal-300 hover:shadow transition-all text-left"
          >
            <MapPin className="w-6 h-6 text-teal-600 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Find hospitals</div>
              <div className="text-sm font-semibold text-slate-800">Nearby emergency services</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
          </button>

          {/* Safety info */}
          <button
            onClick={() => navigate('/safety')}
            className="flex items-center gap-3 card px-5 py-4 hover:border-teal-300 hover:shadow transition-all text-left"
          >
            <Shield className="w-6 h-6 text-teal-600 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Limitations & privacy</div>
              <div className="text-sm font-semibold text-slate-800">Safety information</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
          </button>
        </div>
      </section>

      {/* Footer safety notice */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
        <div className="border-t border-slate-100 pt-6 text-center">
          <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
            🛡️ MediFirst provides first-aid guidance to support your response.
            It does not diagnose medical conditions or replace emergency services.
            Always call <strong>{EMERGENCY_NUMBERS.primary}</strong> for life-threatening emergencies.
          </p>
        </div>
      </footer>
    </div>
  );
}