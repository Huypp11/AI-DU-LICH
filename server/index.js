import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { extractPrefs } from './extract.js';
import { rank } from './recommender.js';
import { DESTINATIONS } from './data/destinations.js';
import { dfs, hasPlaces } from './planner.js';

const app = express();
app.use(cors());
app.use(express.json());

const { GEMINI_API_KEY, TAVILY_API_KEY, GEMINI_MODEL = 'gemini-flash-latest', PORT = 3001 } = process.env;
const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta';
let geminiModelsPromise;

async function tavily(query) {
  if (!TAVILY_API_KEY) return [];
  try {
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TAVILY_API_KEY}` },
      body: JSON.stringify({ query, max_results: 3, search_depth: 'basic' }),
    });
    const j = await r.json();
    return (j.results || []).map(x => ({ title: x.title, url: x.url, content: (x.content || '').slice(0, 400) }));
  } catch { return []; }
}

async function listGeminiModels() {
  if (!geminiModelsPromise) {
    geminiModelsPromise = fetch(`${GEMINI_API}/models`, { headers: { 'x-goog-api-key': GEMINI_API_KEY } })
      .then(async r => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error?.message || 'Không lấy được danh sách model Gemini');
        return (j.models || [])
          .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
          .map(m => m.name.replace(/^models\//, ''))
          .filter(name => name.startsWith('gemini-') && /flash|pro/i.test(name) && !/(image|tts|embedding|robotics)/i.test(name));
      })
      .catch(error => {
        geminiModelsPromise = undefined;
        throw error;
      });
  }
  return geminiModelsPromise;
}

function canTryAnotherModel(status, message) {
  if ([429, 503, 504].includes(status)) return true;
  if (status === 500 && /high demand|overload|temporar|try again/i.test(message)) return true;
  return [400, 404].includes(status) && /model.*(not found|unavailable|no longer|does not exist)|no longer available/i.test(message);
}

async function gemini(system, contents) {
  const failures = [];
  let candidates = [GEMINI_MODEL];
  for (let i = 0; i < Math.min(candidates.length, 4); i++) {
    const model = candidates[i];
    const r = await fetch(`${GEMINI_API}/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents }),
    });
    const j = await r.json();
    if (r.ok) return j.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';

    const message = j.error?.message || 'Gemini lỗi';
    failures.push(`${model}: ${message}`);
    if (!canTryAnotherModel(r.status, message)) throw new Error(message);
    if (i === 0) {
      try {
        const available = await listGeminiModels();
        const priority = name => /flash-lite/i.test(name) ? 0 : /flash/i.test(name) ? 1 : /pro/i.test(name) ? 2 : 3;
        candidates = [GEMINI_MODEL, ...available.filter(name => name !== GEMINI_MODEL).sort((a, b) => priority(a) - priority(b))];
      } catch (error) {
        throw new Error(`${message}; không lấy được model dự phòng: ${error.message}`);
      }
    }
  }
  throw new Error(failures.join(' | '));
}

const SYSTEM = `Bạn là trợ lý tư vấn du lịch Việt Nam. Trả lời bằng tiếng Việt, thân thiện, KHÔNG dùng markdown (không dấu * hay #).
Quy tắc:
- Chỉ trả lời câu hỏi MỚI NHẤT của người dùng; lịch sử chỉ để hiểu ngữ cảnh.
- Nếu có "BẢNG XẾP HẠNG", đó là kết quả của hệ gợi ý; hãy giữ nguyên thứ tự và diễn đạt lý do, không tự đổi điểm đến.
- Nếu có "LỊCH TRÌNH TỐI ƯU", hãy trình bày đúng lịch đó theo từng ngày, không thêm bớt địa điểm.
- Giá cả, thời tiết, sự kiện chỉ lấy từ "DỮ LIỆU WEB"; không có thì nói chưa có thông tin, không bịa.
- Nếu thiếu thông tin (ngân sách, số ngày, sở thích) hãy hỏi lại ngắn gọn.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message = '', history = [] } = req.body;
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Thiếu GEMINI_API_KEY trong server/.env' });

    const prefs = extractPrefs(message);            // chỉ dùng tin nhắn hiện tại
    const asksAboutPlace = prefs.mentioned.length > 0;
    const canRank = !asksAboutPlace && (prefs.interests.length > 0 || prefs.budgetPerDay);
    const ranking = canRank ? rank(prefs, 3) : [];

    const target = asksAboutPlace ? prefs.mentioned[0] : ranking[0]?.id;
    const plan = target && prefs.days && hasPlaces(target) ? dfs(target, prefs) : null;   // DFS cắt nhánh

    const names = asksAboutPlace
      ? prefs.mentioned.map(id => DESTINATIONS.find(d => d.id === id).name)
      : ranking.map(r => r.name);
    const web = names.length ? await tavily(`du lịch ${names.slice(0, 2).join(' ')} chi phí thời tiết lưu ý ${prefs.month ? 'tháng ' + prefs.month : ''}`) : [];

    const context = [
      `Thông tin trích xuất: ${JSON.stringify({ ...prefs, mentioned: undefined })}`,
      ranking.length ? 'BẢNG XẾP HẠNG:\n' + ranking.map((r, i) => `${i + 1}. ${r.name} (${r.score}/100) - ${r.reasons.join('; ')}`).join('\n') : '',
      web.length ? 'DỮ LIỆU WEB:\n' + web.map(w => `- ${w.title}: ${w.content}`).join('\n') : '',
      plan ? `LỊCH TRÌNH TỐI ƯU (${plan.destination}):\n` + plan.days.map(d => `Ngày ${d.day}: ` + d.places.map(p => `${p.name} (${p.hours}h, ${p.cost.toLocaleString('vi-VN')}đ/người)`).join(' -> ')).join('\n') : '',
      `Câu hỏi mới nhất: ${message}`,
    ].filter(Boolean).join('\n\n');

    const past = history.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
    while (past.length && past[0].role !== 'user') past.shift();
    const reply = await gemini(SYSTEM, [...past, { role: 'user', parts: [{ text: context }] }]);

    res.json({ reply, ranking, plan, prefs, sources: web.map(({ title, url }) => ({ title, url })) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
