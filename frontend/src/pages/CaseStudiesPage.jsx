import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'motion/react';
import { FileText, CheckCircle2 } from 'lucide-react';

export default function CaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('/api/resources/case-studies')
      .then((res) => {
        if (res.data?.caseStudies) setCaseStudies(res.data.caseStudies);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] py-10 px-4 sm:px-6 lg:px-8 antialiased">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-mono font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Clinical Audit & Outcomes</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-carbon tracking-tight">
            Real-World Emergency Case Studies
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed font-light">
            Documented emergency incidents where MediFirst AI guidance and automated specialty hospital routing supported bystanders and emergency teams.
          </p>
        </div>

        {/* Case Studies List with Staggered Slide In */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 font-medium">Loading clinical case audits...</div>
        ) : (
          <div className="space-y-6">
            {caseStudies.map((study, idx) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-card space-y-5 hover:border-slate-300 transition-colors duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-crimson-700 border border-rose-200/60 uppercase">
                        {study.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {study.date}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-carbon">{study.title}</h2>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold self-start sm:self-auto shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Outcome: {study.outcome}</span>
                  </div>
                </div>

                <p className="text-slate-700 text-sm leading-relaxed font-light">{study.summary}</p>

                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    Key Clinical Interventions:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {study.keyInterventions?.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-crimson-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 pt-2 font-mono">
                  <span>Reviewed By: {study.clinicalReviewer}</span>
                  <span className="font-bold text-slate-600">Time to Specialist Bay: {study.timeToSpecialist}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
