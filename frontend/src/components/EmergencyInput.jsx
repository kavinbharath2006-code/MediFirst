import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  ArrowRight,
  RotateCcw,
  X,
  ChevronDown,
  Activity,
  Heart,
  Flame,
  Wind,
  ShieldAlert,
  AlertCircle
} from './icons';
import { useSpeechRecognition } from '../hooks/useSpeech';

const CLINICAL_CATEGORIES = [
  { id: 'cardiac', label: 'Cardiac & Chest Pain', icon: Heart },
  { id: 'breathing', label: 'Airway & Stridor', icon: Wind },
  { id: 'burns', label: 'Thermal / Chemical Burn', icon: Flame },
  { id: 'bleeding', label: 'Hemorrhage / Laceration', icon: Activity },
  { id: 'seizure', label: 'Neurologic & Seizure', icon: ShieldAlert },
  { id: 'allergic', label: 'Anaphylaxis & Allergy', icon: AlertCircle },
];

const CLINICAL_EXAMPLES = [
  'Person collapsed, unresponsive, shallow agonal breathing.',
  'Child sustained boiling water scald across forearm with erythema.',
  'Colleague with acute dyspnea, swollen lips and facial urticaria.',
  'Adult choking on food, silent cough, unable to vocalize.',
  'Sustained active tonic-clonic jerking for over 3 minutes.',
];

export default function EmergencyInput({ onSubmit, loading }) {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported: speechSupported,
    startListening,
    stopListening,
    cancelListening,
    clearTranscript,
  } = useSpeechRecognition();

  const combinedText = isListening
    ? (inputText + ' ' + transcript + interimTranscript).trim()
    : transcript
    ? (inputText + ' ' + transcript).trim()
    : inputText;

  const handleTextChange = (e) => {
    setInputText(e.target.value);
    setCharCount(e.target.value.length);
    if (transcript) clearTranscript();
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript) {
        setInputText((prev) => (prev + ' ' + transcript).trim());
        clearTranscript();
      }
    } else {
      startListening();
    }
  };

  const handleCancelVoice = () => {
    cancelListening();
    clearTranscript();
  };

  const handleExampleClick = (prompt) => {
    setInputText(prompt);
    setCharCount(prompt.length);
    clearTranscript();
  };

  const handleCategorySelect = (id) => {
    setSelectedCategory(selectedCategory === id ? null : id);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const finalText = combinedText.trim();
    if (!finalText || loading) return;

    if (onSubmit) {
      onSubmit(finalText, selectedCategory);
    } else {
      navigate('/result', { state: { query: finalText, category: selectedCategory } });
    }
  };

  const handleReset = () => {
    setInputText('');
    setCharCount(0);
    setSelectedCategory(null);
    clearTranscript();
  };

  const isReady = combinedText.trim().length >= 5;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} noValidate>
        {/* Clinical Intake Card */}
        <div
          className={`bg-white rounded-xl border transition-all ${
            isListening
              ? 'border-rose-400 ring-2 ring-rose-100 shadow-sm'
              : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-600" />
              <label htmlFor="emergency-input" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Primary Incident Description
              </label>
            </div>

            <div className="flex items-center gap-2">
              {combinedText && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                  aria-label="Clear input text"
                  title="Clear intake"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Text Input Area */}
          <div className="p-4 sm:p-5 space-y-3">
            <textarea
              id="emergency-input"
              value={isListening ? (inputText + ' ' + transcript).trim() : inputText}
              onChange={handleTextChange}
              placeholder={
                isListening
                  ? 'Listening actively… speak symptoms, patient status, or mechanism of injury clearly…'
                  : 'Describe what you observe: patient state, responsiveness, breathing, visible injury, or ingested substances…'
              }
              rows={4}
              maxLength={600}
              className={`w-full resize-none rounded-lg border text-slate-800 placeholder-slate-400 text-sm sm:text-base p-3.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all leading-relaxed ${
                isListening ? 'bg-rose-50/40 border-rose-200' : 'bg-slate-50/60 border-slate-200/80'
              }`}
              aria-describedby="intake-counter"
            />

            {/* Interim Transcript */}
            {isListening && interimTranscript && (
              <p className="text-xs text-slate-500 italic px-1 font-mono">
                Transcribing: <span className="text-slate-700">{interimTranscript}</span>
              </p>
            )}

            {/* Micro Controls & Character Counter */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <div id="intake-counter" className="text-slate-400 font-mono text-[11px] tabular-nums">
                {charCount > 0 ? `${charCount} / 600 characters` : 'Min. 5 characters required'}
              </div>

              {/* Voice Input Toggle */}
              <div className="flex items-center gap-2">
                {isListening && (
                  <button
                    type="button"
                    onClick={handleCancelVoice}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-3 h-3" /> Cancel
                  </button>
                )}

                {speechSupported ? (
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isListening
                        ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                    aria-label={isListening ? 'Stop recording voice' : 'Start clinical voice input'}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 text-rose-700" />
                        <span>Recording Active</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-slate-600" />
                        <span>Voice Dictation</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">Microphone unavailable</span>
                )}
              </div>
            </div>

            {speechError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{speechError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Triage Scenarios */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Representative Case Studies:
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CLINICAL_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleExampleClick(ex)}
                className="text-xs bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50/70 px-3 py-1.5 rounded-lg transition-all text-left shadow-2xs"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Clinical Category Shortcuts */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowCategories(!showCategories)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
            <span>{showCategories ? 'Collapse' : 'Explore'} specific presentation categories</span>
          </button>

          {showCategories && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CLINICAL_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'bg-sky-50 border-sky-300 text-sky-900 ring-1 ring-sky-200 shadow-2xs'
                        : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[2]" />
                    </div>
                    <span className="text-xs font-semibold leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={!isReady || loading}
          className={`w-full mt-5 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl text-sm font-bold tracking-tight transition-all shadow-sm ${
            isReady && !loading
              ? 'bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
          aria-label="Generate verified clinical first-aid protocol"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
              </svg>
              <span>Synthesizing Emergency Protocol…</span>
            </>
          ) : (
            <>
              <span>Generate Step-by-Step Guidance</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
