import React from 'react';
import { Volume2, VolumeX } from './icons';
import { speak, stopSpeaking, isSpeechSynthesisSupported } from '../hooks/useSpeech';

export default function SpeakButton({ steps, immediateActions, summary }) {
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  if (!isSpeechSynthesisSupported) return null;

  const buildScript = () => {
    const parts = [];
    if (summary) parts.push(`Summary: ${summary}`);
    if (immediateActions?.length) {
      parts.push('Immediate actions: ' + immediateActions.join('. '));
    }
    if (steps?.length) {
      steps.forEach((step, i) => {
        const instruction = typeof step === 'string' ? step : step.instruction;
        const title = step.title ? `Step ${i + 1}: ${step.title}. ` : `Step ${i + 1}: `;
        parts.push(title + instruction);
      });
    }
    return parts.join('. ');
  };

  const handleToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const script = buildScript();
      speak(script);
      setIsSpeaking(true);
      const checkInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setIsSpeaking(false);
          clearInterval(checkInterval);
        }
      }, 500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-2xs ${
        isSpeaking
          ? 'bg-sky-50 text-sky-900 border-sky-300 ring-1 ring-sky-300 animate-pulse'
          : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
      }`}
      aria-label={isSpeaking ? 'Stop clinical audio guidance' : 'Read clinical protocol aloud'}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-3.5 h-3.5 text-sky-700" />
          <span>Mute Audio</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-slate-600" />
          <span>Audio Assist</span>
        </>
      )}
    </button>
  );
}
