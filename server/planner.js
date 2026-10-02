// Lập lịch trình: chọn & xếp địa điểm vào N ngày sao cho TỔNG GIÁ TRỊ lớn nhất,
// thỏa: giờ/ngày <= 8 (gồm thời gian di chuyển), tổng chi phí hoạt động <= ngân sách.
// - greedy: baseline tham lam
// - dfs: DFS có cắt nhánh (branch & bound), cho lời giải tối ưu (trong mô hình này)
import { PLACES } from './data/places.js';
import { DESTINATIONS } from './data/destinations.js';

export const DAY_HOURS = 8;
const ACTIVITY_SHARE = 0.3; // 30% ngân sách/ngày dành cho vé & hoạt động
const travel = (a, b) => (a.area === b.area ? 0.3 : 1);
const dayTime = l => l.reduce((t, p, i) => t + p.hours + (i ? travel(l[i - 1], p) : 0), 0);

export const hasPlaces = id => !!PLACES[id];

function setup(destId, prefs) {
  const people = prefs.people || 1;
  const days = Math.min(Math.max(prefs.days || 2, 1), 5);
  // giá trị địa điểm = rating + 2 * số nhãn khớp sở thích (địa điểm được đánh số i theo khu vực)
  const places = (PLACES[destId] || []).map((p, i) => ({ ...p, i, value: p.rating + 2 * p.tags.filter(t => prefs.interests.includes(t)).length }));
  const budget = prefs.budgetPerDay ? prefs.budgetPerDay * people * days * ACTIVITY_SHARE : Infinity;
  return { places, days, people, budget };
}

function pack(destId, algo, lists, people, nodes, t0) {
  const used = lists.filter(l => l.length);
  const all = used.flat();
  return {
    algo, destination: DESTINATIONS.find(d => d.id === destId)?.name,
    days: used.map((l, k) => ({ day: k + 1, hours: +dayTime(l).toFixed(1), places: l.map(({ name, area, hours, cost, tags }) => ({ name, area, hours, cost, tags })) })),
    totalValue: +all.reduce((s, p) => s + p.value, 0).toFixed(1),
    totalCost: all.reduce((s, p) => s + p.cost * people, 0),
    nodes, ms: +(performance.now() - t0).toFixed(2),
  };
}

export function greedy(destId, prefs) {
  const t0 = performance.now();
  const { places, days, people, budget } = setup(destId, prefs);
  const lists = Array.from({ length: days }, () => []);
  let cost = 0, nodes = 0;
  for (const p of [...places].sort((a, b) => b.value / b.hours - a.value / a.hours)) {
    nodes++;
    if (cost + p.cost * people > budget) continue;
    for (const l of lists) {
      const cand = [...l, p].sort((a, b) => a.i - b.i);
      if (dayTime(cand) <= DAY_HOURS) { l.splice(0, l.length, ...cand); cost += p.cost * people; break; }
    }
  }
  return pack(destId, 'Tham lam', lists, people, nodes, t0);
}

// Trạng thái: đã quyết định i địa điểm đầu. Mỗi địa điểm: xếp vào ngày d hoặc bỏ qua.
// Cắt nhánh: nếu (giá trị hiện tại + cận trên phần còn lại) <= tốt nhất đã biết thì bỏ nhánh.
export function dfs(destId, prefs, { prune = true, maxNodes = 3e6 } = {}) {
  const t0 = performance.now();
  const { places, days, people, budget } = setup(destId, prefs);
  const n = places.length;
  const suffix = Array(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) suffix[i] = suffix[i + 1] + places[i].value;
  const maxRatio = Math.max(...places.map(p => p.value / p.hours));
  const dayP = Array.from({ length: days }, () => []);
  const dayT = Array(days).fill(0);
  let best = -1, bestPlan = dayP.map(() => []), nodes = 0;

  function rec(i, value, cost, usedDays) {
    if (++nodes > maxNodes) return;
    if (value > best) { best = value; bestPlan = dayP.map(d => [...d]); }
    if (i === n) return;
    if (prune) {
      const remainTime = dayT.reduce((s, t) => s + DAY_HOURS - t, 0);
      if (value + Math.min(suffix[i], remainTime * maxRatio) <= best) return;
    }
    const p = places[i];
    for (let d = 0; d <= Math.min(usedDays, days - 1); d++) { // phá đối xứng: chỉ mở ngày trống đầu tiên
      const last = dayP[d][dayP[d].length - 1];
      const t = dayT[d] + p.hours + (last ? travel(last, p) : 0);
      if (t > DAY_HOURS || cost + p.cost * people > budget) continue;
      const prev = dayT[d];
      dayT[d] = t; dayP[d].push(p);
      rec(i + 1, value + p.value, cost + p.cost * people, d === usedDays ? usedDays + 1 : usedDays);
      dayP[d].pop(); dayT[d] = prev;
    }
    rec(i + 1, value, cost, usedDays); // bỏ qua địa điểm này
  }
  rec(0, 0, 0, 0);
  return pack(destId, prune ? 'DFS cắt nhánh' : 'DFS vét cạn', bestPlan, people, nodes, t0);
}
