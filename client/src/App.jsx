import { useState, useRef, useEffect } from 'react';

const HELLO = { role: 'bot', text: 'Xin chào! Hãy cho mình biết bạn thích gì (biển, núi, văn hóa...), ngân sách, số ngày và số người nhé.' };

export default function App() {
  const [msgs, setMsgs] = useState([HELLO]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const history = msgs.slice(1).map(({ role, text }) => ({ role, text }));
    setMsgs(m => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history }) });
      const j = await r.json();
      setMsgs(m => [...m, r.ok ? { role: 'bot', text: j.reply, ranking: j.ranking, plan: j.plan, sources: j.sources } : { role: 'bot', text: 'Lỗi: ' + j.error }]);
    } catch {
      setMsgs(m => [...m, { role: 'bot', text: 'Không kết nối được server (đã chạy chưa?).' }]);
    }
    setLoading(false);
  }

  return (
    <div className="card">
      <header>
        <h1>AI TƯ VẤN DU LỊCH</h1>
        <p>Hệ gợi ý tự xây dựng + Tavily + Gemini</p>
      </header>
      <div className="chat">
        {msgs.map((m, i) => (
          <div key={i} className={'msg ' + m.role}>
            <div className="text">{m.text}</div>
            {m.ranking?.length > 0 && (
              <div className="rank">
                <b>XẾP HẠNG TỪ HỆ GỢI Ý</b>
                {m.ranking.map(r => (
                  <div key={r.id} className="item">
                    <strong>{r.name} · {r.score}/100</strong>
                    <small>{r.reasons.join(' · ')}</small>
                  </div>
                ))}
              </div>
            )}
            {m.plan && (
              <div className="rank plan">
                <b>LỊCH TRÌNH TỐI ƯU · {m.plan.destination}</b>
                {m.plan.days.map(d => (
                  <div key={d.day} className="item">
                    <strong>Ngày {d.day} ({d.hours}h)</strong>
                    <small>{d.places.map(p => p.name).join(' → ')}</small>
                  </div>
                ))}
                <small>{m.plan.algo} · {m.plan.nodes} nút · {m.plan.ms} ms</small>
              </div>
            )}
            {m.sources?.length > 0 && (
              <div className="src">Nguồn: {m.sources.map((s, k) => <a key={k} href={s.url} target="_blank" rel="noreferrer">{k + 1}</a>)}</div>
            )}
          </div>
        ))}
        {loading && <div className="msg bot"><div className="text">Đang suy nghĩ...</div></div>}
        <div ref={endRef} />
      </div>
      <div className="bar">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Nhắn cho Cẩm Nang..." />
        <button onClick={send} disabled={loading}>Gửi</button>
      </div>
    </div>
  );
}
