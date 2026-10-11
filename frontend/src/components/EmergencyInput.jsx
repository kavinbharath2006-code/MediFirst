import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send, X, RotateCcw, ChevronRight } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeech';
import { EMERGENCY_CATEGORIES } from '../data/constants';

const EXAMPLE_PROMPTS = [
  'Someone is having a seizure in my office.',
  'My child has a severe burn from a hot pan.',
  'A person collapsed and is not breathing.',
  'Someone is choking and cannot breathe.',
  'My friend was stung and their throat is swelling.',
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

  // Merge voice transcript into input text
  const combinedText = isListening
    ? (inputText + ' ' + transcript + interimTranscript).trim()
    : transcript
      ? (inputText + ' ' + transcript).trim()
      : inputText;

  const handleTextChange = (e) => {
    setInputText(e.target.value);
    setCharCount(e.target.value.length);
    if (transcript) {
      clearTranscript();
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript) {
        setInputText(prev => (prev + ' ' + transcript).trim());
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

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat.id === selectedCategory ? null : cat.id);
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
    <div className="w-full max-w-2xl mx-auto fade-in">
      <form onSubmit={handleSubmit} noValidate>
        {/* Main textarea */}
        <div className={`card p-4 sm:p-5 transition-all ${isListening ? 'ring-2 ring-red-400 shadow-md' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="emergency-input" className="text-sm font-semibold text-slate-700">
              What happened? Describe the emergency:
            </label>
            {combinedText && (
              <button
                type="button"
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded"
                aria-label="Clear input"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          <textarea
            id="emergency-input"
            value={isListening ? (inputText + ' ' + transcript).trim() : inputText}
            onChange={handleTextChange}
            placeholder={
              isListening
                ? 'Listening… speak clearly…'
                : 'E.g. "Someone fell and their leg looks broken. They are in severe pain."'
            }
            rows={4}
            maxLength={600}
            className={`w-full resize-none rounded-xl border text-slate-800 placeholder-slate-400 text-base p-3 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all ${
              isListening ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
            }`}
            aria-describedby="voice-status input-help"
          />

          {/* Interim transcript indicator */}
          {isListening && interimTranscript && (
            <p className="text-sm text-slate-500 italic mt-1 px-1">
              Hearing: <span className="text-slate-600">{interimTranscript}</span>
            </p>
          )}

          {/* Character count */}
          <div className="flex items-center justify-between mt-2 px-1">
            <span id="input-help" className="text-xs text-slate-400">
              {charCount > 0 ? `${charCount}/600 characters` : 'Minimum 5 characters'}
            </span>

            {/* Voice controls */}
            <div className="flex items-center gap-2">
              {isListening && (
                <button
                  type="button"
                  onClick={handleCancelVoice}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition"
                  aria-label="Cancel voice input"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              )}

              {speechSupported ? (
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isListening
                      ? 'bg-red-100 text-red-700 pulse-ring'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                  id="voice-status"
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span className="hidden sm:inline">Voice</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="text-xs text-slate-400">Voice unavailable</span>
              )}
            </div>
          </div>

          {/* Speech error */}
          {speechError && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-start gap-2">
              <span>⚠️</span>
              <span>{speechError}</span>
            </div>
          )}
        </div>

        {/* Example prompts */}
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-2 px-1">Quick examples:</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleExampleClick(p)}
                className="text-xs bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Category shortcuts */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowCategories(c => !c)}
            className="text-xs text-teal-600 font-medium flex items-center gap-1 hover:underline"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showCategories ? 'rotate-90' : ''}`} />
            {showCategories ? 'Hide' : 'Browse'} emergency categories
          </button>

          {showCategories && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 fade-in">
              {EMERGENCY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`text-left px-3 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === cat.id
                      ? 'border-teal-400 bg-teal-50 text-teal-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!isReady || loading}
          className={`w-full mt-5 flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold transition-all ${
            isReady && !loading
              ? 'btn-primary shadow-md hover:shadow-lg'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
          aria-label="Get emergency guidance"
        >
          {loading ? (
            <>
              <LoadingSpinner />
              Analyzing emergency…
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Get First-Aid Guidance
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        strokeDasharray="31.4" strokeDashoffset="10" />
    </svg>
  );
}
