// Chạy: npm run eval:plan -> so sánh Tham lam vs DFS cắt nhánh vs DFS vét cạn
import { PLACES } from '../data/places.js';
import { greedy, dfs } from '../planner.js';

const SCENARIOS = [
  { name: '2 ngày văn hóa+ẩm thực', prefs: { interests: ['culture', 'food'], days: 2, people: 1 } },
  { name: '3 ngày thiên nhiên+nghỉ dưỡng', prefs: { interests: ['nature', 'relax'], days: 3, people: 1 } },
  { name: '3 ngày biển+gia đình, 4 người', prefs: { interests: ['beach', 'family'], days: 3, people: 4 } },
  { name: '2 ngày mạo hiểm, ngân sách chặt', prefs: { interests: ['adventure', 'nature'], days: 2, people: 1, budgetPerDay: 700000 } },
  { name: '3 ngày lãng mạn, ngân sách chặt', prefs: { interests: ['romantic', 'nightlife'], days: 3, people: 2, budgetPerDay: 900000 } },
];

const rows = [];
let gainSum = 0, nodeSaveSum = 0, better = 0;
for (const dest of Object.keys(PLACES)) for (const s of SCENARIOS) {
  const g = greedy(dest, s.prefs), d = dfs(dest, s.prefs), full = dfs(dest, s.prefs, { prune: false });
  const gain = g.totalValue ? (d.totalValue - g.totalValue) / g.totalValue * 100 : 0;
  const save = (1 - d.nodes / full.nodes) * 100;
  gainSum += gain; nodeSaveSum += save; if (d.totalValue > g.totalValue) better++;
  if (d.totalValue !== full.totalValue) console.warn('CẢNH BÁO: DFS cắt nhánh khác vét cạn!', dest, s.name);
  rows.push({ 'Điểm đến': g.destination, 'Kịch bản': s.name, 'Tham lam': g.totalValue, 'DFS': d.totalValue, 'Cải thiện %': +gain.toFixed(1), 'Nút (cắt nhánh)': d.nodes, 'Nút (vét cạn)': full.nodes, 'ms DFS': d.ms });
}
console.table(rows);
console.log(`\nTổng ${rows.length} kịch bản: DFS tốt hơn tham lam ở ${better} kịch bản,`);
console.log(`cải thiện giá trị trung bình ${(gainSum / rows.length).toFixed(1)}%, giảm số nút duyệt trung bình ${(nodeSaveSum / rows.length).toFixed(1)}% nhờ cắt nhánh.`);
