import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Phone, Heart, Lock, Globe, BookOpen } from 'lucide-react';
import { EMERGENCY_NUMBERS } from '../data/constants';

export default function Safety() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Safety & About</h1>
          <p className="text-xs text-slate-500">Limitations, privacy, and emergency contacts</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Critical warning */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-red-800 text-base mb-2">⚠️ Important safety notice</h2>
              <ul className="space-y-1.5 text-sm text-red-700">
                <li>• MediFirst is a <strong>first-aid support tool</strong>, not a medical diagnostic system.</li>
                <li>• It does <strong>not</strong> replace emergency services, paramedics, or healthcare professionals.</li>
                <li>• For any <strong>life-threatening emergency</strong>, call {EMERGENCY_NUMBERS.primary} immediately.</li>
                <li>• AI guidance may be incomplete or inapplicable to your exact situation.</li>
                <li>• Always seek <strong>professional medical assessment</strong> after any serious injury or illness.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Emergency contacts */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-slate-800">Emergency contact numbers (India)</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Emergency', number: EMERGENCY_NUMBERS.primary, color: 'red' },
              { label: 'Ambulance', number: EMERGENCY_NUMBERS.ambulance, color: 'red' },
              { label: 'Police', number: EMERGENCY_NUMBERS.police, color: 'blue' },
              { label: 'Fire brigade', number: EMERGENCY_NUMBERS.fire, color: 'orange' },
            ].map((item) => (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className="flex items-center gap-3 border border-slate-200 rounded-xl p-3 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                  {item.number.charAt(0)}
                </div>
                <div>
                  <div className="text-xs text-slate-500">{item.label}</div>
                  <div className="font-bold text-slate-800 text-lg leading-none">{item.number}</div>
                </div>
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Numbers shown are for India. Configure your region's numbers in <code>src/data/constants.js</code>.
          </p>
        </div>

        {/* About MediFirst */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-slate-800">About MediFirst</h2>
          </div>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              MediFirst is an AI-powered emergency first-aid assistance platform designed to provide
              immediate, step-by-step guidance when medical emergencies occur in everyday settings.
            </p>
            <p>
              The platform uses a large language model (Claude by Anthropic) to classify emergency
              descriptions and generate structured first-aid guidance based on established protocols
              from organizations such as the NHS, Red Cross, and WHO.
            </p>
            <p>
              <strong className="text-slate-800">What MediFirst does:</strong>
            </p>
            <ul className="space-y-1 ml-3">
              <li>✅ Provides structured, calm first-aid guidance</li>
              <li>✅ Classifies emergencies and indicates urgency</li>
              <li>✅ Supports text and voice input</li>
              <li>✅ Helps locate nearby emergency services</li>
              <li>✅ Works offline with conservative fallback guidance</li>
            </ul>
            <p>
              <strong className="text-slate-800">What MediFirst does NOT do:</strong>
            </p>
            <ul className="space-y-1 ml-3">
              <li>❌ Diagnose medical conditions</li>
              <li>❌ Replace trained paramedics or doctors</li>
              <li>❌ Guarantee a specific outcome</li>
              <li>❌ Dispatch emergency services automatically</li>
              <li>❌ Provide verified real-time hospital availability</li>
            </ul>
          </div>
        </div>

        {/* AI and data */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-slate-800">AI model and data sources</h2>
          </div>
          <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
            <p>
              First-aid guidance is generated by <strong>Claude Sonnet</strong> (Anthropic) and grounded
              in established first-aid principles. The model is prompted to reference NHS, Red Cross,
              and WHO guidelines where applicable.
            </p>
            <p className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800 text-xs">
              ⚠️ AI-generated medical guidance has not been independently reviewed by a licensed clinician.
              Treat all guidance as supplementary support, not authoritative medical advice.
            </p>
          </div>
        </div>

        {/* Privacy */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-slate-800">Privacy and data</h2>
          </div>
          <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
            <ul className="space-y-1.5">
              <li>📍 <strong>Location data</strong> is used only to search for nearby services. It is sent directly to Google Maps and is not stored by MediFirst.</li>
              <li>🎤 <strong>Voice recordings</strong> are processed locally by your browser's Speech Recognition API. Audio is not uploaded to MediFirst servers.</li>
              <li>📝 <strong>Emergency descriptions</strong> are sent to Anthropic's API to generate guidance. Review <a href="https://www.anthropic.com/privacy" className="text-teal-600 underline" target="_blank" rel="noopener noreferrer">Anthropic's Privacy Policy</a> for details.</li>
              <li>💾 <strong>No accounts</strong> are required. No personal data is retained by MediFirst after your session ends.</li>
            </ul>
          </div>
        </div>

        {/* Sources */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-slate-800">Learn first aid</h2>
          </div>
          <div className="space-y-2">
            {[
              { label: 'NHS First Aid Guide', url: 'https://www.nhs.uk/conditions/first-aid/' },
              { label: 'British Red Cross First Aid', url: 'https://www.redcross.org.uk/first-aid/learn-first-aid' },
              { label: 'WHO Emergency Care', url: 'https://www.who.int/topics/emergency_care/en/' },
              { label: 'St John Ambulance', url: 'https://www.sja.org.uk/get-advice/first-aid-advice/' },
            ].map(link => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-teal-600 hover:underline"
              >
                <span>→</span> {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
