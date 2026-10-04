import profiles from '../shared/providers.json';
export type ApiSession = { provider: string; model: string; apiKey: string; accessToken: string; allowPaid: boolean; freeAccountConfirmed: boolean; serverKey: boolean };
export const defaultSession: ApiSession = { provider: 'google', model: 'gemini-2.5-flash', apiKey: '', accessToken: '', allowPaid: false, freeAccountConfirmed: false, serverKey: false };
let session = { ...defaultSession };
export const providerProfiles = profiles;
export function setApiSession(value: ApiSession) { session = { ...value }; }
export function getApiSession() { return { ...session }; }
export const apiAvailable = () => !!session.model && !!(session.apiKey || session.serverKey);
export async function callStudio(action: string, data: Record<string, unknown> = {}, override?: ApiSession) {
  const s = override || session;
  const res = await fetch('/api/studio', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(s.accessToken ? { Authorization: `Bearer ${s.accessToken}` } : {}) }, body: JSON.stringify({ provider: s.provider, model: s.model, apiKey: s.apiKey || undefined, allowPaid: s.allowPaid, freeAccountConfirmed: s.freeAccountConfirmed, action, ...data }) });
  if (!res.ok) { const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` })); throw new Error(error.error || `HTTP ${res.status}`); }
  return action === 'video-download' ? res.blob() : res.json();
}
export async function directorJson<T>(prompt: string, schema: Record<string, unknown>, system: string): Promise<T> {
  if (window.typeAi?.available) return await window.typeAi.complete(prompt, { system, schema: schema as Record<string, unknown> & { type: 'object' }, maxOutputTokens: 1024 }) as T;
  const result = await callStudio('text', { prompt: `${prompt}\n\nReturn only valid JSON matching this schema:\n${JSON.stringify(schema)}`, system, json: true, maxOutputTokens: 4096 });
  const text = result.text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  try { return JSON.parse(text) as T; } catch { throw new Error('Model trả JSON không hợp lệ; dữ liệu dự án chưa được thay đổi.'); }
}
