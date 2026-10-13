import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, ChevronRight } from 'lucide-react';
import firstAidData from '../data/firstAid';
import machinesData from '../data/machines';

export default function GuidesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all | firstaid | devices

  const allProtocols = [
    ...(firstAidData || []).map((item) => ({ ...item, type: 'firstaid', typeLabel: 'Emergency Protocol' })),
    ...(machinesData || []).map((item) => ({ ...item, type: 'devices', typeLabel: 'Life Support Device' })),
  ];

  const filtered = allProtocols.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.summary && p.summary.toLowerCase().includes(search.toLowerCase())) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())));
    const matchesTab = activeTab === 'all' || p.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200/60 text-crimson-700 text-xs font-mono font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Clinical Knowledge Base</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-carbon tracking-tight">
            Best Practice Protocol Guides
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
            Standardized, peer-reviewed emergency action guides aligned with WHO, ERC 2024, and Red Cross acute resuscitation benchmarks.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guides (e.g. burn, CPR, AED, seizure)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-crimson-600/20 focus:border-crimson-600 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Resources' },
              { id: 'firstaid', label: 'First Aid Protocols' },
              { id: 'devices', label: 'Medical Devices' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-carbon text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Protocol Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.type === 'devices' ? `/machines/${item.id}` : `/first-aid/${item.id}`)}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-crimson-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    item.type === 'devices'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200/60'
                      : 'bg-rose-50 text-crimson-700 border border-red-200/60'
                  }`}>
                    {item.typeLabel}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {item.steps?.length || 4} Steps
                  </span>
                </div>

                <h3 className="text-base font-bold text-carbon group-hover:text-crimson-600 transition-colors">
                  {item.title}
                </h3>

                <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                  {item.summary || item.description || 'Verified acute stabilization instructions and safety protocols.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 group-hover:text-crimson-600 transition-colors">
                <span>View Full Protocol</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
