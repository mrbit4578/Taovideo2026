import { providers, authorize, runProvider, StudioError } from '../server/providers.mjs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
export async function handle(req, res, { env = process.env, fetcher = fetch, localDev = false } = {}) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const send = (status, data) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
  if (req.method === 'GET') return send(200, { configured: !!env.STUDIO_ACCESS_TOKEN || localDev, providers: providers.map(p => ({ id: p.id, serverKey: !!env[p.keyEnv] })), policy: 'free-first; never automatic paid fallback' });
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(405, { error: 'Chỉ hỗ trợ GET/POST' }); }
  try {
    authorize(req, env, localDev);
    let body = req.body;
    if (!body) {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += Buffer.byteLength(chunk); if (size > 4000000) throw new StudioError('Request quá lớn', 413); chunks.push(chunk); }
      body = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf8');
    }
    if (typeof body === 'string') { if (Buffer.byteLength(body) > 4000000) throw new StudioError('Request quá lớn', 413); try { body = JSON.parse(body); } catch { throw new StudioError('JSON không hợp lệ'); } }
    if (!body || typeof body !== 'object' || Array.isArray(body) || Buffer.byteLength(JSON.stringify(body)) > 4000000) throw new StudioError('Request không hợp lệ', 413);
    const result = await runProvider(body, env, fetcher);
    if (result.media) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="director-take.mp4"');
      await pipeline(Readable.fromWeb(result.media.body), res);
      return;
    }
    return send(200, result);
  } catch (error) {
    if (res.headersSent) { res.destroy(); return; }
    return send(error instanceof StudioError ? error.status : 502, { error: error instanceof StudioError ? error.message : 'Không kết nối được nhà cung cấp; kiểm tra cấu hình và thử lại sau. Job video đã nhận có thể tiếp tục chạy; không tạo lại trước khi kiểm tra.' });
  }
}
export default handle;
