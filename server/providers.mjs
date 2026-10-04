import { readFile } from 'node:fs/promises';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { timingSafeEqual } from 'node:crypto';

export const providers = JSON.parse(await readFile(new URL('../apps/director-studio/shared/providers.json', import.meta.url), 'utf8'));
export class StudioError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
function required(value, name, max = 20000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new StudioError(`${name} chưa hợp lệ`);
  return value.trim();
}
export function privateAddress(address) {
  if (address.includes(':')) {
    const a = address.toLowerCase();
    if (a.startsWith('::ffff:')) return privateAddress(a.slice(7));
    return a === '::' || a === '::1' || a.startsWith('fc') || a.startsWith('fd') || /^fe[89ab]/.test(a) || a.startsWith('ff') || a.startsWith('2001:db8:');
  }
  const [a, b] = address.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127 || a >= 224;
}
export async function customBase(env, resolve = lookup) {
  let url;
  try { url = new URL(required(env.CUSTOM_API_BASE_URL, 'CUSTOM_API_BASE_URL', 500)); } catch { throw new StudioError('Chủ web cần cấu hình CUSTOM_API_BASE_URL HTTPS', 503); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.port && url.port !== '443' || isIP(url.hostname) || url.hostname === 'localhost' || url.hostname.endsWith('.local')) throw new StudioError('Endpoint phải là tên miền HTTPS công khai');
  const addresses = await resolve(url.hostname, { all: true });
  if (!addresses.length || addresses.some(a => privateAddress(a.address))) throw new StudioError('Endpoint trỏ vào mạng riêng, không được phép');
  return url.href.replace(/\/$/, '');
}
export function authorize(req, env, localDev = false) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin) {
    let url; try { url = new URL(origin); } catch { throw new StudioError('Origin không hợp lệ', 403); }
    if (url.host !== host || !['http:', 'https:'].includes(url.protocol)) throw new StudioError('Chỉ gọi API từ chính web này', 403);
  }
  const expected = env.STUDIO_ACCESS_TOKEN;
  if (!expected) {
    if (localDev && /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host || '')) return;
    throw new StudioError('Chủ web cần đặt STUDIO_ACCESS_TOKEN trên Vercel để mở API', 503);
  }
  const value = (req.headers.authorization || '').replace(/^Bearer /, '');
  const a = Buffer.from(expected), b = Buffer.from(value);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new StudioError('Mật khẩu API của studio chưa đúng', 401);
}
async function upstream(url, init, fetcher, key) {
  const response = await fetcher(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(45000) });
  if (response.status >= 300 && response.status < 400) throw new StudioError('Nhà cung cấp đổi địa chỉ; cần kiểm tra endpoint. Không chuyển tiếp key qua redirect.', 502);
  if (!response.ok) {
    // Never echo upstream text: it can contain credentials, prompts or URLs.
    throw new StudioError(response.status === 429 ? 'Hết quota hoặc bị giới hạn tốc độ. Đã dừng; không chuyển sang API trả phí.' : `Nhà cung cấp trả HTTP ${response.status}. Kiểm tra key, model và quyền tài khoản.`, response.status === 429 ? 429 : 502);
  }
  return response;
}
export function enforceCost(body, profile, env) {
  if (body.action === 'models' || body.action === 'video-poll' || body.action === 'video-download') return;
  const freeEnv = { custom: 'CUSTOM_FREE_MODELS', apmix: 'APMIX_FREE_MODELS', experiential: 'EXPERIENTIAL_FREE_MODELS' }[profile.id];
  const freeModels = freeEnv && env[freeEnv] ? env[freeEnv].split(',').map(x => x.trim()).filter(Boolean) : profile.freeModels;
  const eligible = body.action === 'text' && freeModels.includes(body.model);
  if (body.allowPaid === true) return;
  if (!eligible || body.freeAccountConfirmed !== true) throw new StudioError('Chế độ miễn phí: cần model có free tier và xác nhận tài khoản không bật billing. API này cần bật “Cho phép dùng credit / trả phí”.', 402);
}
export async function downloadGoogleVideo(uri, key, fetcher) {
  let url = new URL(uri);
  const signal = AbortSignal.timeout(45000);
  for (let redirects = 0; redirects <= 3; redirects++) {
    const googleApi = url.hostname === 'generativelanguage.googleapis.com';
    if (url.protocol !== 'https:' || url.port || url.username || url.password || !(googleApi && url.pathname.startsWith('/v1beta/files/') || url.hostname === 'storage.googleapis.com')) throw new StudioError('Đích tải video không thuộc Google Files/Storage API', 502);
    // Signed Storage URLs require no API key. Never forward provider credentials cross-host.
    const res = await fetcher(url.href, { headers: googleApi ? { 'x-goog-api-key': key } : {}, redirect: 'manual', signal });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location || redirects === 3) throw new StudioError('Quá nhiều redirect khi tải video', 502);
      const next = new URL(location, url);
      await res.body?.cancel();
      url = next; continue;
    }
    if (!res.ok) throw new StudioError(`Google trả HTTP ${res.status} khi tải video. Kiểm tra đúng key và thời hạn file.`, 502);
    return res;
  }
  throw new StudioError('Không tải được video', 502);
}
export async function runProvider(body, env = process.env, fetcher = fetch, resolve = lookup) {
  const profile = providers.find(p => p.id === body.provider);
  if (!profile) throw new StudioError('Nhà cung cấp không được hỗ trợ');
  if (!['text', 'models', 'video-start', 'video-poll', 'video-download'].includes(body.action)) throw new StudioError('Tác vụ không hợp lệ');
  const key = required(body.apiKey || env[profile.keyEnv], 'API key', 4096);
  const base = profile.id === 'custom' ? await customBase(env, resolve) : profile.baseUrl;
  const headers = { 'Content-Type': 'application/json', ...(profile.protocol === 'google' ? { 'x-goog-api-key': key } : profile.protocol === 'anthropic' ? { 'x-api-key': key, 'anthropic-version': '2023-06-01' } : { Authorization: `Bearer ${key}` }) };
  enforceCost(body, profile, env);
  if (body.action === 'models') {
    const suffix = profile.protocol === 'google' ? '/models?pageSize=1000' : '/models';
    const raw = await (await upstream(base + suffix, { headers }, fetcher, key)).json();
    return { models: (raw.models || raw.data || []).map(m => ({ id: (m.name || m.id).replace(/^models\//, ''), name: m.displayName || m.display_name || m.id || m.name, methods: m.supportedGenerationMethods || [] })), note: 'Danh sách từ tài khoản. Có trong danh sách không đồng nghĩa miễn phí.' };
  }
  if (body.action.startsWith('video-')) {
    if (profile.id !== 'google') throw new StudioError('Video hiện dùng Google Veo. Các gateway đang nối văn bản; chưa có hợp đồng API video được xác minh.');
    if (body.action === 'video-poll') {
      const operation = required(body.operation, 'Operation', 500);
      if (!/^(?:models\/[A-Za-z0-9._-]+\/)?operations\/[A-Za-z0-9._-]+$/.test(operation)) throw new StudioError('Operation không hợp lệ');
      const raw = await (await upstream(`${base}/${operation}`, { headers }, fetcher, key)).json();
      if (raw.error) throw new StudioError('Job video thất bại hoặc bị safety filter. Kiểm tra trong Google AI Studio.', 502);
      const uri = raw.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      return { operation, done: raw.done === true, uri: uri || null, filtered: raw.response?.generateVideoResponse?.raiMediaFilteredCount || 0 };
    }
    if (body.action === 'video-download') {
      const url = new URL(required(body.uri, 'Video URI', 2000));
      if (url.protocol !== 'https:' || url.hostname !== 'generativelanguage.googleapis.com' || url.port || url.username || url.password || !url.pathname.startsWith('/v1beta/files/') || [...url.searchParams.keys()].some(k => k !== 'alt')) throw new StudioError('Video URI không thuộc Google Files API');
      return { media: await downloadGoogleVideo(url.href, key, fetcher) };
    }
    const model = required(body.model, 'Video model', 120);
    if (!/^veo-3\.1(?:-fast|-lite)?-generate-preview$/.test(model)) throw new StudioError('Chọn model Veo 3.1 đúng ID từ Google');
    const duration = Number(body.duration);
    if (![4, 6, 8].includes(duration) || !['16:9', '9:16'].includes(body.aspectRatio)) throw new StudioError('Veo hỗ trợ clip 4/6/8 giây, 16:9 hoặc 9:16. Chia cảnh 30 giây thành nhiều take.');
    const instance = { prompt: required(body.prompt, 'Prompt') };
    if (body.image) {
      const match = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(body.image);
      if (!match || match[2].length > 3500000) throw new StudioError('Ảnh PNG/JPEG quá lớn hoặc không hợp lệ');
      instance.image = { inlineData: { mimeType: match[1], data: match[2] } };
    }
    const parameters = { sampleCount: 1, durationSeconds: duration, aspectRatio: body.aspectRatio, resolution: '720p' };
    if (body.negativePrompt) parameters.negativePrompt = required(body.negativePrompt, 'Negative prompt', 5000);
    const raw = await (await upstream(`${base}/models/${model}:predictLongRunning`, { method: 'POST', headers, body: JSON.stringify({ instances: [instance], parameters }) }, fetcher, key)).json();
    if (!raw.name) throw new StudioError('Nhà cung cấp không trả operation; kiểm tra tài khoản trước khi tạo lại.', 502);
    return { operation: raw.name, done: false };
  }
  const model = required(body.model, 'Model', 200);
  if (!/^[A-Za-z0-9._:/-]+$/.test(model)) throw new StudioError('Model ID không hợp lệ');
  const prompt = required(body.prompt, 'Prompt');
  const system = typeof body.system === 'string' ? body.system.slice(0, 10000) : 'You are a professional cinema director. Return useful production advice. Never claim that you generated video when you only returned text.';
  let suffix, payload;
  const tokens = Math.min(4096, Math.max(256, Number(body.maxOutputTokens) || 2048));
  if (profile.protocol === 'google') {
    suffix = `/models/${encodeURIComponent(model)}:generateContent`;
    payload = { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: tokens, ...(body.json ? { responseMimeType: 'application/json' } : {}) } };
  } else if (profile.protocol === 'anthropic') {
    suffix = '/messages'; payload = { model, system, max_tokens: tokens, messages: [{ role: 'user', content: prompt }] };
  } else if (profile.protocol === 'responses') {
    suffix = '/responses'; payload = { model, instructions: system, input: prompt, max_output_tokens: tokens, store: false };
  } else {
    suffix = '/chat/completions'; payload = { model, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], max_tokens: tokens };
  }
  const raw = await (await upstream(base + suffix, { method: 'POST', headers, body: JSON.stringify(payload) }, fetcher, key)).json();
  const text = profile.protocol === 'google' ? (raw.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('') : profile.protocol === 'anthropic' ? (raw.content || []).filter(p => p.type === 'text').map(p => p.text).join('') : profile.protocol === 'responses' ? (raw.output || []).flatMap(o => o.content || []).filter(p => p.type === 'output_text').map(p => p.text).join('') : raw.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new StudioError('Model không trả văn bản; có thể safety filter hoặc giới hạn output.', 502);
  return { text, model, provider: profile.id, usage: raw.usage || raw.usageMetadata || null };
}
