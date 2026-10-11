import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
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
      // Reset state when synthesis ends
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
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
        isSpeaking
          ? 'bg-teal-600 text-white border-teal-600'
          : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50'
      }`}
      aria-label={isSpeaking ? 'Stop reading instructions' : 'Read instructions aloud'}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-4 h-4" />
          <span>Stop reading</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4" />
          <span>Read aloud</span>
        </>
      )}
    </button>
  );
}
