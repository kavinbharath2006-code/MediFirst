// scripts/latencyProbe.cjs — fires N identical POSTs at /api/guidance and
// prints a per-stage timing table. Usage: node scripts/latencyProbe.cjs [count]
const N = Number(process.argv[2] || 5);
const URL = 'http://localhost:5000/api/guidance';
const BODY = { query: 'Someone is having a seizure and fell to the ground' };

async function one(i) {
  const t0 = Date.now();
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(BODY),
    });
    const json = await res.json();
    const wall = Date.now() - t0;
    const t = json.timings || {};
    return {
      run: i,
      http: res.status,
      wall,
      server: json.responseTimeMs ?? '-',
      classify: t.classify ?? '-',
      rag: t.rag ?? '-',
      geo: t.geo ?? '-',
      gemini: t.gemini ?? '-',
      extra: t.extraGuidance ?? '-',
      db: t.db ?? '-',
      src: json.guidanceSource || json.aiSource || (json.success === false ? 'ERR:' + json.error : '?'),
    };
  } catch (err) {
    return { run: i, http: 'EXC', wall: Date.now() - t0, server: '-', classify: '-', rag: '-', geo: '-', gemini: '-', extra: '-', db: '-', src: err.message };
  }
}

(async () => {
  const rows = [];
  for (let i = 1; i <= N; i++) {
    console.log(`--- run ${i}/${N} ...`);
    rows.push(await one(i));
  }
  const cols = ['run', 'http', 'wall', 'server', 'classify', 'rag', 'geo', 'gemini', 'extra', 'db', 'src'];
  console.log('\nTIMINGS (ms)');
  console.log(cols.join('\t'));
  for (const r of rows) console.log(cols.map((c) => r[c]).join('\t'));
  const walls = rows.map((r) => r.wall);
  const sorted = [...walls].sort((a, b) => a - b);
  const p95 = sorted[Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1)];
  console.log(`\nwall min/median/p95: ${sorted[0]} / ${sorted[Math.floor(sorted.length / 2)]} / ${p95} ms`);
})();
