import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const out = new URL('../_audit/validation/', import.meta.url);
await mkdir(out, { recursive: true });
const nodes = [];
const edges = [];
for (let i = 1; i <= 2; i++) {
  nodes.push({ id: `prompt-${i}`, type: 'textPrompt', position: { x: 0, y: i * 100 }, data: { prompt: `Local render test ${i}` } });
  nodes.push({ id: `shot-${i}`, type: 'videoGenerate', position: { x: 300, y: i * 100 }, data: { duration: 2, aspectRatio: '16:9', provider: 'local', model: 'test', customName: `Smoke clip ${i}` } });
  edges.push({ id: `text-${i}`, source: `prompt-${i}`, target: `shot-${i}` }, { id: `merge-${i}`, source: `shot-${i}`, target: 'merge' });
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${i === 1 ? 'blue' : 'orange'}:s=640x360:r=24:d=2`, '-f', 'lavfi', '-i', `sine=frequency=${i === 1 ? 440 : 660}:sample_rate=48000:duration=2`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', fileURLToPath(new URL(`render-clip-${i}.mp4`, out))]);
}
nodes.push({ id: 'merge', type: 'videoMerge', position: { x: 600, y: 100 }, data: {} });
await writeFile(new URL('render-smoke-workflow.json', out), JSON.stringify({ version: 1, page: { id: 'local-render-smoke', name: 'Local render smoke · 4 giây', snapshot: { nodes, edges } } }, null, 2));
console.log('Created two 2-second local clips with audio and a 4-second test workflow. No provider calls.');
