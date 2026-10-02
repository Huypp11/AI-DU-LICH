// Trích xuất sở thích từ CHÍNH tin nhắn hiện tại (không đọc tin cũ -> tránh lỗi lạc đề).
import { DESTINATIONS } from './data/destinations.js';

export const fold = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

const KW = {
  beach: ['bien','tam bien','bai bien','dao','hai san'],
  culture: ['van hoa','lich su','co kinh','di san','di tich','pho co'],
  nature: ['nui','thien nhien','trekking','rung','ho','thac','hang dong'],
  food: ['an uong','am thuc','dac san','an ngon','hai san'],
  adventure: ['phieu luu','kham pha','mao hiem','leo nui','trekking','phuot'],
  relax: ['nghi duong','thu gian','yen tinh','chill','resort'],
  nightlife: ['ve dem','bar','pub','soi dong','song ve dem'],
  romantic: ['cap doi','lang man','nguoi yeu','ban gai','ban trai','trang mat','honeymoon'],
  family: ['gia dinh','con nho','tre em','bo me','ong ba'],
};
const has = (t, k) => new RegExp(`(^|[^a-z])${k}([^a-z]|$)`).test(t);

export function extractPrefs(message) {
  const t = fold(message);
  const interests = Object.keys(KW).filter(f => KW[f].some(k => has(t, k)));

  let budgetTotal = null;
  const dotted = t.match(/(\d{1,3}(?:\.\d{3})+)\s*(d|dong|vnd)?/);
  const unit = t.match(/(\d+(?:[.,]\d+)?)\s*(trieu|tr|nghin|ngan|k)\b/);
  if (dotted) budgetTotal = Number(dotted[1].replace(/\./g, ''));
  else if (unit) {
    const n = parseFloat(unit[1].replace(',', '.'));
    budgetTotal = unit[2].startsWith('tr') ? n * 1e6 : n * 1e3;
  }

  const days = (t.match(/(\d+)\s*ngay/) || [])[1];
  let people = (t.match(/(\d+)\s*(nguoi|khach|ban)\b/) || [])[1];
  if (!people && (interests.includes('romantic') || /hai nguoi/.test(t))) people = 2;
  if (!people && /mot minh|di 1 minh/.test(t)) people = 1;
  people = Number(people) || 1;
  const nDays = Number(days) || null;
  const perDayFlag = /(moi ngay|\/ngay|mot ngay)/.test(t);
  const budgetPerDay = budgetTotal ? Math.round(perDayFlag ? budgetTotal : budgetTotal / (nDays || 1) / people) : null;

  const month = Number((t.match(/thang\s*(\d{1,2})/) || [])[1]) || null;
  const mentioned = DESTINATIONS.filter(d => t.includes(fold(d.name)) || t.includes(d.id.replace('-', ''))).map(d => d.id);

  return { interests, budgetTotal, budgetPerDay, days: nDays, people, month, mentioned };
}
