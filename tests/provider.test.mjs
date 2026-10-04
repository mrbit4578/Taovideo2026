import { test } from 'node:test';
import assert from 'node:assert/strict';
import { providers, runProvider, authorize, customBase, privateAddress, downloadGoogleVideo } from '../server/providers.mjs';
import { handle } from '../api/studio.mjs';
const key = 'test-only-key-never-live';
const textRequest = { action: 'text', provider: 'google', model: 'gemini-2.5-flash', apiKey: key, freeAccountConfirmed: true, allowPaid: false, prompt: 'Write one cinema shot.' };
function mocked(raw) { const calls = []; return { calls, fetcher: async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify(raw), { headers: { 'Content-Type': 'application/json' } }); } }; }
test('free policy blocks paid models and video BEFORE making a request', async () => {
  let calls = 0; const fetcher = () => { calls++; throw new Error('must not call'); };
  for (const request of [{ ...textRequest, freeAccountConfirmed: false }, { ...textRequest, provider: 'openai', model: 'test-model' }, { ...textRequest, action: 'video-start', model: 'veo-3.1-lite-generate-preview' }]) await assert.rejects(runProvider(request, {}, fetcher), e => e.status === 402);
  assert.equal(calls, 0);
});
test('Gemini free text uses key header, not URL, and returns model output', async () => {
  const m = mocked({ candidates: [{ content: { parts: [{ text: 'Shot A' }] } }] });
  assert.equal((await runProvider(textRequest, {}, m.fetcher)).text, 'Shot A');
  assert.ok(!m.calls[0].url.includes(key)); assert.equal(m.calls[0].init.headers['x-goog-api-key'], key);
});
test('OpenAI, Claude and gateways implement their own wire contracts', async () => {
  const fixtures = { openai: { output: [{ content: [{ type: 'output_text', text: 'shot' }] }] }, claude: { content: [{ type: 'text', text: 'shot' }] }, apmix: { choices: [{ message: { content: 'shot' } }] }, experiential: { choices: [{ message: { content: 'shot' } }] }, groq: { choices: [{ message: { content: 'shot' } }] } };
  for (const [provider, raw] of Object.entries(fixtures)) { const m = mocked(raw); const result = await runProvider({ ...textRequest, provider, model: 'test-model', allowPaid: true }, {}, m.fetcher); assert.equal(result.text, 'shot'); const body = JSON.parse(m.calls[0].init.body); if (provider === 'openai') { assert.equal(body.store, false); assert.ok(m.calls[0].url.endsWith('/responses')); } if (provider === 'claude') assert.equal(m.calls[0].init.headers['anthropic-version'], '2023-06-01'); }
});
test('gateway free allowlist is explicit and model-specific', async () => {
  const m = mocked({ choices: [{ message: { content: 'trial shot' } }] });
  await assert.rejects(runProvider({ ...textRequest, provider: 'apmix', model: 'trial-model' }, {}, m.fetcher), e => e.status === 402);
  assert.equal((await runProvider({ ...textRequest, provider: 'apmix', model: 'trial-model' }, { APMIX_FREE_MODELS: 'trial-model' }, m.fetcher)).text, 'trial shot');
  assert.equal(m.calls.length, 1);
});
test('429 and upstream errors do not leak keys or trigger fallback', async () => {
  let count = 0;
  await assert.rejects(runProvider(textRequest, {}, async () => { count++; return new Response('secret ' + key, { status: 429 }); }), e => e.status === 429 && !e.message.includes(key)); assert.equal(count, 1);
  await assert.rejects(runProvider(textRequest, {}, async () => new Response(null, { status: 302, headers: { location: 'https://evil.example' } })), /redirect/);
});
test('model inventory uses account endpoint and is not a billed generation', async () => {
  const m = mocked({ models: [{ name: 'models/gemini-test', displayName: 'Gemini Test' }] });
  const result = await runProvider({ ...textRequest, action: 'models', freeAccountConfirmed: false }, {}, m.fetcher); assert.equal(result.models[0].id, 'gemini-test'); assert.ok(m.calls[0].url.includes('/models?')); assert.ok(!m.calls[0].init.body);
});
test('Veo job submission and polling are separate, no background loops', async () => {
  const m = mocked({ name: 'models/veo-3.1-lite-generate-preview/operations/op_123' });
  const result = await runProvider({ ...textRequest, action: 'video-start', model: 'veo-3.1-lite-generate-preview', allowPaid: true, duration: 8, aspectRatio: '16:9', image: 'data:image/png;base64,aGVsbG8=' }, {}, m.fetcher);
  assert.ok(result.operation.endsWith('op_123')); assert.equal(m.calls.length, 1); assert.equal(JSON.parse(m.calls[0].init.body).parameters.durationSeconds, 8);
  await assert.rejects(runProvider({ ...textRequest, action: 'video-start', model: 'veo-3.1-lite-generate-preview', allowPaid: true, duration: 30, aspectRatio: '16:9' }, {}, m.fetcher), /4\/6\/8/);
  const poll = mocked({ done: true, response: { generateVideoResponse: { generatedSamples: [{ video: { uri: 'https://generativelanguage.googleapis.com/v1beta/files/v:download?alt=media' } }] } } });
  assert.equal((await runProvider({ ...textRequest, action: 'video-poll', operation: result.operation }, {}, poll.fetcher)).done, true);
  await assert.rejects(runProvider({ ...textRequest, action: 'video-poll', operation: 'https://evil.example/' }, {}, poll.fetcher), /Operation/);
});
test('media fetch never forwards keys to arbitrary hosts', async () => {
  let count = 0;
  for (const uri of ['http://127.0.0.1/file', 'https://evil.example/video', 'https://generativelanguage.googleapis.com.evil.example/v1beta/files/v', 'https://generativelanguage.googleapis.com/v1beta/files/v?key=secret']) await assert.rejects(runProvider({ ...textRequest, action: 'video-download', uri }, {}, () => { count++; }));
  assert.equal(count, 0);
  const calls = [];
  await downloadGoogleVideo('https://generativelanguage.googleapis.com/v1beta/files/v:download?alt=media', key, async (url, init) => { calls.push({ url, init }); return calls.length === 1 ? new Response(null, { status: 302, headers: { location: 'https://storage.googleapis.com/video-bucket/clip.mp4?signature=test' } }) : new Response('test-video'); });
  assert.equal(calls[0].init.headers['x-goog-api-key'], key);
  assert.equal(calls[1].init.headers['x-goog-api-key'], undefined);
  let redirects = 0;
  await assert.rejects(downloadGoogleVideo('https://generativelanguage.googleapis.com/v1beta/files/v', key, async () => { redirects++; return new Response(null, { status: 302, headers: { location: 'https://evil.example/video' } }); }));
  assert.equal(redirects, 1);
});
test('custom endpoint is owner-configured HTTPS and rejects private addresses', async () => {
  const resolve = async () => [{ address: '93.184.216.34' }];
  assert.equal(await customBase({ CUSTOM_API_BASE_URL: 'https://gateway.example/v1/' }, resolve), 'https://gateway.example/v1');
  for (const base of ['http://gateway.example/v1', 'https://127.0.0.1/v1', 'https://user:password@gateway.example/v1']) await assert.rejects(customBase({ CUSTOM_API_BASE_URL: base }, resolve));
  await assert.rejects(customBase({ CUSTOM_API_BASE_URL: 'https://gateway.example' }, async () => [{ address: '10.0.0.1' }]));
  for (const address of ['::1', '::ffff:127.0.0.1', 'fd00::1', '169.254.169.254', '192.168.1.2']) assert.equal(privateAddress(address), true);
});
test('API is locked on Vercel until studio token is configured', () => {
  const req = { headers: { host: 'studio.vercel.app', origin: 'https://studio.vercel.app' } };
  assert.throws(() => authorize(req, {}), e => e.status === 503);
  assert.throws(() => authorize(req, { STUDIO_ACCESS_TOKEN: 'private-test-password' }), e => e.status === 401);
  authorize({ headers: { ...req.headers, authorization: 'Bearer private-test-password' } }, { STUDIO_ACCESS_TOKEN: 'private-test-password' });
  assert.throws(() => authorize({ headers: { ...req.headers, origin: 'https://evil.example', authorization: 'Bearer private-test-password' } }, { STUDIO_ACCESS_TOKEN: 'private-test-password' }), e => e.status === 403);
});
test('handler errors are sanitized; no secret enters JSON response', async () => {
  const req = { method: 'POST', headers: { host: 'localhost:5174' }, body: { ...textRequest, allowPaid: true } };
  let status, output; const res = { setHeader() {}, set statusCode(v) { status = v; }, end(v) { output = v; } };
  await handle(req, res, { env: {}, localDev: true, fetcher: async () => { throw new Error('secret:' + key); } });
  assert.equal(status, 502); assert.ok(!output.includes(key));
});
