import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cpu, Check } from 'lucide-react';

export default function ApiDocsPage() {
  const [docData, setDocData] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    axios
      .get('/api/docs/endpoints')
      .then((res) => setDocData(res.data))
      .catch(() => {});
  }, []);

  const handleCopy = (text, idx) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-mono font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            <span>Developer Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-carbon tracking-tight">
            MediFirst Clinical REST API
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
            Integrate live acute clinical triage, specialized hospital geolocation, and standardized resuscitation protocols into emergency dispatch consoles, hospital triage desks, and bystander tools.
          </p>
        </div>

        {/* Quick Auth Note */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Base Endpoint</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">https://your-domain.com/api</p>
          </div>
          <span className="text-[11px] font-mono px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            v1.4.0 Active
          </span>
        </div>

        {/* Endpoints List */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">API Endpoints</h2>

          {(docData?.endpoints || [
            {
              path: '/api/guidance',
              method: 'POST',
              summary: 'Synthesize Clinical Guidance & Step Protocols',
              description: 'Generates urgency tier, prioritized bystander steps, contraindications, and nearby specialized trauma facilities.',
            },
            {
              path: '/api/hospitals',
              method: 'GET',
              summary: 'Query Specialized Emergency Casualty Facilities',
              description: 'Searches and ranks nearby emergency departments by proximity and medical specialization.',
            },
            {
              path: '/api/status',
              method: 'GET',
              summary: 'System Infrastructure Uptime & Service Health',
              description: 'Real-time telemetry and component uptime statistics.',
            },
          ]).map((ep, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                      ep.method === 'POST'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-sky-50 text-sky-800 border border-sky-200'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-sm font-bold text-carbon">{ep.path}</span>
                </div>
                <span className="text-xs text-slate-500 font-semibold">{ep.summary}</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{ep.description}</p>

              {/* cURL Example */}
              <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs relative overflow-x-auto">
                <button
                  onClick={() => handleCopy(`curl -X ${ep.method} https://api.medifirst.org${ep.path}`, idx)}
                  className="absolute right-3 top-3 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                >
                  {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : 'Copy cURL'}
                </button>
                <span className="text-emerald-400">curl</span> -X {ep.method} "https://api.medifirst.org{ep.path}"
                {ep.method === 'POST' && ' \\\n  -H "Content-Type: application/json" \\\n  -d \'{"query": "Child sustained burn on arm"}\''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
