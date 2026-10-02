// Hệ gợi ý: cosine similarity (sở thích) + độ khớp ngân sách + độ khớp mùa. Có giải thích.
import { DESTINATIONS, FEATURES, FEATURE_LABELS } from './data/destinations.js';

export const WEIGHTS = { sim: 0.6, budget: 0.25, season: 0.15 };
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const norm = a => Math.sqrt(dot(a, a));
export const cosine = (a, b) => { const d = norm(a) * norm(b); return d ? dot(a, b) / d : 0; };
const vm = n => (n / 1e6).toFixed(1).replace('.0', '') + ' triệu';

export function rank(prefs, k = 3) {
  const u = FEATURES.map(f => (prefs.interests.includes(f) ? 1 : 0));
  const hasInterest = norm(u) > 0;
  const month = prefs.month || new Date().getMonth() + 1;

  const scored = DESTINATIONS.map(dest => {
    const parts = {}, reasons = [];
    if (hasInterest) {
      parts.sim = cosine(u, FEATURES.map(f => dest.f[f]));
      const hits = prefs.interests.filter(f => dest.f[f] >= 0.7).map(f => FEATURE_LABELS[f]);
      if (hits.length) reasons.push(`mạnh về ${hits.join(', ')}`);
    }
    if (prefs.budgetPerDay) {
      const over = dest.costPerDay - prefs.budgetPerDay;
      parts.budget = over <= 0 ? 1 : Math.max(0, 1 - over / prefs.budgetPerDay);
      reasons.push(over <= 0 ? `phù hợp ngân sách (~${vm(dest.costPerDay)}/người/ngày)` : `vượt ngân sách ~${vm(over)}/người/ngày`);
    }
    parts.season = dest.bestMonths.includes(month) ? 1 : 0.4;
    reasons.push(parts.season === 1 ? `tháng ${month} là mùa đẹp` : `tháng ${month} không phải mùa đẹp nhất`);

    const wsum = Object.keys(parts).reduce((s, key) => s + WEIGHTS[key], 0);
    const score = Object.keys(parts).reduce((s, key) => s + WEIGHTS[key] * parts[key], 0) / wsum;
    return { id: dest.id, name: dest.name, costPerDay: dest.costPerDay, score: Math.round(score * 100), parts, reasons };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}
