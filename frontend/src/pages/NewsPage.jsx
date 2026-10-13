import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Newspaper, ExternalLink } from 'lucide-react';

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('/api/resources/news')
      .then((res) => {
        if (res.data?.articles) setArticles(res.data.articles);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/60 text-sky-800 text-xs font-mono font-bold uppercase tracking-wider">
            <Newspaper className="w-3.5 h-3.5" />
            <span>Emergency Medicine Wire</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-carbon tracking-tight">
            Clinical Protocols & Emergency News
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
            Latest alerts, consensus updates, and acute resuscitation bulletins from international medical councils.
          </p>
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 font-medium">Fetching clinical updates...</div>
        ) : (
          <div className="space-y-5">
            {articles.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200/60 uppercase">
                      {item.badge}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                    <span>{item.date}</span>
                    <span>·</span>
                    <span>{item.readTime}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-lg sm:text-xl font-bold text-carbon hover:text-crimson-600 transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {item.snippet}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-400">
                  <span>Source: {item.source}</span>
                  <span className="text-crimson-700 font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                    Read Bulletin <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
