import { useEffect, useState } from 'react';
import { callStudio, getApiSession, providerProfiles, setApiSession, type ApiSession } from './providerClient';
export default function ProviderPanel({ onChange }: { onChange: () => void }) {
  const [session, setSession] = useState(getApiSession);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false);
  const [serverKeys, setServerKeys] = useState<Record<string, boolean>>({});
  const profile = providerProfiles.find(p => p.id === session.provider)!;
  useEffect(() => { fetch('/api/studio').then(r => r.json()).then(data => { const keys = Object.fromEntries((data.providers || []).map((p: { id: string; serverKey: boolean }) => [p.id, p.serverKey])); setServerKeys(keys); setSession(s => { const next = { ...s, serverKey: !!keys[s.provider] }; setApiSession(next); return next; }); if (!data.configured) setStatus('Vercel cần STUDIO_ACCESS_TOKEN. Tiền kỳ và nhập/ghép clip vẫn hoạt động.'); }).catch(() => setStatus('API server chưa chạy. Khởi động bằng npm run dev ở thư mục dự án.')); }, []);
  function update(patch: Partial<ApiSession>) { const next = { ...session, ...patch, serverKey: !!serverKeys[patch.provider || session.provider] }; setSession(next); setApiSession(next); onChange(); }
  async function listModels() { setBusy(true); setStatus('Đang đọc model…'); try { const result = await callStudio('models'); setModels(result.models); setStatus(`Đọc được ${result.models.length} model; chưa gọi sinh nội dung.`); } catch (e) { setStatus((e as Error).message); } finally { setBusy(false); } }
  return <section className="cinema-section">
    <div className="cinema-heading"><div><div className="cinema-eyebrow">KẾT NỐI MÔ HÌNH</div><h1>API của bạn. Chi phí do bạn chọn.</h1><p>Ưu tiên quota miễn phí; hết quota sẽ dừng. Không tự chuyển sang model trả phí.</p></div><span className="cinema-pill">Khoá chỉ giữ trong phiên đang mở</span></div>
    <div className="cinema-grid two"><div className="card cinema-stack"><h2>Thiết lập kết nối</h2>
      <label>Nhà cung cấp<select className="input" value={session.provider} onChange={e => { const p = providerProfiles.find(x => x.id === e.target.value)!; setModels([]); update({ provider: p.id, model: p.defaultModel, apiKey: '', allowPaid: false, freeAccountConfirmed: false }); }}>{providerProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <p className="text-small text-muted">{profile.note}</p>
      {profile.keyUrl && <a href={profile.keyUrl} target="_blank" rel="noreferrer">Tạo API key tại {profile.name} ↗</a>}
      <label>Mật khẩu API của studio<input className="input" autoComplete="off" type="password" value={session.accessToken} onChange={e => update({ accessToken: e.target.value })} placeholder="STUDIO_ACCESS_TOKEN trên Vercel" /></label>
      <label>API key {serverKeys[session.provider] ? '· có key trên server' : ''}<input className="input" type="password" autoComplete="off" value={session.apiKey} onChange={e => update({ apiKey: e.target.value })} placeholder={serverKeys[session.provider] ? 'Để trống để dùng key server' : 'Nhập key của nhà cung cấp'} /></label>
      <label>Model ID<input className="input mono" list="studio-model-list" value={session.model} onChange={e => update({ model: e.target.value })} placeholder="Model từ tài khoản của bạn" /><datalist id="studio-model-list">{models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</datalist></label>
      <div className="cinema-actions"><button className="button" disabled={busy} onClick={listModels}>Đọc model từ API</button><button className="button" onClick={() => { update({ apiKey: '', accessToken: '' }); setStatus('Đã xoá key nhập và mật khẩu khỏi phiên.'); }}>Xoá khoá khỏi phiên</button></div>
    </div><div className="card cinema-stack"><h2>Chính sách miễn phí trước</h2>
      <label className="cinema-check"><input type="checkbox" checked={session.freeAccountConfirmed} onChange={e => update({ freeAccountConfirmed: e.target.checked })} />Tôi đã kiểm tra key dùng free tier, tài khoản không bật billing.</label>
      <p>Chỉ cho phép model văn bản có free tier trong danh sách đã kiểm tra. Máy chủ không thể xác minh billing tài khoản qua API key.</p>
      <label className="cinema-check"><input type="checkbox" checked={session.allowPaid} onChange={e => update({ allowPaid: e.target.checked })} />Cho phép dùng credit / trả phí với kết nối này.</label>
      <p className="text-small">Veo cần lựa chọn này. Tạo một take mỗi lần; không tự chạy 26 cảnh. Credit khuyến mãi có thể hết.</p>
      {profile.pricingUrl && <a href={profile.pricingUrl} target="_blank" rel="noreferrer">Kiểm tra giá và quota ↗</a>}
      <div className="guide">GPT, Claude và gateway viết kịch bản, shot list và prompt. API video hiện đã nối Google Veo. Endpoint tương thích OpenAI khác cấu hình trên server.</div><p role="status">{status}</p>
    </div></div>
  </section>;
}
