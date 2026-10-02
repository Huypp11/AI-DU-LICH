// Chạy: npm run eval  -> so sánh hệ gợi ý với 2 baseline (ngẫu nhiên, phổ biến nhất)
import { CASES } from './testcases.js';
import { extractPrefs } from '../extract.js';
import { rank } from '../recommender.js';
import { DESTINATIONS } from '../data/destinations.js';

const K = 3;
let seed = 42;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const byId = Object.fromEntries(DESTINATIONS.map(d => [d.id, d]));

const methods = {
  'Ngẫu nhiên': () => [...DESTINATIONS].sort(() => rnd() - 0.5).slice(0, K).map(d => d.id),
  'Phổ biến nhất': () => [...DESTINATIONS].sort((a, b) => b.popularity - a.popularity).slice(0, K).map(d => d.id),
  'Hệ gợi ý (của nhóm)': (p) => rank(p, K).map(r => r.id),
};

const rows = [];
for (const [name, fn] of Object.entries(methods)) {
  const trials = name === 'Ngẫu nhiên' ? 200 : 1;
  let prec = 0, viol = 0, nBudget = 0;
  for (let t = 0; t < trials; t++) for (const c of CASES) {
    const p = extractPrefs(c.q);
    const top = fn(p);
    prec += top.filter(id => c.relevant.includes(id)).length / K;
    if (p.budgetPerDay) { nBudget++; viol += top.filter(id => byId[id].costPerDay > p.budgetPerDay * 1.2).length / K; }
  }
  rows.push({ 'Phương pháp': name, [`Precision@${K}`]: +(prec / (trials * CASES.length)).toFixed(3), 'Tỷ lệ vượt ngân sách': +(viol / nBudget).toFixed(3) });
}
console.table(rows);

console.log('\nPhân tích lỗi (các câu hệ gợi ý có Precision < 0.67):');
for (const c of CASES) {
  const top = rank(extractPrefs(c.q), K);
  const p = top.filter(r => c.relevant.includes(r.id)).length / K;
  if (p < 0.67) console.log(`- "${c.q}" -> ${top.map(r => r.name).join(', ')} (P@${K}=${p.toFixed(2)})`);
}
